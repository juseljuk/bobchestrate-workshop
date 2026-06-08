# Part 6b: Agentic Workflows - Deterministic Tool Orchestration

<p align="center">
  <img src="bobchestrate_part6b.png" alt="Bobchestrate - Agentic Workflows" width="700">
</p>

**Duration**: 25-30 minutes

**Difficulty**: Intermediate

## Overview

In this lesson, you'll learn how to create **agentic workflows** - deterministic, predefined sequences of tool executions that are faster and more cost-effective than agent-based approaches for fixed business processes.

### What You'll Learn

- What agentic workflows are and when to use them
- The difference between workflows and agent-based approaches
- How to build workflows using the Flow Builder
- Parameter mapping and conditional branching
- Testing and importing workflows
- Best practices for workflow design

### What You'll Build

A **Loan Approval Workflow** that demonstrates:

- Sequential tool execution
- Conditional branching based on business rules
- Parameter mapping between tools
- Integration with MCP toolkit tools
- Error handling and validation

---

## What are Agentic Workflows?

**Agentic workflows** are deterministic, predefined sequences of tool executions - NOT agents that use LLM reasoning at each step. Think of them as "smart automation pipelines" that execute tools in a specific order with conditional logic.

### Key Characteristics

- ✅ **Deterministic** - Same inputs always produce same execution path
- ✅ **Predefined** - Steps are defined upfront, not decided by LLM
- ✅ **Fast** - 60% faster than agent-based approaches
- ✅ **Cost-effective** - 80% lower cost (no LLM calls between steps)
- ✅ **Predictable** - Guaranteed execution order and behavior

### Workflows vs Agents

| Aspect | Agentic Workflow | Agent-Based |
|--------|-----------------|-------------|
| **Decision Making** | Predefined rules | LLM reasoning |
| **Execution Time** | ~2-3 seconds | ~5-8 seconds |
| **Cost** | 80% lower | Baseline |
| **Predictability** | 100% deterministic | Variable |
| **Best For** | Fixed processes | Dynamic reasoning |
| **Token Usage** | Minimal | High |

---

## When to Use Workflows vs Agents

### Use Agentic Workflows When:

- ✅ Process is deterministic and follows a fixed sequence
- ✅ Steps are well-defined with clear inputs/outputs
- ✅ You need guaranteed execution order
- ✅ Performance and cost optimization are critical
- ✅ No LLM reasoning needed between steps
- ✅ Examples: loan approval, order processing, data validation pipelines

### Use Agents When:

- ✅ Process requires dynamic decision-making
- ✅ Steps depend on LLM reasoning and context
- ✅ Flexibility and adaptability are more important than speed
- ✅ User interaction and conversation are needed
- ✅ Examples: customer support, complex problem-solving, creative tasks

---

## Building Your First Workflow

### Step 1: Create the MCP Toolkit with Tools

First, we need tools that our workflow will orchestrate. Let's create a simple loan processing toolkit.

Create `tools/loan_processing_server.py`:

