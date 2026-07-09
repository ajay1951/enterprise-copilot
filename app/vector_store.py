from qdrant_client import QdrantClient
import logging
from qdrant_client.http import models
from qdrant_client.http.exceptions import UnexpectedResponse
import os
from pathlib import Path
from typing import List, Dict, Any
import threading
from uuid import uuid4
from langchain_huggingface import HuggingFaceEndpointEmbeddings
from unstructured.partition.auto import partition
from unstructured.documents.elements import Image, Table
from langchain_text_splitters import RecursiveCharacterTextSplitter
from qdrant_client import models as qdrant_models
from app.config import (
    QDRANT_URL,
    QDRANT_API_KEY,
    COLLECTION_NAME,
    EMBEDDING_MODEL,
    HF_TOKEN,
    SEARCH_RESULT_LIMIT,
)

# Configure logging for this module
logger = logging.getLogger(__name__)

# Use HuggingFace Inference API for embeddings (cloud-based, free)
embeddings_client = HuggingFaceEndpointEmbeddings(
    huggingfacehub_api_token=HF_TOKEN,
    model=EMBEDDING_MODEL,
)

_EMBEDDING_VECTOR_SIZE = None

# A thread-local storage for the Qdrant client. This is a robust way to
# manage client instances in a multi-threaded server environment, especially
# with hot-reloading, as it isolates client objects on a per-thread basis.
_thread_local = threading.local()


def get_qdrant_client() -> QdrantClient:
    """
    Initializes and returns a Qdrant client, cached on a per-thread basis.
    This approach is resilient to hot-reloading issues in development servers.
    """
    client = getattr(_thread_local, 'qdrant_client', None)

    # If the client doesn't exist for this thread, or if it's in a broken state
    # (e.g., after a hot-reload), create a new one.
    if client is None or (not hasattr(client, "search") and not hasattr(client, "search_points") and not hasattr(client, "query_points")):
        logger.info("Initializing new Qdrant client for this thread.")
        client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY, timeout=120.0)

        # Final check: if the new client is still broken, it's a fatal installation issue.
        if not hasattr(client, "search") and not hasattr(client, "search_points") and not hasattr(client, "query_points"):
            # Log the attributes of the broken object for deep debugging.
            logger.critical(f"Newly created QdrantClient is invalid. Attributes: {dir(client)}")
            raise RuntimeError(
                "Failed to create a valid Qdrant client. The object is invalid immediately after creation. "
                "Please verify the 'qdrant-client' library installation."
            )
        _thread_local.qdrant_client = client
    return client


def get_embedding_vector_size() -> int:
    """Resolve the embedding vector size from the configured embedding model."""
    global _EMBEDDING_VECTOR_SIZE
    if _EMBEDDING_VECTOR_SIZE is None:
        sample_vector = embeddings_client.embed_query("dimension check")
        # The result is expected to be a list of floats.
        _EMBEDDING_VECTOR_SIZE = len(sample_vector)
    return _EMBEDDING_VECTOR_SIZE


