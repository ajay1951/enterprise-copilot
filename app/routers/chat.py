from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi_limiter.depends import RateLimiter
from app.schemas import ChatRequest, ChatResponse
from app.exceptions import AIProcessingError
from app.agent import agent as agent_app
from langchain_core.messages import HumanMessage, AIMessage
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

from fastapi.responses import StreamingResponse
import json

@router.post("/chat", dependencies=[Depends(RateLimiter(times=20, seconds=60))])
async def chat_endpoint(fastapi_request: Request, request: ChatRequest):
    """
    Handle a chat request from the user and stream the response via Server-Sent Events (SSE).
    """
    try:
        client_host = fastapi_request.client.host
        logger.info(f"Received message from {client_host} for session {request.session_id}: {request.message[:100]}...")
        
        # Basic Prompt Injection Protection (Heuristic)
        blocked_phrases = [
            "ignore previous instructions",
            "forget previous instructions",
            "ignore all instructions",
            "system prompt",
            "you are now",
            "bypass instructions",
            "disregard",
            "developer mode",
            "dan",
            "do anything now"
        ]
        
        # Strip punctuation and normalize whitespace for better matching
        import re
        user_msg_normalized = re.sub(r'[^\w\s]', '', request.message.lower())
        user_msg_normalized = re.sub(r'\s+', ' ', user_msg_normalized)
        
        if any(phrase in user_msg_normalized for phrase in blocked_phrases):
            logger.warning(f"Potential prompt injection detected from {client_host}")
            raise HTTPException(status_code=400, detail="Invalid request content detected. Request blocked by security policy.")
        
        # Prepare input for the agent
        if request.attachment_data and request.attachment_type:
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
        
        config = {"configurable": {"thread_id": request.session_id}}
        
        async def event_generator():
            try:
                # Use astream_events to get real-time tokens from the ChatOpenAI model
                async for event in agent_app.astream_events(inputs, config=config, version="v2"):
                    kind = event["event"]
                    if kind == "on_chat_model_stream":
                        content = event["data"]["chunk"].content
                        if content and isinstance(content, str):
                            # Yield SSE formatted data
                            yield f"data: {json.dumps({'text': content})}\n\n"
                
                # Signal the end of the stream
                yield "data: [DONE]\n\n"
            except Exception as e:
                logger.error(f"Streaming error: {e}", exc_info=True)
                yield f"data: {json.dumps({'error': 'An error occurred during streaming.'})}\n\n"
                
        return StreamingResponse(event_generator(), media_type="text/event-stream")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing chat request: {e}", exc_info=True)
        raise AIProcessingError(str(e))
