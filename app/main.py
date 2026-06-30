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

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.responses import JSONResponse
from fastapi import HTTPException
from app.exceptions import TicketNotFoundError, InvalidStateError

@app.exception_handler(TicketNotFoundError)
async def ticket_not_found_exception_handler(request: Request, exc: TicketNotFoundError):
    return JSONResponse(
        status_code=404,
        content={"error": "Not Found", "message": exc.message},
    )

@app.exception_handler(InvalidStateError)
async def invalid_state_exception_handler(request: Request, exc: InvalidStateError):
    return JSONResponse(
        status_code=400,
        content={"error": "Bad Request", "message": exc.message},
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal Server Error", "message": "An unexpected error occurred. Please try again later."},
    )

# Startup event to initialize the vector collection and database
@app.on_event("startup")
async def startup_event():
    """Initialize the Qdrant collection and DB on startup."""
    try:
        # Create database tables
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified/created successfully.")
        
        # Seed default admin user if none exists
        from app.database import SessionLocal
        from app.models import AdminUser
        from app.services.auth_service import AuthService
        db = SessionLocal()
        try:
            if db.query(AdminUser).count() == 0:
                logger.info("No AdminUser found, creating default admin user...")
                default_admin = AdminUser(
                    username="admin",
                    hashed_password=AuthService.get_password_hash("password123")
                )
                db.add(default_admin)
                db.commit()
                logger.info("Default admin user created successfully.")
        finally:
            db.close()
        
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