```python
"""
Loan Processing MCP Server
Provides tools for credit checks, income verification, and loan decisions.
"""

from mcp.server import Server
from mcp.types import Tool, TextContent
import mcp.server.stdio
import json

# Initialize MCP server
server = Server("loan-processing")

@server.list_tools()
async def list_tools() -> list[Tool]:
    """List available loan processing tools."""
    return [
        Tool(
            name="check_credit_score",
            description="Check applicant's credit score",
            inputSchema={
                "type": "object",
                "properties": {
                    "applicant_id": {
                        "type": "string",
                        "description": "Unique applicant identifier"
                    }
                },
                "required": ["applicant_id"]
            }
        ),
        Tool(
            name="verify_income",
            description="Verify applicant's income and employment",
            inputSchema={
                "type": "object",
                "properties": {
                    "applicant_id": {
                        "type": "string",
                        "description": "Unique applicant identifier"
                    }
                },
                "required": ["applicant_id"]
            }
        ),
        Tool(
            name="calculate_debt_to_income",
            description="Calculate debt-to-income ratio",
            inputSchema={
                "type": "object",
                "properties": {
                    "applicant_id": {
                        "type": "string",
                        "description": "Unique applicant identifier"
                    },
                    "monthly_income": {
                        "type": "number",
                        "description": "Monthly income amount"
                    }
                },
                "required": ["applicant_id", "monthly_income"]
            }
        ),
        Tool(
            name="make_loan_decision",
            description="Make final loan approval decision",
            inputSchema={
                "type": "object",
                "properties": {
                    "applicant_id": {
                        "type": "string",
                        "description": "Unique applicant identifier"
                    },
                    "credit_score": {
                        "type": "number",
                        "description": "Credit score"
                    },
                    "dti_ratio": {
                        "type": "number",
                        "description": "Debt-to-income ratio"
                    },
                    "loan_amount": {
                        "type": "number",
                        "description": "Requested loan amount"
                    }
                },
                "required": ["applicant_id", "credit_score", "dti_ratio", "loan_amount"]
            }
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    """Execute loan processing tools."""
    
    if name == "check_credit_score":
        applicant_id = arguments["applicant_id"]
        # Simulate credit check
        credit_score = 720  # Mock data
        result = {
            "applicant_id": applicant_id,
            "credit_score": credit_score,
            "status": "excellent" if credit_score >= 700 else "good" if credit_score >= 650 else "fair"
        }
        return [TextContent(type="text", text=json.dumps(result))]
    
    elif name == "verify_income":
        applicant_id = arguments["applicant_id"]
        # Simulate income verification
        result = {
            "applicant_id": applicant_id,
            "monthly_income": 8500,
            "employment_status": "employed",
            "years_employed": 5,
            "verified": True
        }
        return [TextContent(type="text", text=json.dumps(result))]
    
    elif name == "calculate_debt_to_income":
        applicant_id = arguments["applicant_id"]
        monthly_income = arguments["monthly_income"]
        # Simulate DTI calculation
        monthly_debt = 2000  # Mock data
        dti_ratio = (monthly_debt / monthly_income) * 100
        result = {
            "applicant_id": applicant_id,
            "monthly_income": monthly_income,
            "monthly_debt": monthly_debt,
            "dti_ratio": round(dti_ratio, 2),
            "status": "excellent" if dti_ratio < 36 else "acceptable" if dti_ratio < 43 else "high"
        }
        return [TextContent(type="text", text=json.dumps(result))]
    
    elif name == "make_loan_decision":
        applicant_id = arguments["applicant_id"]
        credit_score = arguments["credit_score"]
        dti_ratio = arguments["dti_ratio"]
        loan_amount = arguments["loan_amount"]
        
        # Business rules for loan approval
        approved = (
            credit_score >= 650 and
            dti_ratio < 43 and
            loan_amount <= 500000
        )
        
        result = {
            "applicant_id": applicant_id,
            "decision": "approved" if approved else "denied",
            "credit_score": credit_score,
            "dti_ratio": dti_ratio,
            "loan_amount": loan_amount,
            "reason": "Meets all criteria" if approved else "Does not meet approval criteria"
        }
        return [TextContent(type="text", text=json.dumps(result))]
    
    else:
        raise ValueError(f"Unknown tool: {name}")

async def main():
    """Run the MCP server."""
    async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options()
        )

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

### Step 2: Create the Toolkit YAML

Create `tools/loan-processing-toolkit.yaml`:

```yaml
spec_version: v1
kind: mcp
name: loan-processing
description: Loan processing toolkit with credit checks, income verification, and decision tools
command: python3 loan_processing_server.py
env: []
tools:
  - "*"
package_root: .
```

### Step 3: Create the Agentic Workflow

Now create the workflow that orchestrates these tools. Create `tools/loan_approval_workflow.py`:

```python
"""
Loan Approval Workflow
Deterministic workflow for processing loan applications.
"""

from ibm_watsonx_orchestrate.flow_builder.flows import (
    Flow, flow, START, END, Branch
)
from pydantic import BaseModel, Field
from typing import Dict, Any

class LoanApplicationInput(BaseModel):
    """Input schema for loan application workflow."""
    applicant_id: str = Field(description="Unique applicant identifier")
    loan_amount: float = Field(description="Requested loan amount")

class LoanApplicationOutput(BaseModel):
    """Output schema for loan application workflow."""
    decision: str = Field(description="Loan decision: approved or denied")
    applicant_id: str = Field(description="Applicant identifier")
    credit_score: float = Field(description="Credit score")
    dti_ratio: float = Field(description="Debt-to-income ratio")
    reason: str = Field(description="Decision reason")

