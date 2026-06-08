# Part 6b: Agentic Workflows - Exercises

<p align="center">
  <img src="bobchestrate_part6b_exercises.png" alt="Bobchestrate - Exercises" width="700">
</p>

## Exercise 1: Build an Order Processing Workflow

**Difficulty:** Intermediate  
**Time:** 20-25 minutes

### Objective
Create an agentic workflow that processes customer orders through validation, inventory check, payment processing, and shipping.

### Requirements

1. **Create an MCP toolkit** with these tools:
   - `validate_order` - Validates order details (customer ID, items, quantities)
   - `check_inventory` - Checks if items are in stock
   - `process_payment` - Processes payment for the order
   - `schedule_shipping` - Schedules shipping for approved orders

2. **Create the workflow** that:
   - Takes order details as input (customer_id, items, total_amount)
   - Validates the order first
   - Checks inventory availability
   - Processes payment if inventory is available
   - Schedules shipping if payment succeeds
   - Returns order status and tracking information

3. **Add conditional branching**:
   - If inventory check fails → return "out of stock" status
   - If payment fails → return "payment declined" status
   - If all succeed → return "order confirmed" with tracking number

### Success Criteria

- ✅ Workflow executes all steps in correct order
- ✅ Conditional branches work correctly
- ✅ Parameters are properly mapped between tools
- ✅ Workflow can be imported and used by an agent
- ✅ Agent can successfully process test orders

### Hints

```python
# Workflow structure
@flow(
    name="order_processing_workflow",
    description="Process customer orders from validation to shipping",
    input_schema=OrderInput,
    output_schema=OrderOutput
)
def build_order_workflow(aflow: Flow) -> Flow:
    # Create tool nodes
    validate = aflow.tool("order-processing:validate_order")
    check_inv = aflow.tool("order-processing:check_inventory")
    process_pay = aflow.tool("order-processing:process_payment")
    schedule_ship = aflow.tool("order-processing:schedule_shipping")
    
    # Map inputs
    validate.map_input(input_variable="customer_id", expression="flow.input.customer_id")
    # ... add more mappings
    
    # Create branches for conditional logic
    inventory_branch = aflow.branch(
        evaluator="check_inv.output.in_stock == true"
    )
    
    # Build graph
    aflow.edge(START, validate)
    aflow.edge(validate, check_inv)
    aflow.edge(check_inv, inventory_branch)
    inventory_branch.case(True, process_pay)
    inventory_branch.case(False, END)
    # ... complete the graph
    
    return aflow
```

---

## Exercise 2: Add Error Handling to Loan Workflow

**Difficulty:** Advanced  
**Time:** 15-20 minutes

### Objective
Enhance the loan approval workflow with error handling and retry logic.

### Requirements

1. **Add error handling tools** to the loan processing toolkit:
   - `handle_credit_check_error` - Handles credit check failures
   - `retry_income_verification` - Retries income verification with alternative method
   - `log_workflow_error` - Logs errors for monitoring

2. **Modify the workflow** to:
   - Catch errors from credit check and income verification
   - Retry failed operations once before failing
   - Log all errors for debugging
   - Return detailed error information in output

3. **Test error scenarios**:
   - Simulate credit check timeout
   - Simulate income verification failure
   - Verify retry logic works
   - Verify error logging captures details

### Success Criteria

- ✅ Workflow handles errors gracefully
- ✅ Retry logic executes correctly
- ✅ Errors are logged with context
- ✅ Workflow returns meaningful error messages
- ✅ Failed workflows don't crash the agent

### Hints

```python
# Add error handling edges
aflow.edge(check_credit, error_handler, condition="on_error")
aflow.edge(error_handler, retry_credit)
aflow.edge(retry_credit, decision_branch)

# Use try-catch in MCP tools
@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    try:
        # Tool logic
        result = perform_operation(arguments)
        return [TextContent(type="text", text=json.dumps(result))]
    except Exception as e:
        error_result = {
            "status": "error",
            "message": str(e),
            "retry_possible": True
        }
        return [TextContent(type="text", text=json.dumps(error_result))]
```

---

## Exercise 3: Create a Multi-Step Approval Workflow

**Difficulty:** Advanced  
**Time:** 25-30 minutes

### Objective
Build a complex approval workflow with multiple decision points and parallel processing.

### Requirements

1. **Create an expense approval toolkit** with tools:
   - `validate_expense_report` - Validates expense report format and data
   - `check_policy_compliance` - Checks if expenses comply with company policy
   - `verify_receipts` - Verifies receipt authenticity
   - `calculate_reimbursement` - Calculates reimbursement amount
   - `get_manager_approval` - Simulates manager approval (auto-approve < $500)
   - `get_finance_approval` - Simulates finance approval (for > $5000)
   - `process_reimbursement` - Processes the reimbursement payment

