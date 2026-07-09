from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from app.schemas import DocumentUploadResponse
from app.worker import process_document_task
import logging
import os
import shutil

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/upload-document", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(None)
):
    """
    Upload a document (PDF, TXT, MD, etc.) to the knowledge base.
    Saves the file temporarily and passes it to the ingestion engine.
    """
    try:
        # Create temp directory if it doesn't exist
        os.makedirs("temp", exist_ok=True)
        
        # Save the uploaded file temporarily
        temp_file_path = os.path.join("temp", file.filename)
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        doc_title = title or file.filename.split('.')[0].replace('_', ' ').title()
        
        # Trigger the Celery background task
        process_document_task.delay(
            title=doc_title, 
            file_path=temp_file_path,
            filename=file.filename
        )
        
        # Note: We DO NOT remove the temp file here because the Celery worker
        # needs to read it. The worker will delete it when finished.
        
        return DocumentUploadResponse(
            message=f"Document '{doc_title}' uploaded and ingested successfully.",
            filename=file.filename
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading document: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")
