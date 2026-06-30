import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# OpenAI / OpenRouter API Key
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# OpenRouter configuration
OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
USE_OPENROUTER = os.getenv("USE_OPENROUTER", "false").lower() == "true"

# Qdrant configuration
QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", None)  # Optional for cloud

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/enterprise_copilot")

# Other configurations
LLM_MODEL = os.getenv("LLM_MODEL", "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free")
LLM_FALLBACK_MODEL = os.getenv("LLM_FALLBACK_MODEL", "google/gemma-4-31b-it:free")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "nvidia/llama-nemotron-embed-vl-1b-v2:free")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "enterprise_knowledge")
SEARCH_RESULT_LIMIT = int(os.getenv("SEARCH_RESULT_LIMIT", 3))