2. **Create the workflow** with:
   - Parallel execution of policy check and receipt verification
   - Conditional approval routing based on amount:
     - < $500: Auto-approve
     - $500-$5000: Manager approval required
     - > $5000: Manager + Finance approval required
   - Final reimbursement processing

3. **Add business rules**:
   - Policy violations → automatic rejection
   - Invalid receipts → request resubmission
   - Approvals must be sequential (manager first, then finance)

### Success Criteria

- ✅ Parallel processing works correctly
- ✅ Conditional routing based on amount works
- ✅ Sequential approvals execute in order
- ✅ Business rules are enforced
- ✅ Workflow handles all approval scenarios

### Hints

```python
# Parallel execution
policy_check = aflow.tool("expense:check_policy_compliance")
receipt_verify = aflow.tool("expense:verify_receipts")

# Both run in parallel after validation
aflow.edge(validate, policy_check)
aflow.edge(validate, receipt_verify)

# Wait for both to complete before continuing
sync_node = aflow.sync([policy_check, receipt_verify])
aflow.edge(sync_node, calculate)

# Multi-level branching
amount_branch = aflow.branch(
    evaluator="calculate.output.amount < 500"
)
amount_branch.case(True, process_reimbursement)

high_amount_branch = aflow.branch(
    evaluator="calculate.output.amount > 5000"
)
amount_branch.case(False, manager_approval)
aflow.edge(manager_approval, high_amount_branch)
high_amount_branch.case(True, finance_approval)
high_amount_branch.case(False, process_reimbursement)
```

---

## Bonus Challenge: Workflow Optimization

**Difficulty:** Expert  
**Time:** 20-25 minutes

### Objective
Optimize an existing workflow for performance and cost.

### Task

Take the loan approval workflow and:

1. **Identify optimization opportunities**:
   - Which tools can run in parallel?
   - Can any steps be skipped based on early results?
   - Are there redundant data fetches?

2. **Implement optimizations**:
   - Run credit check and income verification in parallel
   - Add early exit if credit score is too low (< 600)
   - Cache applicant data to avoid duplicate lookups

3. **Measure improvements**:
   - Compare execution time before/after
   - Measure token usage reduction
   - Calculate cost savings

### Success Criteria

- ✅ Workflow executes faster (target: 30% improvement)
- ✅ Token usage reduced (target: 40% reduction)
- ✅ Early exit logic works correctly
- ✅ Parallel execution doesn't break dependencies
- ✅ Results are identical to original workflow

---

## Tips for Success

### Using Bob for Help

Ask Bob to help you with these exercises:

```
Bob, create an MCP toolkit for order processing with validation, 
inventory check, payment, and shipping tools.
```

```
Bob, help me add error handling to my workflow. I need to catch 
errors from the credit check tool and retry once before failing.
```

```
Bob, how do I make two tools run in parallel in a workflow?
```

### Testing Your Workflows

1. **Test tools independently first**:
```bash
# Test MCP server locally
python3 your_server.py
```

2. **Import and verify**:
```bash
# Import toolkit
orchestrate toolkits import -f toolkit.yaml

# Import workflow
orchestrate tools import -k flow -f workflow.py

# Verify
orchestrate tools list | grep your-workflow
```

3. **Test via agent**:
```bash
orchestrate chat -a your_test_agent
```

### Common Issues

**Issue**: "Failed to find tool"
- **Solution**: Make sure you're using the full toolkit prefix: `toolkit-name:tool_name`

**Issue**: "Required property missing"
- **Solution**: Add `map_input()` for all required parameters

**Issue**: "Workflow import fails"
- **Solution**: Check that toolkit is imported before workflow

---

## Solution Files

Complete solution files for all exercises are available in the `solutions/` directory:

- `solutions/order_processing_workflow.py`
- `solutions/loan_workflow_with_errors.py`
- `solutions/expense_approval_workflow.py`
- `solutions/optimized_loan_workflow.py`

Try to complete the exercises on your own first, then compare with the solutions!

---

## Next Steps

Once you've completed these exercises, you're ready to:

1. ✅ Move on to [Part 7: Agent Evaluations](../part7-agent-evaluation/README.md)
2. ✅ Learn how to evaluate your workflows
3. ✅ Understand workflow performance metrics
4. ✅ Test workflow reliability and correctness

Great job! You now understand how to build deterministic, high-performance workflows! 🎉