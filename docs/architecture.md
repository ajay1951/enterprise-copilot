# Architecture Overview

Enterprise AI Copilot is built using a modern, scalable, and decoupled architecture.

## Core Components

1.  **Frontend (React + Vite)**
    *   A Single Page Application (SPA) built with React.
    *   Uses Tailwind CSS for utility-first styling.
    *   Communicates with the backend via RESTful JSON APIs.
    *   Served in production via NGINX.

2.  **Backend (FastAPI)**
    *   High-performance Python web framework.
    *   Implements the **Repository Pattern** and **Dependency Injection** to separate database logic from business logic.
    *   Utilizes Pydantic for strict request/response validation.
    *   Global Exception Handling (`exceptions.py`) ensures standardized JSON error responses.

3.  **AI Engine (LangChain + OpenAI)**
    *   Uses `gpt-4o-mini` (or alternatives via OpenRouter) for natural language understanding.
    *   Employs a **ReAct Agent** pattern, allowing the LLM to autonomously decide when to use tools.
    *   Features strict Prompt Injection filtering and Anti-Hallucination guidelines.

4.  **Vector Database (Qdrant)**
    *   Stores vectorized chunks of enterprise documents (HR policies, IT guides).
    *   Uses LangChain's `RecursiveCharacterTextSplitter` for optimal chunking.

5.  **Relational Database (PostgreSQL)**
    *   Stores stateful data such as Support Tickets, Admin Accounts, and Chat History.
    *   Accessed via SQLAlchemy ORM.
