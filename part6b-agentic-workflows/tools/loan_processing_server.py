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

# Made with Bob
