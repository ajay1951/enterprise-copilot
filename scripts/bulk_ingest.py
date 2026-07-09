import os
import sys
import logging
import glob

# Add root directory to python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.vector_store import get_vector_store

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def bulk_ingest(data_dir: str):
    """Read all PDFs and TXTs from a directory and chunk/upload them to Qdrant."""
    load_dotenv()
    
    if not os.path.exists(data_dir):
        logger.error(f"Directory {data_dir} does not exist. Please create it and add your documents.")
        sys.exit(1)
        
    pdf_files = glob.glob(os.path.join(data_dir, "**/*.pdf"), recursive=True)
    txt_files = glob.glob(os.path.join(data_dir, "**/*.txt"), recursive=True)
    
    all_files = pdf_files + txt_files
    if not all_files:
        logger.warning(f"No .pdf or .txt files found in {data_dir}.")
        return

    logger.info(f"Found {len(all_files)} files. Starting processing...")
    
    docs = []
    for filepath in all_files:
        logger.info(f"Loading {filepath}...")
        try:
            if filepath.endswith('.pdf'):
                loader = PyPDFLoader(filepath)
            else:
                loader = TextLoader(filepath)
            docs.extend(loader.load())
        except Exception as e:
            logger.error(f"Error loading {filepath}: {e}")

    logger.info(f"Loaded {len(docs)} raw document pages/sections. Splitting...")
    
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1024,
        chunk_overlap=100,
        length_function=len
    )
    
    chunks = text_splitter.split_documents(docs)
    logger.info(f"Created {len(chunks)} high-granularity chunks. Uploading to Qdrant...")
    
    vector_store = get_vector_store()
    try:
        vector_store.add_documents(chunks)
        logger.info("✅ Bulk ingestion completed successfully!")
    except Exception as e:
        logger.error(f"Failed to upload to Qdrant: {e}")

if __name__ == "__main__":
    # Expect data to be in enterprise-copilot/data/
    target_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
    bulk_ingest(target_dir)
