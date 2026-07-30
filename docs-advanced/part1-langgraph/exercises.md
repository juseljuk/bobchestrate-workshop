# Advanced Part 1 — Stretch Exercises

Work through these after completing the main workshop. They're designed to push your understanding further.

---

## Exercise 1 — Add a Product Comparison Tool

Extend the research agent with a `compare_products` tool that takes a list of product names and returns a markdown comparison table.

**Hints:**
- Use `@lc_tool` with a `products: List[str]` parameter
- Return a markdown table string — wxO's web chat renders markdown natively
- Add it to `TOOLS` and re-import the agent

---

## Exercise 2 — Upgrade to SQLite Checkpointer

The `memory` checkpointer resets when the agent pod restarts. Upgrade the research agent to use SQLite.

**Steps:**
1. Add `langgraph-checkpoint-sqlite` to `requirements.txt` (pin the exact version)
2. Change `checkpointer.type` in `agent.yaml` to `sqlite`
3. Re-import and test — send a message, restart the conversation, verify state resets (SQLite does not survive pod restarts — that's expected and worth observing)

---

## Exercise 3 — Structured Output from the LLM

Use `llm.with_structured_output(Schema)` to make the agent return a structured product recommendation instead of free text.

**Hint:**
```python
from pydantic import BaseModel, Field

class ProductRecommendation(BaseModel):
    product_name: str = Field(description="Name of the recommended product")
    price: str = Field(description="Price of the product")
    reason: str = Field(description="Why this product matches the user's needs")
    alternatives: list[str] = Field(description="Two alternative products to consider")

structured_llm = llm.with_structured_output(ProductRecommendation)
result = structured_llm.invoke(messages)
# result is now a typed Python object, not a raw string
```

---

## Exercise 4 — Profile Fact Memory

The main workshop stores `preference` memories. Add a separate node that extracts and stores `profile_fact` memories (name, role, company) when the user mentions them.

**Hint:**
```python
client.memory.add_messages(
    messages=[{"role": "user", "content": "I work as an IT manager at Acme Corp"}],
    memory_type="profile_fact",
    infer=True,
)
```

Test by asking the agent to address you by name in a new conversation.

---

## Exercise 5 — Register as wxO Collaborator and Test Routing

Wire the research agent as a collaborator to a native orchestrator agent. Write instructions that make the orchestrator delegate product and tech questions to the research agent.

Test by asking:
- A question in the orchestrator's core domain — it should answer directly
- "What laptop should I buy for under $2000?" — should be delegated to `research_agent`

Observe the routing in the wxO chat and discuss: what makes the `description` field in `agent.yaml` so critical for correct routing?

---

## Exercise 6 (Hard) — Parallel Nodes

LangGraph supports parallel node execution. Add a second tool call node that runs `search_products` and `get_news_headlines` in parallel rather than sequentially.

**Research:** Look at `StateGraph.add_node` with a fan-out pattern and `send` from `langgraph.types`. This requires LangGraph ≥ 1.0.

---

[← Back to Part 1: LangGraph Agents](README.md){ .md-button }
