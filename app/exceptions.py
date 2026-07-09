class TicketNotFoundError(Exception):
    def __init__(self, ticket_id: int):
        self.ticket_id = ticket_id
        self.message = f"Ticket with ID {ticket_id} not found."
        super().__init__(self.message)

class InvalidStateError(Exception):
    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)

class DatabaseError(Exception):
    """Raised when a critical database operation fails."""
    def __init__(self, message: str = "A database error occurred."):
        self.message = message
        super().__init__(self.message)

class AIProcessingError(Exception):
    """Raised when the LLM or RAG pipeline fails to process a request."""
    def __init__(self, message: str = "Failed to process AI request."):
        self.message = message
        super().__init__(self.message)
