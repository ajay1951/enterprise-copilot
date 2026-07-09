from langchain.tools import tool
from typing import List, Dict, Any, Optional, Literal
from app.vector_store import perform_vector_search
from app.database import SessionLocal, get_db_session
from app.models import Ticket, TicketStatus, TicketPriority, TicketMessage, SenderRole
from app.repositories.ticket_repository import TicketRepository
from app.services.ticket_service import TicketService

@tool
def search_knowledge_base(query: str) -> str:
    """
    Search the enterprise knowledge base for information relevant to the query.
    Use this tool when the user asks about IT policies, HR procedures, troubleshooting guides,
    or any general knowledge base articles.
    Returns a formatted string of relevant documents.
    """
    # Delegate to the vector store implementation
    results = perform_vector_search(query)
    if not results:
        return "No relevant information was found in the knowledge base for this query. Please advise the user to rephrase their question or escalate to a human agent if they need further assistance."
    
    # Format the results into a clear, readable string for the LLM to synthesize.
    formatted_results = []
    for i, result in enumerate(results):
        content = result.get("content", "No content available.")
        # Create a snippet to keep the context manageable
        content_snippet = (content[:750] + '...') if len(content) > 750 else content
        
        formatted_results.append(
            f"Source Document {i+1} (Title: {result.get('title', 'N/A')}, Relevance: {result.get('score', 0.0):.2f}):\n"
            f"Content Snippet: {content_snippet}"
        )
    return "Here is the information found in the knowledge base. Synthesize this into a helpful, conversational answer for the user:\n\n" + "\n\n---\n\n".join(formatted_results)

@tool
def get_ticket_status(ticket_id: str) -> str:
    """
    Fetch the current status of a support ticket from the ticketing system (e.g., Jira, Zendesk).
    Use this tool when the user provides a ticket ID and wants to know its status, updates, or resolution.
    Returns a formatted string containing ticket details.
    """
    # Use safe context manager for DB connections
    with get_db_session() as db:
        repo = TicketRepository(db)
        ticket = repo.get_by_ticket_number(ticket_id)
        if not ticket:
            return f"Ticket with ID '{ticket_id}' was not found in the system."
            
        message_history = ""
        messages = repo.get_messages(ticket.id)
        if messages:
            message_history = "\n\nChat History:"
            for msg in messages:
                role_str = "Admin" if msg.sender == SenderRole.ADMIN else "User (You)"
                message_history += f"\n- {role_str}: {msg.message}"

        return (
            f"Status for ticket {ticket_id}:\n"
            f"- Status: {ticket.status.value.replace('_', ' ').title()}\n"
            f"- Subject: {ticket.summary}\n"
            f"- Priority: {ticket.priority.value.title()}"
            + (f"\n- Assigned to: {ticket.assigned_to}" if ticket.assigned_to else "")
            + (f"\n- Resolution: {ticket.resolution}" if ticket.resolution else "")
            + message_history
        )

@tool
def create_ticket(email: str, summary: str, priority: Literal["low", "medium", "high"] = "medium") -> str:
    """
    Create a new IT support ticket.
    Use this tool when the user wants to report a new issue or request help that requires a ticket.
    IMPORTANT: You must ask the user for their email address BEFORE calling this tool.
    Provide the user's email, a summary of the problem, and optionally set a priority.
    Returns a confirmation message with the new ticket number.
    """
    with get_db_session() as db:
        repo = TicketRepository(db)
        ticket_number = Ticket.generate_ticket_number()
        new_ticket = Ticket(
            ticket_number=ticket_number,
            user_email=email,
            summary=summary,
            priority=TicketPriority(priority)
        )
        repo.create_ticket(new_ticket)
        
        print(f"TICKET CREATED: {ticket_number} with priority '{priority}' and summary: {summary}")
        return (
            f"Successfully created ticket {ticket_number} with priority '{priority}'. "
            f"A support agent will be in touch shortly. The summary of your issue is: '{summary}'"
        )

@tool
def escalate_to_human(email: str, summary: str) -> str:
    """
    Escalate the current conversation to a human support agent for live assistance.
    Use this tool ONLY when the user explicitly asks to speak to a person, is frustrated with the automated assistant,
    or when the issue is too complex for the available tools to handle. This is for immediate handoff, not for creating a standard support ticket.
    IMPORTANT: You must ask the user for their email address BEFORE calling this tool.
    Provide the user's email and a summary of the issue and steps taken so far.
    Returns a confirmation message that the escalation was successful.
    """
    with get_db_session() as db:
        repo = TicketRepository(db)
        ticket_number = f"ESC-{Ticket.generate_ticket_number().split('-')[1]}"
        new_ticket = Ticket(
            ticket_number=ticket_number,
            user_email=email,
            summary=summary,
            priority=TicketPriority.HIGH,
            status=TicketStatus.IN_PROGRESS
        )
        repo.create_ticket(new_ticket)
        
        print(f"ESCALATION: Ticket {ticket_number} created with summary: {summary}")
        return f"Escalation successful. A human agent will review the following summary and contact you shortly. Reference ticket: {ticket_number}\nSummary: {summary}"

@tool
def add_ticket_reply(ticket_id: str, message: str) -> str:
    """
    Add a new message or reply to an existing support ticket on behalf of the user.
    Use this tool when the user asks to reply, add information, or respond to an admin on a specific ticket.
    Returns a confirmation message.
    """
    with get_db_session() as db:
        repo = TicketRepository(db)
        ticket = repo.get_by_ticket_number(ticket_id)
        if not ticket:
            return f"Error: Ticket with ID '{ticket_id}' was not found in the system."
        
        new_msg = TicketMessage(
            ticket_id=ticket.id,
            sender=SenderRole.USER,
            message=message
        )
        repo.add_message(new_msg)
        
        # Change status if it was pending user response
        if ticket.status == TicketStatus.PENDING_USER:
            ticket.status = TicketStatus.OPEN
            repo.update_ticket(ticket)
            
        return f"Successfully added your reply to ticket {ticket_id}."