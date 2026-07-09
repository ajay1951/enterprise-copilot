from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging
from app.database import engine, Base
import anyio
from app.vector_store import init_collection

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Enterprise AI Support Copilot",
    description="An agentic RAG system for IT and HR support",
    version="0.1.0"
)

import os
from dotenv import load_dotenv

load_dotenv()

# Setup dynamic CORS based on env var
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000")
origins = [origin.strip() for origin in allowed_origins_str.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import redis.asyncio as redis
from fastapi_limiter import FastAPILimiter

# We will initialize FastAPILimiter in the startup event.

from fastapi.responses import JSONResponse
from fastapi import HTTPException
from app.exceptions import TicketNotFoundError, InvalidStateError, DatabaseError, AIProcessingError

@app.exception_handler(TicketNotFoundError)
async def ticket_not_found_exception_handler(request: Request, exc: TicketNotFoundError):
    return JSONResponse(
        status_code=404,
        content={"status": "error", "error": "Not Found", "message": exc.message},
    )

@app.exception_handler(InvalidStateError)
async def invalid_state_exception_handler(request: Request, exc: InvalidStateError):
    return JSONResponse(
        status_code=400,
        content={"status": "error", "error": "Bad Request", "message": exc.message},
    )

@app.exception_handler(DatabaseError)
async def database_error_exception_handler(request: Request, exc: DatabaseError):
    logger.error(f"Database Error: {exc.message}")
    return JSONResponse(
        status_code=500,
        content={"status": "error", "error": "Database Error", "message": exc.message},
    )

@app.exception_handler(AIProcessingError)
async def ai_error_exception_handler(request: Request, exc: AIProcessingError):
    logger.error(f"AI Processing Error: {exc.message}")
    return JSONResponse(
        status_code=502,
        content={"status": "error", "error": "AI Processing Error", "message": exc.message},
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"status": "error", "error": "Internal Server Error", "message": "An unexpected error occurred. Please try again later."},
    )

@app.on_event("startup")
async def startup_event():
    """Initialize the Qdrant collection, DB, and Redis Rate Limiter on startup."""
    try:
        # Initialize Redis for rate limiting
        redis_url = os.getenv("REDIS_URL", "redis://redis:6379/0")
        redis_conn = redis.from_url(redis_url, encoding="utf-8", decode_responses=True)
        await FastAPILimiter.init(redis_conn)
        logger.info("Redis Rate Limiter initialized successfully")

        logger.info("Database verification delegated to Alembic migrations.")
        
        # Run the synchronous I/O-bound function in a worker thread
        # to avoid blocking the main event loop.
        await anyio.to_thread.run_sync(init_collection)
        logger.info("Vector store initialized successfully")
    except Exception as e:
        # Log the critical error but DO NOT re-raise.
        # This allows the application to start, although knowledge base features will fail.
        logger.error(f"CRITICAL: Failed to initialize during startup. Error: {e}", exc_info=True)

from app.routers import chat, upload, admin

app.include_router(chat.router, tags=["Chat"])
app.include_router(upload.router, tags=["Upload"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

# Run the app if executed directly
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)