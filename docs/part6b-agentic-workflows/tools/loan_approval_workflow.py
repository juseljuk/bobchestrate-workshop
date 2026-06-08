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

# Made with Bob