@flow(
    name="loan_approval_workflow",
    description="Automated loan approval workflow with credit checks and income verification",
    input_schema=LoanApplicationInput,
    output_schema=LoanApplicationOutput
)
def build_loan_approval_workflow(aflow: Flow) -> Flow:
    """
    Build the loan approval workflow graph.
    
    This workflow:
    1. Checks credit score
    2. Verifies income
    3. Calculates debt-to-income ratio
    4. Makes loan decision based on business rules
    
    Args:
        aflow (Flow): The flow builder instance
        
    Returns:
        Flow: The configured workflow
    """
    
    # Step 1: Check credit score
    check_credit = aflow.tool("loan-processing:check_credit_score")
    check_credit.map_input(
        input_variable="applicant_id",
        expression="flow.input.applicant_id"
    )
    
    # Step 2: Verify income
    verify_income = aflow.tool("loan-processing:verify_income")
    verify_income.map_input(
        input_variable="applicant_id",
        expression="flow.input.applicant_id"
    )
    
    # Step 3: Calculate debt-to-income ratio
    calculate_dti = aflow.tool("loan-processing:calculate_debt_to_income")
    calculate_dti.map_input(
        input_variable="applicant_id",
        expression="flow.input.applicant_id"
    )
    calculate_dti.map_input(
        input_variable="monthly_income",
        expression="verify_income.output.monthly_income"
    )
    
    # Step 4: Make loan decision
    make_decision = aflow.tool("loan-processing:make_loan_decision")
    make_decision.map_input(
        input_variable="applicant_id",
        expression="flow.input.applicant_id"
    )
    make_decision.map_input(
        input_variable="credit_score",
        expression="check_credit.output.credit_score"
    )
    make_decision.map_input(
        input_variable="dti_ratio",
        expression="calculate_dti.output.dti_ratio"
    )
    make_decision.map_input(
        input_variable="loan_amount",
        expression="flow.input.loan_amount"
    )
    
    # Build the workflow graph
    aflow.edge(START, check_credit)
    aflow.edge(check_credit, verify_income)
    aflow.edge(verify_income, calculate_dti)
    aflow.edge(calculate_dti, make_decision)
    aflow.edge(make_decision, END)
    
    return aflow
```

### Step 4: Create requirements.txt

Create `tools/requirements.txt`:

```
mcp>=1.0.0
pydantic>=2.0.0
```

---

## Importing and Testing

### Import the Toolkit

```bash
# Import the MCP toolkit
orchestrate toolkits import -f tools/loan-processing-toolkit.yaml

# Verify tools are available
orchestrate tools list | grep loan-processing
```

### Import the Workflow

**CRITICAL**: Workflows are imported as flow-type tools:

```bash
# Import the workflow
orchestrate tools import -k flow -f tools/loan_approval_workflow.py

# Verify workflow is imported
orchestrate tools list | grep loan_approval_workflow
```

### Create a Test Agent

Create `agents/loan-processor-agent.yaml`:

```yaml
spec_version: v1
kind: native
name: loan_processor_agent
description: Agent that uses the loan approval workflow

llm: groq/openai/gpt-oss-120b
style: default

instructions: |
  You are a loan processing assistant. When a user provides loan application details,
  use the loan_approval_workflow tool to process their application.
  
  Always collect:
  - Applicant ID
  - Loan amount requested
  
  Then use the workflow to get an instant decision.

tools:
  - loan_approval_workflow

guidelines:
  - condition: "User provides loan application details"
    action: "Use loan_approval_workflow with applicant_id and loan_amount"
    tool: "loan_approval_workflow"

hidden: false
```

### Import and Test the Agent

```bash
# Import the agent
orchestrate agents import -f agents/loan-processor-agent.yaml

# Test in chat
orchestrate chat -a loan_processor_agent
```

**Test conversation:**
```
You: I'd like to apply for a loan. My applicant ID is APP-12345 and I need $250,000.

Agent: [Uses loan_approval_workflow and returns decision]
```

---

## Workflow Patterns

### Sequential Execution

```python
# Connect tools in sequence
aflow.edge(START, tool1)
aflow.edge(tool1, tool2)
aflow.edge(tool2, tool3)
aflow.edge(tool3, END)

# Or use sequence helper
aflow.sequence(START, tool1, tool2, tool3, END)
```

### Conditional Branching

```python
# Create branch with evaluator expression
branch: Branch = aflow.branch(
    evaluator="check_credit.output.credit_score > 700"
)

# Define cases
branch.case(True, approved_path)
branch.case(False, rejected_path)

# Connect to END
aflow.edge(approved_path, END)
aflow.edge(rejected_path, END)
```

### Parallel Execution (Foreach)

```python
# Process items in parallel
foreach_node = aflow.foreach(
    items="flow.input.items",
    body=process_item_tool
)

