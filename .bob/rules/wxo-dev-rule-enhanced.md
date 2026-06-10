## watsonx Orchestrate Development Rule - Enhanced

When working with IBM watsonx Orchestrate or watsonx Orchestrate ADK projects:

---

## 1. Project Structure & Organization

Follow ADK conventions when creating and saving artifacts:

### Core Directories
- **agents/** - Agent YAML configurations
- **tools/** - Flows and Python tools
- **knowledge_bases/** - Knowledge base configurations
- **models/** - LLM model configurations
- **toolkits/** - MCP toolkit definitions
- **connections/** - API connections and credential configurations
- **channels/** - Deployment channel configurations (Slack, Teams, Web, etc.)
- **plugins/** - Guardrail and custom plugins
- **tests/** or **evaluation/** - Test cases and evaluation datasets

### Essential Files
- **import-all.sh** - Comprehensive deployment script for all artifact types
- **requirements.txt** - Python dependencies (exclude `ibm-watsonx-orchestrate` - it's platform-managed)
- **.env.example** - Environment variable templates (never commit actual .env)
- **README.md** - Architecture diagrams, workflow diagrams, setup instructions
- **.gitignore** - Exclude .env, credentials, and local config files

### Environment Configuration (.env.example)

The `.env.example` file must follow the official watsonx Orchestrate Developer Edition structure:

#### Required: Choose ONE Authentication Method

**Option 1: watsonx Orchestrate Account (SaaS/Trial)**
```bash
WO_DEVELOPER_EDITION_SOURCE=orchestrate
WO_INSTANCE=https://your-instance.watson-orchestrate.ibm.com
WO_API_KEY=your-api-key-here
```

**Option 2: myIBM (On-premises/Purchased)**
```bash
WO_DEVELOPER_EDITION_SOURCE=myibm
WO_ENTITLEMENT_KEY=your-entitlement-key
GROQ_API_KEY=your-groq-api-key
WATSONX_APIKEY=your-watsonx-api-key
WATSONX_SPACE_ID=your-space-id
```

**Option 3: Custom Image Registry**
```bash
WO_DEVELOPER_EDITION_SOURCE=custom
REGISTRY_URL=your-registry-url
REGISTRY_USERNAME=your-username
REGISTRY_PASSWORD=your-password
```

#### Optional: Service Credentials
Developer Edition includes built-in services (Minio, Langfuse, MCP Gateway, etc.). Only override if using external services:
```bash
# MINIO_ROOT_USER=minioadmin
# MINIO_ROOT_PASSWORD=minioadmin
# LANGFUSE_SECRET_KEY=your-secret-key
# MCP_GATEWAY_API_KEY=your-api-key
```

#### Optional: Regional Configuration
For non-us-south regions, configure regional endpoints:
```bash
# ASSISTANT_LLM_API_BASE=https://us-south.ml.cloud.ibm.com
# ASSISTANT_EMBEDDINGS_API_BASE=https://us-south.ml.cloud.ibm.com
# ROUTING_LLM_API_BASE=https://us-south.ml.cloud.ibm.com
# WATSONX_URL=https://us-south.ml.cloud.ibm.com
```

#### Optional: On-Premises Configuration
For on-premises deployments with Docker:
```bash
# DOCKER_IMAGE_PULL_POLICY=IfNotPresent
# DOCKER_SKIP_SSL_VERIFY=false
# DOCKER_ENABLE_LAYER_CACHING=true
```

**IMPORTANT**:
- Never include actual credentials in `.env.example`
- Do NOT use non-standard variables like `ORCHESTRATE_API_KEY`, `ORCHESTRATE_ENVIRONMENT`, or `TIMEOUT_SECONDS`
- Do NOT include Slack, database, or other service-specific configs unless they're official Developer Edition variables
- Always refer to official documentation for the latest environment variable requirements

---

## 2. Development Patterns & Best Practices

### Agent Naming Conventions

**CRITICAL**: Agent names must follow strict naming conventions to ensure proper routing and identification within watsonx Orchestrate.

#### Required Naming Format
- **Use snake_case** - Names must use underscores, not camelCase or spaces
- **No spaces allowed** - Agent names cannot contain spaces
- **No special characters** - Avoid special characters in names
- **Keep names short and descriptive** - Names should be concise yet meaningful
- **Use domain-specific language** - Names should reflect the agent's purpose and domain

#### Naming Examples

✅ **Good Examples:**
- `customer_support_agent`
- `sales_outreach_agent`
- `ibm_historical_knowledge_agent`
- `product_catalog_agent`
- `order_processing_agent`

❌ **Bad Examples:**
- `customerSupportAgent` (camelCase not allowed)
- `customer support agent` (spaces not allowed)
- `agent-123` (special characters not recommended)
- `helper` (too generic)
- `myAgent1` (not descriptive, uses camelCase)

#### Why These Conventions Matter
- **Routing agents** work better with snake_case names
- **User identification** is easier with clear, descriptive names
- **System consistency** is maintained across all agents
- **Avoid generic terms** like "helper" or "assistant" - use domain-specific language instead

### LLM Configuration for Agents
- Use groq/openai/gpt-oss-120b as the default LLM model

### Tool & Flow Development
- Use `@flow` decorator for flows with proper type hints
- Use `@tool` decorator (without parentheses) for Python tools with clear docstrings
- **CRITICAL**: Always import tool decorator as `from ibm_watsonx_orchestrate.agent_builder.tools import tool`
- **CRITICAL**: Use explicit type hints that match docstring descriptions to avoid parameter parsing warnings
- **CRITICAL**: Use Google-style docstrings with type annotations in parentheses (e.g., `param (str):`)
- **CRITICAL**: Return type in docstring must match function return type hint exactly (e.g., `Dict[str, Any]:` not `dict:`)
- Include inline KVP schemas for document processing
- Create native agents for document handling tasks
- Implement proper input validation and schema definitions
- Use async/await patterns for I/O-bound operations in flows

### Agentic Workflows (Deterministic Tool Flows)

**IMPORTANT**: Agentic workflows are deterministic, predefined sequences of tool executions - NOT agents that use LLM reasoning at each step. Use workflows when you need predictable, repeatable processes.

#### When to Use Workflows vs Agents

**Use Agentic Workflows When:**
- Process is deterministic and follows a fixed sequence
- Steps are well-defined with clear inputs/outputs
- You need guaranteed execution order
- Performance and cost optimization are critical (60% faster, 80% lower cost)
- No LLM reasoning needed between steps
- Examples: loan approval, order processing, data validation pipelines

**Use Agents When:**
- Process requires dynamic decision-making
- Steps depend on LLM reasoning and context
- Flexibility and adaptability are more important than speed
- User interaction and conversation are needed
- Examples: customer support, complex problem-solving, creative tasks

#### Building Agentic Workflows

**CRITICAL Import Paths:**
```python
from ibm_watsonx_orchestrate.flow_builder.flows import (
    Flow, flow, START, END, Branch
)
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
```

**Workflow Structure:**
```python
# 1. Define input/output schemas with Pydantic
class WorkflowInput(BaseModel):
    """Input schema for the workflow"""
    customer_id: str = Field(description="Customer identifier")
    amount: float = Field(description="Transaction amount")

class WorkflowOutput(BaseModel):
    """Output schema for the workflow"""
    status: str = Field(description="Processing status")
    result: Dict[str, Any] = Field(description="Processing result")

# 2. Create workflow with @flow decorator
@flow(
    name="my_workflow",
    description="Clear description of what the workflow does",
    input_schema=WorkflowInput,
    output_schema=WorkflowOutput
)
def build_my_workflow(aflow: Flow) -> Flow:
    """
    Build the workflow graph.
    
    Args:
        aflow (Flow): The flow builder instance
        
    Returns:
        Flow: The configured flow
    """
    # 3. Define tool nodes (reference imported MCP tools)
    check_node = aflow.tool("toolkit-name:tool_name")
    
    # CRITICAL: Map workflow inputs to tool parameters
    # Without this, tools will receive empty/missing parameters
    check_node.map_input(input_variable="customer_id", expression="flow.input.customer_id")
    check_node.map_input(input_variable="amount", expression="flow.input.amount")
    
    process_node = aflow.tool("toolkit-name:another_tool")
    process_node.map_input(input_variable="customer_id", expression="flow.input.customer_id")
    # Can also reference previous node outputs
    process_node.map_input(input_variable="status", expression="check_node.output.status")
    
    # 4. Create conditional branches
    decision_branch: Branch = aflow.branch(
        evaluator="check_node.output.status == 'approved'"
    )
    
    # 5. Build the graph with edges
    aflow.edge(START, check_node)
    aflow.edge(check_node, decision_branch)
    
    # Branch cases
    decision_branch.case(True, process_node)
    aflow.edge(process_node, END)
    decision_branch.case(False, END)
    
    return aflow
```

**Parameter Mapping Rules:**
- **CRITICAL**: Always use `map_input()` to pass data to tool nodes
- **Syntax**: `node.map_input(input_variable="param_name", expression="source")`
- **Sources**:
  - Workflow input: `"flow.input.parameter_name"`
  - Previous node output: `"node_name.output.field_name"`
  - Default values: Add `default_value="value"` parameter
- **Common Error**: Forgetting `map_input()` causes "required property" errors

#### Workflow Patterns

**Sequential Execution:**
```python
# Connect tools in sequence
aflow.edge(START, tool1)
aflow.edge(tool1, tool2)
aflow.edge(tool2, tool3)
aflow.edge(tool3, END)

# Or use sequence helper
aflow.sequence(START, tool1, tool2, tool3, END)
```

**Conditional Branching:**
```python
# Create branch with evaluator expression
branch: Branch = aflow.branch(
    evaluator="previous_node.output.score > 700"
)

# Define cases
branch.case(True, approved_path)
branch.case(False, rejected_path)

# Connect to END
aflow.edge(approved_path, END)
aflow.edge(rejected_path, END)
```

**Parallel Execution (Foreach):**
```python
# Process items in parallel
foreach_node = aflow.foreach(
    items="input.items",
    body=process_item_tool
)

aflow.edge(START, foreach_node)
aflow.edge(foreach_node, END)
```

#### Referencing Tools in Workflows

**CRITICAL**: Tools must be referenced by their full name including toolkit prefix:

```python
# Correct - with toolkit prefix
check_credit = aflow.tool("loan-processing:check_credit_score")
calculate_dti = aflow.tool("loan-processing:calculate_debt_to_income")

# Wrong - without toolkit prefix (will fail)
check_credit = aflow.tool("check_credit_score")
```

**Verify tool names:**
```bash
orchestrate tools list | grep toolkit-name
```

#### Importing Workflows

**CRITICAL**: Workflows are imported as flow-type tools:

```bash
# Import workflow
orchestrate tools import -k flow -f tools/my_workflow.py

# Verify import
orchestrate tools list | grep my_workflow
```

**In import-all.sh:**
```bash
echo "🔄 Importing Agentic Workflows..."
orchestrate tools import -k flow -f tools/loan_approval_workflow.py
orchestrate tools import -k flow -f tools/order_processing_workflow.py
```

#### Testing Workflows

**IMPORTANT**: Workflows can only be tested programmatically in Developer Edition local environment. For other environments, test through agents.

**Option 1: Test via Agent (Recommended)**
```yaml
# agents/test-agent.yaml
tools:
  - my_workflow

guidelines:
  - condition: "User requests workflow execution"
    action: "Use my_workflow tool with required parameters"
    tool: "my_workflow"
```

**Option 2: Simulation Test (Local)**
```python
# tests/test_my_workflow.py
def test_workflow_logic():
    """Test workflow business logic without platform"""
    # Simulate workflow steps
    result = simulate_workflow_execution(test_input)
    assert result['status'] == 'success'
```

**Option 3: Integration Test (Developer Edition Only)**
```python
# tests/run_my_workflow.py
import asyncio
from my_workflow import build_my_workflow
from ibm_watsonx_orchestrate.flow_builder.flows import FlowEventType

async def test_workflow():
    # Build and compile
    flow_def = build_my_workflow()
    compiled_flow = await flow_def.compile_deploy()
    
    # Run with events
    async for event, run in compiled_flow.invoke_events(input_data):
        if event.kind == FlowEventType.ON_FLOW_END:
            print(f"Success: {run.output}")
            break
        elif event.kind == FlowEventType.ON_FLOW_ERROR:
            print(f"Error: {run.error}")
            break

asyncio.run(test_workflow())
```

#### Workflow Best Practices

1. **Clear Naming**: Use descriptive workflow names (e.g., `loan_approval_workflow`, not `process_loan`)
2. **Schema Validation**: Always define Pydantic input/output schemas
3. **Error Handling**: Design workflows to handle failures gracefully
4. **Documentation**: Include comprehensive docstrings and comments
5. **Tool Dependencies**: Ensure all referenced tools are imported before workflow
6. **Branch Logic**: Keep evaluator expressions simple and testable
7. **Performance**: Workflows are 60% faster than agent-based approaches for deterministic tasks

#### Common Workflow Mistakes

❌ **Wrong - Missing toolkit prefix:**
```python
tool_node = aflow.tool("check_credit")  # Will fail
```

✅ **Correct - With toolkit prefix:**
```python
tool_node = aflow.tool("loan-processing:check_credit_score")
```

❌ **Wrong - Incorrect import path:**
```python
from ibm_watsonx_orchestrate.agent_builder.tools import flow  # Wrong module
```

✅ **Correct - Flow builder import:**
```python
from ibm_watsonx_orchestrate.flow_builder.flows import flow
```

❌ **Wrong - Testing without Developer Edition:**
```python
# This will fail: "Flow tools are only supported in local environment"
compiled_flow = await flow_def.compile_deploy()
```

✅ **Correct - Test via agent or simulation:**
```python
# Test through agent that uses the workflow as a tool
# OR create simulation test that validates business logic
```

#### Workflow vs Agent Performance

| Metric | Agentic Workflow | Agent-Based |
|--------|-----------------|-------------|
| Execution Time | ~2-3 seconds | ~5-8 seconds |
| Token Usage | Minimal (no LLM calls between steps) | High (LLM reasoning at each step) |
| Cost | 80% lower | Baseline |
| Predictability | 100% (deterministic) | Variable (LLM-dependent) |
| Use Case | Fixed processes | Dynamic reasoning |

### Type Hints Best Practices

**IMPORTANT**: The watsonx Orchestrate platform relies on type hints to generate proper tool schemas. Incorrect or missing type hints will cause warnings like:
```
[WARNING] - Unable to properly parse parameter descriptions due to missing or incorrect type hints.
```

#### Required Type Hint Standards
1. **All parameters must have explicit type hints** - Never omit parameter types
2. **Return types must be specified** - Always include `-> TypeHint`
3. **Use specific types over generic ones** - Prefer `Dict[str, Any]` over `Dict`
4. **Import necessary typing constructs** - `from typing import Dict, List, Any, Optional`
5. **Type hints must match docstring descriptions** - Consistency is critical

#### Correct Type Hint Examples

```python
from ibm_watsonx_orchestrate.agent_builder.tools import tool
from typing import Dict, List, Any, Optional

@tool
def check_order_status(order_id: str) -> Dict[str, Any]:
    """
    Check the status of a customer order.
    
    Args:
        order_id (str): The unique order identifier (format: ORD-XXXXX)
        
    Returns:
        Dict[str, Any]: Order status information including status, delivery date, etc.
    """
    # Implementation
    return {"status": "shipped", "order_id": order_id}

@tool
def process_items(items: List[Dict[str, Any]], priority: Optional[int] = None) -> Dict[str, Any]:
    """
    Process a list of items with optional priority.
    
    Args:
        items (List[Dict[str, Any]]): List of item dictionaries with name and quantity
        priority (Optional[int]): Optional priority level (1-5)
        
    Returns:
        Dict[str, Any]: Processing result with status and processed count
    """
    # Implementation
    return {"status": "success", "processed": len(items)}
```

#### Common Type Hint Mistakes

❌ **Wrong - Generic Dict without type parameters:**
```python
def my_tool(data: dict) -> Dict:  # Too generic, causes warnings
```

✅ **Correct - Specific type parameters:**
```python
def my_tool(data: Dict[str, Any]) -> Dict[str, Any]:  # Explicit and clear
```

❌ **Wrong - Missing return type:**
```python
def my_tool(param: str):  # No return type specified
```

✅ **Correct - Explicit return type:**
```python
def my_tool(param: str) -> Dict[str, Any]:  # Clear return type
```

❌ **Wrong - Inconsistent with docstring:**
```python
@tool
def my_tool(count: str) -> dict:  # Docstring says count is int
    """
    Args:
        count (int): Number of items (integer)
    """
```

✅ **Correct - Matches docstring:**
```python
@tool
def my_tool(count: int) -> Dict[str, Any]:  # Matches docstring
    """
    Args:
        count (int): Number of items (integer)
        
    Returns:
        Dict[str, Any]: Processing result
    """
```

### Error Handling
```python
from ibm_watsonx_orchestrate.agent_builder.tools import tool
from typing import Dict, Any

@tool
def my_tool(param: str) -> Dict[str, Any]:
    """
    Tool with proper error handling.
    
    Args:
        param (str): Input parameter
        
    Returns:
        Dict[str, Any]: Result with status and data or error message
    """
    try:
        # Tool logic
        result = process_data(param)
        return {"status": "success", "data": result}
    except ValueError as e:
        return {"status": "error", "message": f"Invalid input: {str(e)}"}
    except Exception as e:
        return {"status": "error", "message": f"Unexpected error: {str(e)}"}
```

### Logging & Debugging
- Use structured logging with appropriate log levels
- Include context in log messages (agent name, tool name, request ID)
- Log input parameters (sanitize sensitive data)
- Log execution time for performance monitoring

### Connection Binding
- Define connections in YAML for external APIs
- Use environment variables for credentials
- Test connections locally by emulating environment variables
- Handle connection failures gracefully with retries

### Multi-Agent Collaboration
- Design clear agent responsibilities and boundaries
- Use explicit handoff patterns between agents
- Document agent interaction flows
- Test multi-agent scenarios thoroughly

---

## 3. Testing & Quality Assurance

### Testing Python Tools with @tool Decorator

**CRITICAL**: The `@tool` decorator from watsonx Orchestrate wraps functions and changes their return behavior. When creating test files for Python tools:

1. **DO NOT import the decorated function directly** - The decorator expects specific return formats (`content` or `context_updates` keys)
2. **Create standalone test versions** - Copy the tool's business logic into test files WITHOUT the `@tool` decorator
3. **Keep tool and test logic synchronized** - When updating tools, update corresponding tests

#### Example Test File Structure

```python
"""
Test cases for my_tool.

Note: This file contains a copy of the tool logic WITHOUT the @tool decorator
for testing purposes. The actual tool in tools/my_tool.py uses the @tool decorator.
"""

from datetime import datetime
from typing import Dict

def my_tool(param1: str, param2: int) -> Dict:
    """
    Test version of my_tool without @tool decorator.
    Copy the exact business logic from tools/my_tool.py
    """
    try:
        # Business logic here (same as in tools/my_tool.py)
        result = process_data(param1, param2)
        return {
            "status": "success",
            "data": result
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

def test_successful_case():
    """Test successful execution."""
    result = my_tool("test", 42)
    assert result['status'] == 'success'
    print("✓ Test passed")

def test_error_case():
    """Test error handling."""
    result = my_tool("", -1)
    assert result['status'] == 'error'
    print("✓ Test passed")

if __name__ == "__main__":
    test_successful_case()
    test_error_case()
```

#### Why This Approach

- **Decorator Complexity**: The `@tool` decorator is designed for watsonx Orchestrate's agent framework, not local testing
- **Return Format**: Decorated functions return data in a specific format that's incompatible with direct dictionary access
- **Testing Independence**: Test files should test business logic independently of framework decorators
- **Maintainability**: Keep tool logic and test logic in sync manually

#### Alternative: Integration Testing

For testing tools within the watsonx Orchestrate environment:
```bash
# Use orchestrate CLI evaluation tools
orchestrate evaluations quick-eval -p tests/ -o results/ -t tools/
```

### Quick Evaluation
```bash
# Quick evaluation of agent (directory containing JSON test files)
orchestrate evaluations quick-eval -p evaluation/datasets/ -o results/ -t tools/

# Evaluate specific test cases with config file
orchestrate evaluations quick-eval -c evaluation/config.yaml
```
### Evaluation Configuration Files

**CRITICAL**: Evaluation config files must follow the official watsonx Orchestrate format. Metrics are NOT configurable - they are automatically computed by the evaluation framework.

**Documentation**: https://developer.watson-orchestrate.ibm.com/evaluate/evaluate

#### Official Config File Format

**For Developer Edition (Local):**
```yaml
# test_paths - array of dataset file/directory paths containing JSON files
test_paths:
  - evaluation/datasets/

# auth_config - authentication settings
auth_config:
  url: http://localhost:4321
  tenant_name: local

# output_dir - where results are saved
output_dir: evaluation/results/

# enable_verbose_logging - detailed output
enable_verbose_logging: true

# llm_user_config - optional user response style
llm_user_config:
  user_response_style:
    - "Be concise in messages and confirmations"

# n_runs - number of evaluation runs (default: 1)
n_runs: 1
```

**For SaaS:**
```yaml
test_paths:
  - evaluation/datasets/

auth_config:
  url: https://api.<region>.watson-orchestrate.ibm.com/instances/<instance-id>
  tenant_name: saas

output_dir: evaluation/results/
enable_verbose_logging: true
wxo_lite_version: 1.12.0
n_runs: 1
```

**For On-Premises:**
```yaml
test_paths:
  - evaluation/datasets/

auth_config:
  url: https://<api-url>:<port>/orchestrate/instances/<instance-id>
  tenant_name: onprem

output_dir: evaluation/results/
enable_verbose_logging: true
wxo_lite_version: 1.12.0
n_runs: 1
```

#### Available Metrics (Auto-Computed)

**Quick Evaluation Metrics** (reference-less):
- Tool Calls - Total number of tool invocations
- Successful Tool Calls - Tool calls that completed successfully
- Schema Mismatch - Tool calls with incorrect parameter schemas
- Hallucination - Responses containing fabricated information

**Full Evaluation Metrics** (reference-based, requires expected outputs):
- Response Confidence - Model's confidence in responses
- Retrieval Confidence - Confidence in retrieved information
- Faithfulness - Accuracy relative to source material
- Answer Relevancy - How well responses address queries
- Tool Call Precision - Accuracy of tool selection
- Tool Call Recall - Coverage of necessary tool calls
- Agent Routing Accuracy - Correct routing to collaborator agents
- Text Match - Similarity to expected outputs
- Journey Success - End-to-end task completion rate
- Average Response Time - Latency metrics

#### Common Mistakes

❌ **Wrong - Trying to configure metrics:**
```yaml
metrics:
  - response_confidence
  - faithfulness
```

✅ **Correct - Metrics are auto-computed:**
```yaml
# Metrics are automatically computed by the framework
# No metrics configuration needed
```

❌ **Wrong - Using dataset_path:**
```yaml
dataset_path: evaluation/datasets/
```

✅ **Correct - Using test_paths:**
```yaml
test_paths:
  - evaluation/datasets/
```

**Important Notes:**
- Metrics are automatically computed and CANNOT be configured in the YAML file
- Use `test_paths` (not `dataset_path`)
- Do NOT include `tools_path` in config (use `-t` CLI flag for quick-eval)
- The `tenant_name` must match the environment name from `orchestrate env add`
- Test cases must be in JSON format (not JSONL) with official ground truth structure

**About `wxo_lite_version` Parameter:**

The `wxo_lite_version` parameter specifies the watsonx Orchestrate evaluation framework version:

- **Required for SaaS and on-premises environments**
- **NOT needed for Developer Edition (local)**
- Should match your tenant's watsonx Orchestrate version
- Common versions: 1.12.0, 1.13.0, 1.14.0, 1.15.0
- Default: 1.12.0 (widely compatible)
- Can be auto-detected from `orchestrate --version`
- Starting from version 1.12.0, evaluations work with SaaS/on-prem (not just Developer Edition)

**Why it exists:**
- Ensures compatibility between your tenant and evaluation tools
- Different versions may have different features or metrics
- SaaS and on-premises need explicit version specification

**How to determine the correct version:**
1. Check your tenant version in the watsonx Orchestrate UI
2. Run `orchestrate --version` to see your CLI version
3. Consult with your admin if unsure
4. Use 1.12.0 as a safe default (widely compatible)

**Example usage in config:**
```yaml
# SaaS/On-prem only - NOT for local Developer Edition
wxo_lite_version: 1.12.0
```


### Evaluation Datasets

**CRITICAL**: Evaluation datasets use **JSON format** (not JSONL) with structured ground truth data.

Each test case is a **separate JSON file** containing:
- `agent` - Name of the agent being evaluated
- `goals` - Dependency graph showing tool call relationships
- `goal_details` - Step-by-step list of tool calls and final response
- `story` - Narrative description of the user's intent
- `starting_sentence` - The user's initial query

Example structure:
```json
{
    "agent": "my_agent",
    "goals": {
        "tool_call-1": ["summarize"]
    },
    "goal_details": [
        {
            "type": "tool_call",
            "name": "tool_call-1",
            "tool_name": "my_tool",
            "args": {"param": "value"}
        },
        {
            "name": "summarize",
            "type": "text",
            "response": "Expected response",
            "keywords": ["key", "terms"]
        }
    ],
    "story": "User story context",
    "starting_sentence": "User's initial query"
}
```

Best practices:
- Create comprehensive test cases covering happy path, edge cases, and error scenarios
- Store test cases in `evaluation/datasets/` directory
- Each test case should be a separate `.json` file
- Version control your test datasets

### LLM Vulnerability Testing

Use the official red-teaming commands to test agent security:

```bash
# List all supported attack types
orchestrate evaluations red-teaming list

# Plan attack scenarios
orchestrate evaluations red-teaming plan \
  -a "instruction_override,crescendo_attack,jailbreaking" \
  -d evaluation/test-cases.jsonl \
  -g . \
  -t agent_name \
  -o evaluation/red-team-attacks/ \
  -n 3

# Run attacks
orchestrate evaluations red-teaming run \
  -a evaluation/red-team-attacks/ \
  -o evaluation/red-team-results/
```

**Supported Attack Types** (OWASP-aligned):
- **On-Policy**: instruction_override, crescendo_attack, emotional_appeal, imperative_emphasis, role_playing, random_prefix, random_postfix, encoded_input, foreign_languages
- **Off-Policy**: crescendo_prompt_leakage, functionality_based_attacks, undermine_model, unsafe_topics, jailbreaking, topic_derailment

**Documentation**: https://developer.watson-orchestrate.ibm.com/evaluate/red_teaming

### Performance Metrics
- Monitor token usage and costs
- Track response times
- Measure tool execution success rates
- Analyze conversation completion rates

---

## 4. Security & Guardrails

### Guardrail Plugins

**CRITICAL DECORATOR SYNTAX**: Guardrail plugins MUST use the correct `@tool` decorator format:
- ✅ **CORRECT**: `@tool(description="...", kind=PythonToolKind.AGENTPREINVOKE)`
- ❌ **WRONG**: `@tool` (without parameters)
- ❌ **WRONG**: `@plugin` (wrong decorator)
- The `description` parameter is REQUIRED
- The `kind` parameter is REQUIRED and must be either:
  - `PythonToolKind.AGENTPREINVOKE` for pre-invoke plugins
  - `PythonToolKind.AGENTPOSTINVOKE` for post-invoke plugins

**IMPORTANT**: Guardrails must be implemented as Python tools with specific plugin types before they can be referenced in agent YAML configurations. Do NOT add guardrail references to agent YAML unless the corresponding plugin files exist and have been imported.

Only reference guardrails in agent YAML after:
1. Creating the plugin file (e.g., `plugins/content_safety_plugin.py`)
2. Importing the plugin: `orchestrate tools import -k python -f plugins/content_safety_plugin.py`
3. Verifying the plugin exists: `orchestrate tools list`

#### Pre-invoke Guardrails
Pre-invoke plugins run BEFORE the agent processes input. They can filter, modify, or block requests.

```python
# plugins/content_safety_plugin.py
from ibm_watsonx_orchestrate.agent_builder.tools import tool
from ibm_watsonx_orchestrate.agent_builder.tools.types import (
    PythonToolKind,
    PluginContext,
    AgentPreInvokePayload,
    AgentPreInvokeResult,
    TextContent,
    Message
)

@tool(description="Filters inappropriate content", kind=PythonToolKind.AGENTPREINVOKE)
def content_safety_guardrail(plugin_context: PluginContext, agent_pre_invoke_payload: AgentPreInvokePayload) -> AgentPreInvokeResult:
    """Check for inappropriate content before processing."""
    result = AgentPreInvokeResult()
    
    # Check if we have messages
    if not agent_pre_invoke_payload or not agent_pre_invoke_payload.messages:
        result.continue_processing = True
        result.modified_payload = agent_pre_invoke_payload
        return result
    
    # Get user message
    last_message = agent_pre_invoke_payload.messages[-1]
    content = getattr(last_message, "content", None)
    
    if content is None or not hasattr(content, "text") or content.text is None:
        result.continue_processing = True
        result.modified_payload = agent_pre_invoke_payload
        return result
    
    user_message = content.text
    
    # Check for inappropriate content
    if contains_inappropriate_content(user_message):
        # Block the request by replacing message
        new_text = "I cannot process this request as it violates our content guidelines."
        new_content = TextContent(type="text", text=new_text)
        new_message = Message(role=last_message.role, content=new_content)
        
        modified_payload = agent_pre_invoke_payload.copy(deep=True)
        modified_payload.messages[-1] = new_message
        
        result.continue_processing = False
        result.modified_payload = modified_payload
        return result
    
    # Allow through
    result.continue_processing = True
    result.modified_payload = agent_pre_invoke_payload
    return result
```

#### Post-invoke Guardrails
Post-invoke plugins run AFTER the agent generates a response. They can filter, modify, or redact output.

```python
# plugins/pii_filter_plugin.py
from ibm_watsonx_orchestrate.agent_builder.tools import tool
from ibm_watsonx_orchestrate.agent_builder.tools.types import (
    PythonToolKind,
    PluginContext,
    AgentPostInvokePayload,
    AgentPostInvokeResult,
    TextContent,
    Message
)
import re

@tool(description="Redacts PII from responses", kind=PythonToolKind.AGENTPOSTINVOKE)
def pii_filter_guardrail(plugin_context: PluginContext, agent_post_invoke_payload: AgentPostInvokePayload) -> AgentPostInvokeResult:
    """Detect and redact PII in responses."""
    result = AgentPostInvokeResult()
    
    # Check if we have messages
    if not agent_post_invoke_payload or not agent_post_invoke_payload.messages or len(agent_post_invoke_payload.messages) == 0:
        result.continue_processing = False
        return result
    
    # Get agent's response
    first_msg = agent_post_invoke_payload.messages[0]
    content = getattr(first_msg, "content", None)
    
    if content is None or not hasattr(content, "text") or content.text is None:
        result.continue_processing = False
        return result
    
    response_text = content.text
    
    # Redact PII patterns
    response_text = re.sub(r'\b\d{3}-\d{2}-\d{4}\b', '[SSN REDACTED]', response_text)
    response_text = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[EMAIL REDACTED]', response_text)
    
    # Create modified response
    new_content = TextContent(type="text", text=response_text)
    new_message = Message(role=first_msg.role, content=new_content)
    
    modified_payload = agent_post_invoke_payload.copy(deep=True)
    modified_payload.messages[0] = new_message
    
    result.continue_processing = True
    result.modified_payload = modified_payload
    return result
```

#### Attaching Plugins to Agents
```yaml
# agent-with-guardrails.yaml
spec_version: v1
kind: native
name: safe_customer_support
description: Customer support agent with safety guardrails

instructions: |
  You are a helpful customer support agent.

llm: groq/openai/gpt-oss-120b

tools:
  - check_order_status

# Attach guardrail plugins
plugins:
  agent_pre_invoke:
    - plugin_name: content_safety_guardrail
  agent_post_invoke:
    - plugin_name: pii_filter_guardrail

hidden: false
```

### Security Best Practices
- **Never hardcode credentials** - Use connections and environment variables
- **Sanitize all inputs** - Validate and clean user inputs
- **Implement rate limiting** - Protect against abuse
- **Use least privilege** - Grant minimal necessary permissions
- **Audit logging** - Log security-relevant events
- **Regular security testing** - Run vulnerability scans

### Credential Management
```yaml
# connections/api-connection.yaml
name: external-api
type: http
auth:
  type: bearer_token
  token: ${API_TOKEN}  # From environment variable
```
### Creating Connections for External Model APIs

When importing external models (like OpenAI, Anthropic, etc.) that require API keys, follow this three-step process:

#### Step 1: Add the Connection
```bash
orchestrate connections add --app-id <connection-name> --env draft
orchestrate connections add --app-id <connection-name> --env live
```

#### Step 2: Configure the Connection
Use `key_value` kind for API key-based connections:
```bash
orchestrate connections configure --app-id <connection-name> --env draft --type team --kind key_value
orchestrate connections configure --app-id <connection-name> --env live --type team --kind key_value
```

**Parameters:**
- `--type team` - Credentials shared across all users (use `member` for per-user credentials)
- `--kind key_value` - Allows passing arbitrary key-value pairs for flexible authentication

#### Step 3: Set Credentials
Set the API key as a key-value pair with the key name "api_key":
```bash
orchestrate connections set-credentials --app-id <connection-name> --env draft --entries "api_key=$YOUR_API_KEY"
orchestrate connections set-credentials --app-id <connection-name> --env live --entries "api_key=$YOUR_API_KEY"
```

#### Example: OpenAI Connection Script
```bash
#!/bin/bash
set -e

APP_ID="openai"

# Check environment variable
if [ -z "$OPENAI_API_KEY" ]; then
    echo "Error: OPENAI_API_KEY environment variable is not set"
    exit 1
fi

# Draft environment
orchestrate connections add --app-id "$APP_ID" --env draft
orchestrate connections configure --app-id "$APP_ID" --env draft --type team --kind key_value
orchestrate connections set-credentials --app-id "$APP_ID" --env draft --entries "api_key=$OPENAI_API_KEY"

# Live environment
orchestrate connections add --app-id "$APP_ID" --env live
orchestrate connections configure --app-id "$APP_ID" --env live --type team --kind key_value
orchestrate connections set-credentials --app-id "$APP_ID" --env live --entries "api_key=$OPENAI_API_KEY"

echo "✓ Connection created successfully"
```

**Important Notes:**
- Always use environment variables for API keys, never hardcode them
- The `key_value` kind is more flexible than `api_key` kind for model integrations
- Use the key name "api_key" when setting credentials for consistency
- Verify the connection exists: `orchestrate connections list`

### Importing External Models

After creating a connection for an external model provider, import the model to make it available for use in agents.

#### Model Import Command
```bash
orchestrate models add --name <model-id> --app-id <connection-name>
```

**Parameters:**
- `--name` - The model identifier in format `provider/model-name` (e.g., `openai/gpt-4`, `openai/gpt-5-2025-08-07`)
- `--app-id` - The connection name created in the previous step (e.g., `openai`)

**Important Notes:**
- The `orchestrate models add` command does NOT support `--env` parameter
- Models are added globally and available in all environments
- Model ID format must match the provider's naming convention

#### Example: Import OpenAI Model Script
```bash
#!/bin/bash
set -e

MODEL_ID="openai/gpt-5-2025-08-07"
CONNECTION_NAME="openai"

echo "Importing OpenAI model: $MODEL_ID"
echo "Using connection: $CONNECTION_NAME"
echo ""

# Add model
echo "Adding model..."
orchestrate models add \
  --name "$MODEL_ID" \
  --app-id "$CONNECTION_NAME"

if [ $? -eq 0 ]; then
    echo "✓ Successfully added model"
else
    echo "✗ Failed to add model"
    exit 1
fi

echo ""
echo "✓ Model added successfully"
echo ""
echo "To verify the import, run:"
echo "  orchestrate models list"
```

#### Verification
```bash
# List all imported models
orchestrate models list
```


---

## 5. Deployment & Channels

### Channel Configuration

#### Slack Channel
```yaml
# channels/slack-channel.yaml
name: customer-support-slack
type: slack
agent: customer-support-agent
settings:
  workspace_id: ${SLACK_WORKSPACE_ID}
  bot_token: ${SLACK_BOT_TOKEN}
```

#### Web Chat Channel
```yaml
# channels/web-chat.yaml
name: website-chat
type: web
agent: product-assistant
settings:
  theme: light
  welcome_message: "How can I help you today?"
```

### Environment-Specific Configurations
- **Development** - Use test credentials, verbose logging
- **Staging** - Mirror production, use staging APIs
- **Production** - Production credentials, optimized settings

### Deployment Process
```bash
# 1. Import all artifacts
./import-all.sh

# 2. Verify deployment
orchestrate agents list

# 3. Deploy agent (not available in Developer Edition)
orchestrate agents deploy --name <agent-name>

# 4. Deploy to channels
orchestrate channels deploy <channel-name>
```

### Deployment Verification
- Test agent responses in each channel
- Verify connection configurations
- Check guardrail activation
- Monitor initial usage metrics

### Rollback Strategy
- Keep previous versions tagged
- Document rollback procedures
- Test rollback in staging first
- Monitor post-rollback metrics

---

## 6. MCP Server Integration

### MCP Toolkit YAML Format

**CRITICAL**: MCP toolkit YAML files must follow the official watsonx Orchestrate format for importing from files.

#### Required YAML Structure
```yaml
spec_version: v1              # Required: Always use v1
kind: mcp                     # Required: Must be "mcp"
name: toolkit-name            # Required: Toolkit identifier
description: "Description"    # Required: Clear description of toolkit purpose
command: python3 server.py    # Required: Command to start MCP server (single string)
env: []                       # Required: Environment variables (empty array if none)
tools:                        # Required: Tools to import
  - "*"                       # Use "*" to import all tools, or list specific tools
package_root: .               # Required: Path to MCP server package (relative to YAML file)
connections: []               # Optional: List of connection app_ids to bind
```

#### Local Python MCP Server Example
```yaml
# toolkits/product-catalog-toolkit.yaml
spec_version: v1
kind: mcp
name: product-catalog
description: Product catalog MCP server providing search, details, inventory, and recommendations
command: python3 product_catalog_server.py
env: []
tools:
  - "*"
package_root: .
```

#### Local Node.js MCP Server Example
```yaml
# toolkits/weather-toolkit.yaml
spec_version: v1
kind: mcp
name: weather-service
description: Weather service providing forecasts and current conditions
command: node dist/index.js
env: []
tools:
  - "*"
package_root: ./weather-server
```

#### MCP Server with Connection
```yaml
# toolkits/api-toolkit.yaml
spec_version: v1
kind: mcp
name: external-api
description: External API integration toolkit
command: python3 api_server.py
env: []
tools:
  - "*"
package_root: .
connections:
  - external-api-connection
```

#### Common Mistakes to Avoid
❌ **Wrong - Old format:**
```yaml
name: my-toolkit
type: mcp
transport: stdio
command: python
args:
  - server.py
```

✅ **Correct - New format:**
```yaml
spec_version: v1
kind: mcp
name: my-toolkit
command: python server.py
env: []
tools:
  - "*"
package_root: .
```

#### Import Methods

**Method 1: Import from YAML file (Recommended)**
```bash
orchestrate toolkits import -f toolkits/my-toolkit.yaml
```

**Method 2: Add directly via CLI**
```bash
orchestrate toolkits add \
  --kind mcp \
  --name my-toolkit \
  --description "Toolkit description" \
  --package-root ./mcp_server \
  --command "python server.py" \
  --tools "*"
```

### Referencing MCP Tools in Agent YAML

**CRITICAL**: When referencing tools from MCP toolkits in agent YAML files, you MUST use the fully qualified tool name format: `toolkit-name:tool-name`

#### Tool Reference Format
Tools imported from MCP servers are namespaced with their toolkit name. When listing tools in an agent's `tools` section or in `guidelines`, use this format:

```yaml
tools:
  - toolkit-name:tool-name
```

#### Example: Agent Using MCP Toolkit Tools

```yaml
# Agent YAML referencing MCP toolkit tools
spec_version: v1
kind: native
name: product_catalog_agent
llm: groq/openai/gpt-oss-120b

tools:
  - product-catalog:search_products
  - product-catalog:get_product_details
  - product-catalog:check_inventory
  - product-catalog:get_recommendations

guidelines:
  - condition: "The customer asks to search for products"
    action: "Use search_products tool to find matching products"
    tool: "product-catalog:search_products"
  
  - condition: "The customer asks for product details"
    action: "Use get_product_details tool with the product ID"
    tool: "product-catalog:get_product_details"
```

#### Verifying Tool Names

To see the exact tool names as they appear in the system (with toolkit prefix), run:
```bash
orchestrate tools list
```

This will show tools in the format `toolkit-name:tool-name`, which is exactly how they should be referenced in agent YAML files.

#### Common Mistakes

❌ **Wrong - Tool name without toolkit prefix:**
```yaml
tools:
  - search_products
  - get_product_details
```

✅ **Correct - Tool name with toolkit prefix:**
```yaml
tools:
  - product-catalog:search_products
  - product-catalog:get_product_details
```

**Important Notes:**
- The toolkit name used in the reference must match the `name` field in the toolkit YAML
- Tool names are case-sensitive
- Both the `tools` list and `guidelines` tool references must use the full `toolkit-name:tool-name` format
- If you get an error like "Failed to find tool. No tools found with the name 'tool-name'", you're missing the toolkit prefix

### Error Handling
- Handle server connection failures gracefully
- Implement timeout mechanisms
- Provide fallback responses when MCP unavailable
- Log MCP errors for debugging

### Resource Management
- Monitor MCP server resource usage
- Implement connection pooling for remote servers
- Set appropriate timeouts
- Clean up resources properly

### Testing MCP Integrations
```bash
# Test MCP server locally
python product_catalog_server.py

# Test toolkit import
orchestrate toolkits import toolkits/product-catalog-toolkit.yaml

# List imported tools
orchestrate tools list
```

### Documentation Requirements
- Use `watsonx-orchestrate-adk-docs` MCP server for API references
- Search documentation when uncertain about features
- Leverage code examples from documentation
- Stay updated with latest ADK best practices

---
## 6.5. Knowledge Base Development

### Knowledge Base YAML Format

**CRITICAL**: Knowledge bases in watsonx Orchestrate MUST reference external document files. Inline document content is NOT supported.

#### Required YAML Structure
```yaml
spec_version: v1
kind: knowledge_base
name: knowledge_base_name
description: |
  Clear description of what information this knowledge base contains
documents:
  - path: document1.pdf
  - path: document2.txt
  - path: document3.docx
vector_index:
  embeddings_model_name: ibm/slate-125m-english-rtrvr-v2  # Optional, this is the default
  chunk_size: 400                                          # Optional
  chunk_overlap: 50                                        # Optional
  extraction_strategy: standard                            # Optional
conversational_search_tool:                                # Optional
  generation:
    prompt_instruction: "Instructions for how to answer questions"
    max_docs_passed_to_llm: 10
    generated_response_length: Moderate
    idk_message: "Message when answer not found"
  confidence_thresholds:
    retrieval_confidence_threshold: Low
    response_confidence_threshold: Low
  query_rewrite:
    enabled: true
  citations:
    citations_shown: -1
```

#### Supported Document Formats and Size Limits

Knowledge bases support the following document types:
- **Text files (.txt)** - Up to 5 MB
- **PDF files (.pdf)** - Up to 25 MB
- **Word documents (.docx)** - Up to 25 MB
- **PowerPoint (.pptx)** - Up to 25 MB
- **Excel (.xlsx)** - Up to 1 MB
- **CSV (.csv)** - Up to 5 MB
- **HTML (.html)** - Up to 5 MB

**Limits:**
- Each file must have a unique name
- Up to 100 files per knowledge base YAML
- Document paths are relative to the YAML file location

#### Example: Product Catalog Knowledge Base

**Directory Structure:**
```
knowledge_bases/
├── product-catalog-kb.yaml
└── product_catalog.txt
```

**Knowledge Base YAML:**
```yaml
# knowledge_bases/product-catalog-kb.yaml
spec_version: v1
kind: knowledge_base
name: product_catalog_kb
description: |
  Product catalog containing detailed information about premium technology products
  including specifications, pricing, availability, and shipping information.

documents:
  - path: product_catalog.txt

vector_index:
  embeddings_model_name: ibm/slate-125m-english-rtrvr-v2
  chunk_size: 400
  chunk_overlap: 50
  extraction_strategy: standard

conversational_search_tool:
  generation:
    prompt_instruction: "Answer customer questions about products based on the catalog. Provide detailed information about specifications, pricing, and features."
    max_docs_passed_to_llm: 10
    generated_response_length: Moderate
    idk_message: "I don't have information about that product in our current catalog."
  confidence_thresholds:
    retrieval_confidence_threshold: Low
    response_confidence_threshold: Low
  query_rewrite:
    enabled: true
  citations:
    citations_shown: -1
```

**Document File (product_catalog.txt):**
```
PRODUCT CATALOG
===============

PRODUCT 1: UltraBook Pro 15
---------------------------
Product Name: UltraBook Pro 15
SKU: UBP-15-2024
Category: Laptops
Price: $1,899.99

Description:
Premium laptop designed for professionals...

Key Features:
- Processor: Intel Core i7-13700H
- RAM: 32GB DDR5
- Storage: 1TB NVMe SSD
...
```

#### Common Mistakes to Avoid

❌ **Wrong - Inline document content:**
```yaml
# This format is NOT supported
documents:
  - title: "Product 1"
    content: |
      Product information here...
  - title: "Product 2"
    content: |
      More product information...
```

✅ **Correct - External document files:**
```yaml
# This is the correct format
documents:
  - path: product_catalog.txt
  - path: faq_document.pdf
  - path: policies.docx
```

❌ **Wrong - Absolute paths:**
```yaml
documents:
  - path: /Users/username/Documents/product_catalog.txt
```

✅ **Correct - Relative paths:**
```yaml
documents:
  - path: product_catalog.txt           # Same directory as YAML
  - path: docs/faq.pdf                  # Subdirectory
  - path: ../shared/policies.docx       # Parent directory
```

### Importing Knowledge Bases

```bash
# Import knowledge base (uploads and indexes documents)
orchestrate knowledge-bases import -f knowledge_bases/product-catalog-kb.yaml

# Check import status
orchestrate knowledge-bases list

# Get detailed status (wait for "ready" status)
orchestrate knowledge-bases get -n product_catalog_kb
```

**Important:** After importing, the knowledge base needs time to index documents. Check the status before using it in agents.

### Using Knowledge Bases in Agents

Reference knowledge bases in agent YAML:

```yaml
spec_version: v1
kind: native
name: sales_agent
llm: groq/openai/gpt-oss-120b

instructions: |
  You are a helpful sales agent. Use the product catalog to answer questions.

knowledge_base:
  - product_catalog_kb  # Must match the knowledge base name exactly

tools: []
```

### Knowledge Base Best Practices

1. **Document Organization**
   - Use clear section headers in documents
   - Maintain consistent formatting
   - Include all relevant information (specs, pricing, policies)
   - Keep documents focused on specific topics

2. **File Management**
   - Store documents in the same directory as the YAML file
   - Use descriptive filenames
   - Keep file sizes within limits
   - Use appropriate file formats for content type

3. **Chunking Strategy**
   - Default chunk size (400) works well for most content
   - Increase chunk_overlap for better context continuity
   - Adjust chunk_size based on document structure

4. **Embedding Models**
   - Default model (ibm/slate-125m-english-rtrvr-v2) is optimized for retrieval
   - Can use custom embedding models if needed
   - Consider model capabilities for your language/domain

5. **Testing**
   - Wait for indexing to complete before testing
   - Test with various query types
   - Verify citation accuracy
   - Monitor retrieval quality

6. **Updates**
   - Re-import knowledge base after document changes
   - Documents are re-indexed on each import
   - Old versions are replaced

### Troubleshooting Knowledge Bases

**Problem: Knowledge base not found**
```bash
# Verify import
orchestrate knowledge-bases list

# Check specific knowledge base
orchestrate knowledge-bases get -n product_catalog_kb
```

**Problem: Documents not indexed**
- Check knowledge base status (should be "ready")
- Verify document files exist at specified paths
- Ensure file sizes are within limits
- Check for file format compatibility

**Problem: Poor retrieval quality**
- Adjust chunk_size and chunk_overlap
- Improve document structure and formatting
- Add more context to documents
- Enable query rewriting
- Lower confidence thresholds

**Problem: Agent can't access knowledge base**
- Verify knowledge base name matches exactly
- Check knowledge base is in "ready" state
- Ensure agent YAML references correct name
- Re-import agent if needed

---


## 7. Documentation Standards

### README.md Requirements
```markdown
# Project Name

## Overview
Brief description of the project and its purpose

## Architecture
[Include architecture diagram]

## Workflow
[Include workflow diagram showing agent interactions]

## Setup
1. Prerequisites
2. Installation steps
3. Configuration

## Usage
Examples of how to use the agents

## Testing
How to run tests and evaluations

## Deployment
Deployment instructions for each environment
```

### Agent YAML Documentation
```yaml
spec_version: v1
kind: native
name: customer-support-agent
llm: groq/openai/gpt-oss-120b  # Simple string format: provider/model-id
style: default  # Options: default, react, planner
hide_reasoning: false

description: |
  Handles customer support inquiries including:
  - Order status checks
  - Refund requests
  - Product information
  
instructions: |
  You are a helpful customer support agent.
  Always be polite and professional.
  Escalate complex issues to human agents.

# Guidelines for rule-based behavior control
guidelines:
  - condition: "The customer requests a refund"
    action: "Verify the order ID and process the refund using the process_refund tool"
    tool: "process_refund"
  - condition: "The customer is very upset"
    action: "Acknowledge their frustration and escalate to a supervisor"

tools:
  - check_order_status
  - process_refund

collaborators: []

knowledge_base: []

restrictions: editable  # Options: editable, non_editable

# Only include guardrails section if plugins are implemented and imported
# guardrails:
#   pre_invoke:
#     - content_safety_check
#   post_invoke:
#     - pii_detection
```

### Agent Guidelines

**IMPORTANT**: Guidelines provide rule-based behavior control for agents. They create predictable, consistent responses for specific conditions.

#### Guidelines Structure

Guidelines use a specific YAML format with three fields:

```yaml
guidelines:
  - condition: "When this situation occurs"
    action: "Then perform this action"
    tool: "tool_name"  # Optional: tool to invoke
```

#### Required Fields
- **condition** (required): The trigger condition in natural language (the "when" part)
- **action** (optional): The action to perform when condition is met (the "then" part)
- **tool** (optional): The tool name to invoke - **MUST be a tool from the `tools` list, NOT a collaborator agent**

**CRITICAL**:
- You must provide at least one of `action` or `tool` for each guideline
- The `tool` field can ONLY reference tools (as listed by `orchestrate tools list`)
- To invoke collaborator agents, describe the handoff in the `action` field using natural language
- Collaborator agents are listed in the `collaborators` section, NOT in the `tool` field of guidelines

#### Guidelines Best Practices

1. **Write Clear Conditions**: Use natural language that describes the trigger situation
   - ✅ Good: "The customer requests a refund over $10,000"
   - ❌ Bad: "High value refund"

2. **Specify Concrete Actions**: Describe exactly what the agent should do
   - ✅ Good: "Acknowledge the request, explain that high-value refunds require specialist review, and hand off to the escalation_agent collaborator"
   - ❌ Bad: "Handle it appropriately"

3. **Order Matters**: Guidelines are evaluated in order, so place more specific conditions before general ones
   ```yaml
   guidelines:
     - condition: "The refund amount exceeds $10,000"  # Specific first
       action: "Escalate to specialist"
     - condition: "The customer requests a refund"      # General second
       action: "Process normally"
       tool: "process_refund"
   ```

4. **Tool References**: When specifying a tool, ensure it exists in the `tools` list (NOT collaborators)
   ```yaml
   tools:
     - process_refund
     - check_order_status
   
   collaborators:
     - escalation_agent
   
   guidelines:
     - condition: "Customer asks about order"
       tool: "check_order_status"  # ✅ CORRECT - references a tool
     
     - condition: "Customer needs escalation"
       action: "Hand off to the escalation_agent collaborator"  # ✅ CORRECT - collaborator in action
       # ❌ WRONG: tool: "escalation_agent"  # Never reference collaborators in tool field
   ```

5. **Combine with Instructions**: Use guidelines for specific rules, instructions for general behavior
   - **Instructions**: Overall persona, tone, general approach
   - **Guidelines**: Specific "when-then" rules for predictable scenarios

#### Guidelines vs Instructions

| Use Guidelines For | Use Instructions For |
|-------------------|---------------------|
| Specific trigger conditions | General behavior and persona |
| Rule-based responses | Tone and style guidance |
| Tool invocation rules | Context and background |
| Escalation triggers | Overall approach |
| Conditional logic | Flexible decision-making |

#### Example: Complete Agent with Guidelines

```yaml
spec_version: v1
kind: native
name: customer_support_agent
llm: groq/openai/gpt-oss-120b
style: default

description: Handles customer support for orders and refunds

instructions: |
  You are a professional customer support agent.
  Always be empathetic and solution-focused.
  Use the guidelines to handle specific scenarios consistently.

guidelines:
  # Refund processing rules
  - condition: "The customer requests a refund under $500"
    action: "Process immediately and confirm 5-7 day timeline"
    tool: "process_refund"
  
  - condition: "The customer requests a refund over $10,000"
    action: "Acknowledge request and hand off to the escalation_agent collaborator for specialist review"
  
  # Escalation rules
  - condition: "The customer mentions legal action or lawyers"
    action: "Remain professional and immediately hand off to the escalation_agent collaborator"
  
  - condition: "The customer is very upset after 2-3 resolution attempts"
    action: "Acknowledge frustration and hand off to the escalation_agent collaborator"
  
  # Order status rules
  - condition: "The customer asks about their order status"
    action: "Request order ID if not provided, then check status"
    tool: "check_order_status"

tools:
  - check_order_status
  - process_refund

collaborators:
  - escalation_agent
```

#### Common Guideline Patterns

**Escalation Pattern (Collaborator Handoff):**
```yaml
- condition: "The [specific trigger condition]"
  action: "Acknowledge [the situation] and hand off to the [collaborator_name] collaborator"
  # NOTE: Do NOT use tool field for collaborators - describe handoff in action
```

**Tool Invocation Pattern:**
```yaml
- condition: "The customer [requests something]"
  action: "Verify [required info] and use the tool to [accomplish task]"
  tool: "tool_name"
```

**Conditional Processing Pattern:**
```yaml
- condition: "The [metric] is [comparison] [threshold]"
  action: "Process using [specific approach] and inform customer of [outcome]"
  tool: "tool_name"
```

**Error Handling Pattern:**
```yaml
- condition: "The [tool/operation] fails or returns an error"
  action: "Apologize, explain the issue, and [fallback action]"
```

### Tool Documentation
```python
from ibm_watsonx_orchestrate.agent_builder.tools import tool
from typing import Dict, Any

@tool
def check_order_status(order_id: str) -> Dict[str, Any]:
    """
    Check the status of a customer order.
    
    Args:
        order_id (str): The unique order identifier (format: ORD-XXXXX)
        
    Returns:
        Dict[str, Any]: Order status information including:
            - status: Current order status
            - estimated_delivery: Expected delivery date
            - tracking_number: Shipping tracking number
            
    Example:
        >>> check_order_status("ORD-12345")
        {
            "status": "shipped",
            "estimated_delivery": "2024-01-15",
            "tracking_number": "1Z999AA10123456784"
        }
    """
    # Implementation
```

### Changelog Maintenance
- Document all significant changes
- Include version numbers and dates
- Note breaking changes prominently
- Link to relevant issues or PRs

---

## 8. Troubleshooting & Debugging

### Common Error Patterns

#### Import Errors
```bash
# Error: Tool not found
# Solution: Check tool name matches @tool decorator
orchestrate tools list  # Verify tool is imported

# Error: Connection failed
# Solution: Verify connection exists and is configured
orchestrate connections list  # Check if connection exists
```

#### Runtime Errors
```bash
# Error: Agent timeout
# Solution: Optimize tool execution time
# - Reduce complexity of tool operations
# - Implement caching for repeated operations
# - Use async operations where possible

# Error: Token limit exceeded
# Solution: Reduce context, optimize prompts
# Monitor token usage in logs
```

### Debugging Locally

#### Test Tools Independently
```python
# test_tools.py
from tools.order_status_tool import check_order_status

result = check_order_status("ORD-12345")
print(result)
```

#### Test Flows with Mock Data
```python
# test_flow.py
from tools.customer_flow import customer_support_flow

test_input = {
    "user_message": "Where is my order?",
    "order_id": "ORD-12345"
}

result = customer_support_flow(test_input)
print(result)
```

### Log Analysis
- Check agent execution logs for errors
- Review tool invocation logs
- Analyze token usage patterns
- Monitor response times

### Connection Troubleshooting
```bash
# List all connections
orchestrate connections list

# Import connection from YAML
orchestrate connections import -f connections/my-connection.yaml

# Set credentials for connection
orchestrate connections set-credentials -a <app-id> --env draft -u <username> -p <password>
```

---

## 9. Performance Optimization

### Token Usage Optimization
- Use concise, clear prompts
- Avoid redundant context in multi-turn conversations
- Implement conversation summarization for long sessions
- Choose appropriate model sizes for tasks

### Caching Strategies
- Cache frequently accessed data (product catalogs, FAQs)
- Implement response caching for common queries
- Use knowledge bases for static information
- Cache API responses when appropriate

### Efficient Tool Chaining
```python
import asyncio
from ibm_watsonx_orchestrate.agent_builder.tools import flow

@flow
async def optimized_flow(input_data: dict) -> dict:
    """Efficient flow with parallel tool execution."""
    # Execute independent tools in parallel
    results = await asyncio.gather(
        tool_a(input_data),
        tool_b(input_data),
        tool_c(input_data)
    )
    
    # Process results
    return combine_results(results)
```

### Knowledge Base Optimization
- Structure knowledge bases for efficient retrieval
- Use appropriate chunk sizes
- Implement relevance scoring
- Regular knowledge base updates and pruning

### Model Selection Guidelines
- **Simple tasks** - Use smaller, faster models
- **Complex reasoning** - Use larger, more capable models
- **Cost-sensitive** - Balance performance vs. cost
- **Latency-sensitive** - Prioritize faster models

---

## 10. Quick Reference Commands

### Agent Management
```bash
# List agents
orchestrate agents list

# Import agent
orchestrate agents import -f agents/my-agent.yaml

# Deploy agent (not in Developer Edition)
orchestrate agents deploy --name my-agent

# Undeploy agent (not in Developer Edition)
orchestrate agents undeploy --name my-agent

# Remove agent
orchestrate agents remove --name my-agent
```

### Tool Management
```bash
# List tools
orchestrate tools list

# Import Python tool
orchestrate tools import -k python -f tools/my-tool.py -r requirements.txt

# Remove tool
orchestrate tools remove -n my-tool
```

### Toolkit Management
```bash
# List toolkits
orchestrate toolkits list

# Add MCP toolkit
orchestrate toolkits add --kind mcp --name my-toolkit --description "My toolkit" --package-root /path/to/folder --command '["node", "dist/index.js"]' --tools "*"

# Export toolkit
orchestrate toolkits export -n my-toolkit -o my-toolkit.zip

# Remove toolkit
orchestrate toolkits remove -n my-toolkit
```

### Connection Management
```bash
# List connections
orchestrate connections list

# Import connection from YAML
orchestrate connections import -f connections/my-connection.yaml

# Export connection
orchestrate connections export -a <app-id> -o connection.yaml

# Remove connection
orchestrate connections remove -a <app-id>
```

### Channel Management
```bash
# List supported channel types
orchestrate channels list

# List channels for an agent
orchestrate channels list-channels --agent-name my-agent --env draft

# Import/create channel from file
orchestrate channels import --agent-name my-agent --env draft --file channels/my-channel.yaml

# Export channel
orchestrate channels export --agent-name my-agent --env draft --type webchat --name my-channel -o channel.yaml

# Delete channel
orchestrate channels delete --agent-name my-agent --env draft --type webchat --name my-channel
```

### Evaluation & Testing
```bash
# Quick evaluation (reference-less)
orchestrate evaluations quick-eval -p tests/ -o results/ -t tools/

# Quick evaluation with config file
orchestrate evaluations quick-eval -c evaluation/config.yaml

# Standard evaluation (requires test datasets)
orchestrate evaluations evaluate -c evaluation/eval-config.yaml
```

### Deployment
```bash
# Import all artifacts
./import-all.sh

# Deploy agent (not available in Developer Edition)
orchestrate agents deploy --name my-agent

# Undeploy agent (revert to previous version)
orchestrate agents undeploy --name my-agent

# Export agent with dependencies
orchestrate agents export -k native -n my-agent -o my-agent.zip
```

---

## Best Practices Summary

1. **Always use CLI** for importing agents and tools
2. **Test locally first** before deploying to production
3. **Use connections** for all external API integrations
4. **Implement guardrails** for safety and compliance
5. **Document everything** - code, configurations, workflows
6. **Version control** all artifacts and configurations
7. **Monitor performance** - tokens, latency, success rates
8. **Security first** - never commit credentials, sanitize inputs
9. **Evaluate regularly** - maintain test cases, run evaluations
10. **Leverage MCP servers** - especially `watsonx-orchestrate-adk-docs` for guidance