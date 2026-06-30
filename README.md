# Enterprise AI Support Copilot 🚀

Enterprise AI Support Copilot is a modern, full-stack application designed to revolutionize internal IT and HR support. It combines a sleek, user-friendly AI chat interface with a powerful administrative dashboard, all backed by an Agentic Retrieval-Augmented Generation (RAG) architecture.

## 🌟 Key Features

### 🤖 Intelligent User Chat
- **AI-Powered Assistance:** Users can chat with the Copilot to instantly resolve IT issues and answer HR policy questions.
- **Context-Aware Responses:** Leverages LangChain, LangGraph, and a Qdrant Vector Database to provide accurate answers based on uploaded company documents.
- **Seamless Escalation:** If the AI cannot resolve an issue, it seamlessly escalates the conversation by automatically creating a support ticket for human IT admins.

### 🛡️ Admin & Support Dashboard
- **Secure Authentication:** JWT-based secure login for IT personnel.
- **Ticket Management:** View, manage, and resolve escalated user tickets in real-time.
- **Live User Chat Overlay:** Admins can step into an active AI conversation and chat directly with the user via a nested chat overlay.
- **Knowledge Base Training:** Instantly train the AI copilot by uploading PDFs or text documents directly from the admin panel.

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18 & Vite
- **Styling:** Vanilla CSS & Tailwind CSS concepts for a premium, dark-mode glassmorphism aesthetic.
- **Notifications:** React Hot Toast for graceful error handling and user feedback.

### Backend
- **Framework:** FastAPI (Python)
- **Database:** PostgreSQL (Relational Data) & Qdrant (Vector Database)
- **ORM:** SQLAlchemy
- **AI/LLM:** LangChain & LangGraph
- **Security:** bcrypt & PyJWT for robust session management.

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- Node.js 18+
- Docker & Docker Compose (for Postgres & Qdrant)

### 1. Database Setup
Start the local PostgreSQL and Qdrant containers using Docker:
```bash
docker-compose up -d
```

### 2. Backend Setup
Navigate to the root directory, install dependencies, and run the FastAPI server:
```bash
# Create and activate a virtual environment
python -m venv venv
source venv/Scripts/activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn app.main:app --reload
```
*Note: The server will automatically seed a default admin user (`admin` / `password123`) if the database is empty.*

### 3. Frontend Setup
Open a new terminal, navigate to the frontend directory, install packages, and start Vite:
```bash
cd frontend
npm install
npm run dev
```

### 4. Open the App
Visit `http://localhost:5173` in your browser. You can toggle between the AI Assistant interface and the Admin Dashboard using the left sidebar navigation.

## 📂 Project Structure
```text
enterprise-copilot/
├── app/                      # FastAPI Backend
│   ├── main.py               # Application entry point
│   ├── routers/              # API Endpoints (admin, chat, upload)
│   ├── services/             # Business Logic & Auth (ticket_service, auth_service)
│   ├── models.py             # SQLAlchemy Database Models
│   ├── schemas.py            # Pydantic Validation Schemas
│   ├── agent.py              # LangGraph Agent logic
│   └── vector_store.py       # Qdrant Integration
├── frontend/                 # React Frontend
│   ├── src/
│   │   ├── components/       # Reusable React components (AdminDashboard, ChatInterface)
│   │   ├── App.jsx           # Main Application Shell
│   │   └── index.css         # Global Styles & Design System
├── docker-compose.yml        # Docker infrastructure
└── requirements.txt          # Python dependencies
```

## 🔒 Security
- Passwords are cryptographically hashed using `bcrypt`.
- API endpoints are protected using secure JSON Web Tokens (JWT).
- Proper Exception handling ensures no sensitive stack traces are leaked to the client.