def init_collection():
    """Initialize the Qdrant collection if it doesn't exist."""
    client = get_qdrant_client()
    vector_size = get_embedding_vector_size()
    try:
        collection_info = client.get_collection(collection_name=COLLECTION_NAME)
        # We need a hybrid collection with named vectors 'text-dense' and 'text-sparse'
        vectors_config = collection_info.config.params.vectors
        
        if not isinstance(vectors_config, dict) or "text-dense" not in vectors_config:
            logger.warning(
                f"Collection '{COLLECTION_NAME}' exists but is not configured for Hybrid Search. "
                "Recreating collection."
            )
            client.delete_collection(collection_name=COLLECTION_NAME)
            raise ValueError("Recreating collection due to schema mismatch")
            
        logger.info(f"Collection '{COLLECTION_NAME}' already exists and is correctly configured.")
    except (UnexpectedResponse, ValueError):
        # Create a hybrid collection (dense + sparse)
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config={
                "text-dense": models.VectorParams(
                    size=vector_size,
                    distance=models.Distance.COSINE,
                )
            },
            sparse_vectors_config={
                "text-sparse": models.SparseVectorParams(
                    index=models.SparseIndexParams(on_disk=False)
                )
            }
        )
        logger.info(f"Hybrid Collection '{COLLECTION_NAME}' created.")
        
        # Load documents from the knowledge_base directory
        docs_to_load = []
        kb_path = Path(__file__).parent.parent / "knowledge_base"
        if kb_path.is_dir():
            for filename in os.listdir(kb_path):
                if filename.endswith(".md"):
                    with open(kb_path / filename, "r", encoding="utf-8") as f:
                        content = f.read()
                    # Extract title from the first line if it's a markdown header
                    first_line = content.split('\n', 1)[0]
                    if first_line.startswith("# "):
                        title = first_line[2:].strip()
                    else:
                        title = filename.replace("_", " ").replace(".md", "").title()
                    
                    docs_to_load.append({
                        "title": title,
                        "content": content,
                        "metadata": {"source": filename}
                    })
        
        if not docs_to_load:
            logger.warning("No documents found in knowledge_base directory. No data will be indexed.")
            return
        
        # Generate embeddings for all documents at once
        contents = [doc["content"] for doc in docs_to_load]
        vectors = embeddings_client.embed_documents(contents)
        
        points = []
        for i, doc in enumerate(docs_to_load):
            points.append(models.PointStruct(
                id=str(uuid4()),  # Use a robust UUID for the ID
                vector={"text-dense": vectors[i]},
                payload=doc
            ))
        
        if points:
            batch_size = 10
            for i in range(0, len(points), batch_size):
                batch = points[i:i+batch_size]
                client.upsert(collection_name=COLLECTION_NAME, points=batch)
        logger.info(f"Inserted {len(points)} documents from 'knowledge_base' into '{COLLECTION_NAME}'.")

def perform_vector_search(query: str) -> List[Dict[str, Any]]:
    """
    Search the enterprise knowledge base for information relevant to the query.
    Uses Qdrant to perform a vector search against the indexed documents.
    Returns a list of the most relevant documents, including content, metadata, and similarity score.
    """
    try:
        client = get_qdrant_client()
        query_vector = embeddings_client.embed_query(query)

        # To support different versions of qdrant-client, we check for the modern method first.
        if hasattr(client, "search"):
            # Use the modern 'search' method (for qdrant-client >= 1.7.0).
            logger.debug("Using modern 'search' method for Qdrant client.")
            search_result = client.search(
                collection_name=COLLECTION_NAME,
                query_vector=query_vector,
                query_filter=None,
                limit=SEARCH_RESULT_LIMIT,
                with_payload=True,
                with_vectors=False,
                query_vector_name="text-dense"
            )
            points = search_result or []
        elif hasattr(client, "query_points"):
            logger.debug("Using 'query_points' method for Qdrant client.")
            search_result = client.query_points(
                collection_name=COLLECTION_NAME,
                query=query_vector,
                using="text-dense",
                limit=SEARCH_RESULT_LIMIT,
                with_payload=True,
                with_vectors=False,
            )
            points = search_result.points if hasattr(search_result, "points") else (search_result or [])
        elif hasattr(client, "search_points"):
            # Use the older 'search_points' method for legacy clients.
            logger.debug("Using legacy 'search_points' method for Qdrant client.")
            search_result = client.search_points(
                collection_name=COLLECTION_NAME,
                query_vector=query_vector,
                limit=SEARCH_RESULT_LIMIT,
                with_payload=True,
                with_vectors=False,
                query_vector_name="text-dense"
            )
            points = search_result or []
        else:
            # This should not happen with a valid qdrant-client installation
            raise AttributeError("QdrantClient object has neither 'search', 'query_points' nor 'search_points' methods. Please check your qdrant-client installation.")

        results = []
        for point in points:
            # The payload from a qdrant search result is a dictionary.
            payload = point.payload or {}
            results.append({
                "id": str(point.id),
                "title": payload.get("title", "No Title"),
                "content": payload.get("content", ""),
                "metadata": payload.get("metadata", {}),
                "score": point.score,
            })

        return results

    except Exception as e:
        logger.error(f"Error searching knowledge base: {e}", exc_info=True)
        return []

