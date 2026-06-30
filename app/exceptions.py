class TicketNotFoundError(Exception):
    def __init__(self, ticket_id: int):
        self.ticket_id = ticket_id
        self.message = f"Ticket with ID {ticket_id} not found."
        super().__init__(self.message)

class InvalidStateError(Exception):
    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)
