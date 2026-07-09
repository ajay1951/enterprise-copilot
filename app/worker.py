"""
Celery Worker Configuration
---------------------------
Initializes the Celery application bound to the Redis broker. 
This offloads heavy I/O tasks (like chunking and embedding massive PDFs) 
from the main FastAPI event loop to prevent API timeouts during document ingestion.
"""
import os
from celery import Celery
import logging
from app.vector_store import ingest_document

redis_url = os.getenv("REDIS_URL", "redis://redis:6379/0")

celery_app = Celery(
    "worker",
    broker=redis_url,
    backend=redis_url
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

logger = logging.getLogger(__name__)

@celery_app.task(name="process_document_task")
def process_document_task(title: str, file_path: str, filename: str):
    """
    Celery background task to ingest a document into the vector store.
    """
    try:
        logger.info(f"Starting background ingestion for {filename}")
        # ingest_document is synchronous, which is perfect for Celery
        ingest_document(title, file_path, filename)
        logger.info(f"Successfully finished background ingestion for {filename}")
    except Exception as e:
        logger.error(f"Error in background ingestion for {filename}: {e}", exc_info=True)
        raise e
    finally:
        # Clean up temp file after ingestion
        if os.path.exists(file_path):
            os.remove(file_path)