def ingest_document(title: str, file_path: str, original_filename: str):
    """
    Ingest a document using Unstructured for Multi-Modal RAG (Text, Tables, Images).
    """
    client = get_qdrant_client()
    logger.info(f"Starting unstructured ingestion for {original_filename}")
    
    # Temporarily add standard Tesseract path to environment variable just in case
    import os
    tesseract_path = r"C:\Program Files\Tesseract-OCR"
    if os.path.exists(tesseract_path) and tesseract_path not in os.environ.get("PATH", ""):
        os.environ["PATH"] += os.pathsep + tesseract_path

    try:
        # Extract elements using unstructured with OCR
        elements = partition(filename=file_path, strategy="hi_res", pdf_extract_images=True)
    except Exception as e:
        logger.warning(f"Failed to use hi_res strategy (likely Tesseract missing), falling back to fast strategy: {e}")
        # Fallback to fast strategy which skips OCR
        elements = partition(filename=file_path, strategy="fast")
    
    chunks = []
    current_text = ""
    
    for el in elements:
        if isinstance(el, Image):
            # Mock VLM Call: In a real system, send el.metadata.image_path to GPT-4o Vision
            # We will generate a mock description to demonstrate the architecture
            img_desc = f"[Extracted Image from {original_filename} Page {getattr(el.metadata, 'page_number', 'unknown')}]: Diagram showing workflow."
            chunks.append({
                "text": img_desc,
                "metadata": {"source": original_filename, "type": "image", "page": getattr(el.metadata, 'page_number', 1)}
            })
        elif isinstance(el, Table):
            chunks.append({
                "text": str(el), # Renders as text/markdown
                "metadata": {"source": original_filename, "type": "table", "page": getattr(el.metadata, 'page_number', 1)}
            })
        else:
            current_text += str(el) + "\n\n"
            
    if current_text.strip():
        # Use a proper recursive character text splitter with overlap
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            separators=["\n\n", "\n", ".", " ", ""]
        )
        split_texts = text_splitter.split_text(current_text.strip())
        for split_text in split_texts:
            chunks.append({
                "text": split_text,
                "metadata": {"source": original_filename, "type": "text", "page": getattr(elements[-1].metadata if elements else None, 'page_number', 1)}
            })
        
    logger.info(f"Extracted {len(chunks)} chunks (text, tables, images) from {original_filename}")
    
    # We will upload dense vectors for now, as sparse vectors require a specific embedding model setup
    # In a fully complete hybrid setup, we would generate sparse vectors here as well.
    points = []
    for i, chunk in enumerate(chunks):
        # Generate dense embedding
        dense_vec = embeddings_client.embed_query(chunk["text"])
        
        doc_payload = {
            "title": title,
            "content": chunk["text"],
            "metadata": chunk["metadata"]
        }
        
        points.append(models.PointStruct(
            id=str(uuid4()),
            vector={"text-dense": dense_vec}, # Named vector
            payload=doc_payload
        ))
        
    if points:
        batch_size = 10
        for i in range(0, len(points), batch_size):
            batch = points[i:i+batch_size]
            client.upsert(collection_name=COLLECTION_NAME, points=batch)
            logger.info(f"Ingested batch {i//batch_size + 1}/{(len(points)+batch_size-1)//batch_size}")
            
        logger.info(f"Ingested {len(points)} multi-modal chunks into knowledge base.")