aflow.edge(START, foreach_node)
aflow.edge(foreach_node, END)
```

---

## Parameter Mapping Rules

**CRITICAL**: Always use `map_input()` to pass data to tool nodes.

### Syntax

```python
node.map_input(
    input_variable="param_name",
    expression="source"
)
```

### Sources

- **Workflow input**: `"flow.input.parameter_name"`
- **Previous node output**: `"node_name.output.field_name"`
- **Default values**: Add `default_value="value"` parameter

### Common Error

❌ **Wrong - Forgetting map_input():**
```python
tool_node = aflow.tool("toolkit:tool_name")
# Missing parameter mapping!
```

✅ **Correct - With parameter mapping:**
```python
tool_node = aflow.tool("toolkit:tool_name")
tool_node.map_input(
    input_variable="customer_id",
    expression="flow.input.customer_id"
)
```

---

## Best Practices

### 1. Clear Naming
Use descriptive workflow names:
- ✅ `loan_approval_workflow`
- ❌ `process_loan`

### 2. Schema Validation
Always define Pydantic input/output schemas:

```python
class WorkflowInput(BaseModel):
    """Clear description of inputs."""
    param: str = Field(description="What this parameter does")

class WorkflowOutput(BaseModel):
    """Clear description of outputs."""
    result: str = Field(description="What this result means")
```

### 3. Error Handling
Design workflows to handle failures gracefully:

```python
# Add error handling nodes
error_handler = aflow.tool("toolkit:handle_error")
aflow.edge(risky_operation, error_handler, condition="on_error")
```

### 4. Documentation
Include comprehensive docstrings:

```python
@flow(
    name="my_workflow",
    description="Clear one-line description",
    input_schema=InputSchema,
    output_schema=OutputSchema
)
def build_workflow(aflow: Flow) -> Flow:
    """
    Detailed explanation of what the workflow does.
    
    Steps:
    1. First step
    2. Second step
    3. Third step
    
    Args:
        aflow: Flow builder instance
        
    Returns:
        Configured flow
    """
```

### 5. Tool Dependencies
Ensure all referenced tools are imported before workflow:

```bash
# Import toolkit first
orchestrate toolkits import -f toolkit.yaml

# Then import workflow
orchestrate tools import -k flow -f workflow.py
```

---

## Testing Workflows

**IMPORTANT**: Workflows can only be tested programmatically in Developer Edition local environment. For other environments, test through agents.

### Option 1: Test via Agent (Recommended)

Create a test agent that uses the workflow as a tool:

```yaml
# agents/test-agent.yaml
spec_version: v1
kind: native
name: workflow_test_agent
llm: groq/openai/gpt-oss-120b

tools:
  - my_workflow

guidelines:
  - condition: "User requests workflow execution"
    action: "Use my_workflow tool with required parameters"
    tool: "my_workflow"
```

### Option 2: Simulation Test (Local)

```python
# tests/test_workflow.py
def test_workflow_logic():
    """Test workflow business logic without platform."""
    # Simulate workflow steps
    result = simulate_workflow_execution(test_input)
    assert result['status'] == 'success'
```

---

## Common Mistakes

### ❌ Wrong - Missing toolkit prefix

```python
tool_node = aflow.tool("check_credit")  # Will fail
```

### ✅ Correct - With toolkit prefix

```python
tool_node = aflow.tool("loan-processing:check_credit_score")
```

### ❌ Wrong - Incorrect import path

```python
from ibm_watsonx_orchestrate.agent_builder.tools import flow  # Wrong module
```

### ✅ Correct - Flow builder import

```python
from ibm_watsonx_orchestrate.flow_builder.flows import flow
```

### ❌ Wrong - Missing parameter mapping

```python
tool_node = aflow.tool("toolkit:tool")
# No map_input() - tool will receive empty parameters!
```

### ✅ Correct - With parameter mapping

```python
tool_node = aflow.tool("toolkit:tool")
tool_node.map_input(input_variable="param", expression="flow.input.param")
```

---

## Performance Comparison

| Metric | Agentic Workflow | Agent-Based |
|--------|-----------------|-------------|
| Execution Time | ~2-3 seconds | ~5-8 seconds |
| Token Usage | Minimal (no LLM calls) | High (LLM at each step) |
| Cost | 80% lower | Baseline |
| Predictability | 100% deterministic | Variable |
| Use Case | Fixed processes | Dynamic reasoning |

---

## Next Steps

Now that you understand agentic workflows, you can:

1. ✅ Create workflows for your own business processes
2. ✅ Combine workflows with agents for hybrid solutions
3. ✅ Use workflows within multi-agent systems
4. ✅ Optimize costs by replacing agent chains with workflows

Continue to [Part 7: Agent Evaluations](../part7-agent-evaluation/README.md) to learn how to evaluate your workflows and agents! →