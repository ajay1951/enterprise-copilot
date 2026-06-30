from fastapi import APIRouter, HTTPException, Request
from app.schemas import ChatRequest, ChatResponse
from app.agent import agent as agent_app
from langchain_core.messages import HumanMessage, AIMessage
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(fastapi_request: Request, request: ChatRequest):
    """
    Handle a chat request from the user.
    """
    try:
        client_host = fastapi_request.client.host
        logger.info(f"Received message from {client_host} for session {request.session_id}: {request.message[:100]}...")
        
        # Prepare input for the agent
        if request.attachment_data and request.attachment_type:
            # Multimodal input block
            message_content = [
                {"type": "text", "text": request.message},
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:{request.attachment_type};base64,{request.attachment_data}"
                    }
                }
            ]
            inputs = {
                "messages": [HumanMessage(content=message_content)]
            }
        else:
            inputs = {
                "messages": [HumanMessage(content=request.message)]
            }
        
        # Configure the thread for session persistence
        config = {"configurable": {"thread_id": request.session_id}}
        
        # Invoke the agent
        result = agent_app.invoke(inputs, config=config)
        
        # Extract the final message
        messages = result["messages"]
        response_text = ""
        for msg in reversed(messages):
            if isinstance(msg, AIMessage) and msg.content and isinstance(msg.content, str) and msg.content.strip():
                response_text = msg.content
                break
        
        # Fallback response
        if not response_text:
            logger.warning(f"Agent generated an empty response for session {request.session_id}. Providing a fallback message.")
            response_text = "I'm sorry, I was unable to generate a response based on the available information. Please try rephrasing your question or asking for something else."

        logger.info(f"Generated response for session {request.session_id}: {response_text[:100]}...")
        
        return ChatResponse(
            response=response_text,
            session_id=request.session_id
        )
        
    except Exception as e:
        logger.error(f"Error processing chat request: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
