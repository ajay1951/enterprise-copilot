from typing import TypedDict, Annotated, List, Union
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.messages import AIMessage, BaseMessage, SystemMessage, ToolMessage
from langchain_openai import ChatOpenAI
from app.tools import search_knowledge_base, get_ticket_status, escalate_to_human, create_ticket, add_ticket_reply
from app.config import OPENAI_API_KEY, USE_OPENROUTER, OPENROUTER_BASE_URL, LLM_MODEL, LLM_FALLBACK_MODEL


from langgraph.graph.message import add_messages

# Define the agent state
class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]

# Define the function that determines whether to use tools or not
def should_continue(state: AgentState) -> str:
    """Determine if we should continue to tool use or end the conversation."""
    # If the last message from the agent has tool calls, we should continue to the tools node.
    if state["messages"][-1].tool_calls:
        return "continue"
    # Otherwise, end (we'll return the final answer)
    return "end"

# Initialize the LLM and tools once to be reused
llm_common_kwargs = {
    "openai_api_key": OPENAI_API_KEY,
    "temperature": 0.1,
    "streaming": True,
    "max_tokens": 1024,
    **({"base_url": OPENROUTER_BASE_URL} if USE_OPENROUTER else {}),
}

# Create primary and fallback LLM instances
primary_llm = ChatOpenAI(model=LLM_MODEL, **llm_common_kwargs)
fallback_llm = ChatOpenAI(model=LLM_FALLBACK_MODEL, **llm_common_kwargs)

# Create an LLM with a fallback for resilience.
# It will try primary_llm first, and if it fails (e.g., rate limit), it will try fallback_llm.
llm = primary_llm.with_fallbacks([fallback_llm])

# Bind tools to the LLM
tools = [search_knowledge_base, get_ticket_status, create_ticket, escalate_to_human, add_ticket_reply]
llm_with_tools = llm.bind_tools(tools)

# Define the agent node that uses the LLM
def agent_node(state: AgentState):
    """Process the current state and generate a response or tool calls."""
    current_messages = state["messages"]

    if not current_messages or not isinstance(current_messages[0], SystemMessage):
        # This is a much more forceful prompt that instructs the LLM to prioritize tool use.
        system_prompt = (
            "You are an enterprise AI assistant for IT and HR support. You MUST use the provided tools to answer questions.\n\n"
            "1. **Analyze the user's query.** Identify if it relates to IT policies (like VPN, passwords), HR procedures (like onboarding), or support tickets.\n"
            "2. **Select the appropriate tool.**\n"
            "   - For questions about policies, procedures, or general knowledge, you MUST call the `search_knowledge_base` tool.\n"
            "   - For checking an existing ticket status, you MUST call `get_ticket_status`.\n"
            "   - To create a new support ticket for a new issue, you MUST call `create_ticket`.\n"
            "   - If the user wants to talk to a person for live help, you MUST call `escalate_to_human`.\n"
            "3. **NEVER answer from your own knowledge.** If a user's query can be answered by a tool, you MUST use the tool. Do not greet the user or ask for clarification. Immediately call the correct tool.\n"
            "4. **Synthesize the Answer:** After receiving the output from a tool, create a helpful and conversational answer for the user based on the information provided by the tool. If the tool provides content from the knowledge base, present that information clearly. You MUST output a text response. NEVER return an empty message or blank response."
        )
        messages_to_send = [SystemMessage(content=system_prompt)] + current_messages
    else:
        messages_to_send = current_messages

    response = llm_with_tools.invoke(messages_to_send)

    return {"messages": [response]}

# Create the graph
workflow = StateGraph(AgentState)

# Add nodes
workflow.add_node("agent", agent_node)
workflow.add_node("tools", ToolNode(tools))

# Add edges
workflow.set_entry_point("agent")
workflow.add_conditional_edges(
    "agent",
    should_continue,
    {
        "continue": "tools",
        "end": END
    }
)
workflow.add_edge("tools", "agent")  # After tools, go back to agent

# Add memory
memory = MemorySaver()
agent = workflow.compile(checkpointer=memory)