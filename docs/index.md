# Bobchestrate Workshop - Building AI Agents with watsonx Orchestrate and IBM Bob

![Workshop Logo](Bobchestrate_Workshop_logo_new.png)

## A Hands-On Workshop for Agentic AI Development

Welcome! This workshop will guide you through building AI agents using IBM watsonx Orchestrate. You'll use IBM Bob, an AI coding assistant, to help you along the way.

## Workshop Overview

**Duration:** 270-300 minutes (4.5-5 hours) for complete workshop

This estimate includes:

- Core instruction time: 220 minutes
- Setup and troubleshooting: 20-30 minutes
- Short breaks: 15-20 minutes
- Q&A and discussion: 15-30 minutes

**Alternative Options:**

- **Core Workshop** (Parts 1-8): 240-270 minutes (4-4.5 hours)
- **Advanced Exercise Only** (Part 1 + Part 9): 60-75 minutes (1-1.25 hours) - setup + multi-agent orchestration as standalone exercise

**Level:** Beginner to Intermediate (Advanced for Part 9)

**Prerequisites:**

- Computer with internet access, Windows, macOS, or Linux operating system, at least 8GB RAM and 500 MB of free disk space
- Basic Python knowledge and Python 3.11-3.13 installed ([https://www.python.org/downloads/](https://www.python.org/downloads/))
- uv installed ([https://pypi.org/project/uv/](https://pypi.org/project/uv/))
- watsonx Orchestrate SaaS access (provided by your instructor or you can use your own)
- IBM Bob IDE installed (trial or one provided by your instructor)

## Workshop Structure

Each part builds on the last, taking you from a working environment to a fully deployed, evaluated, multi-agent system.

| Part | Topic | Time |
|------|-------|------|
| [1 — Setup & Environment](part1-setup/README.md) | Configure watsonx Orchestrate and verify Bob is your AI pair programmer | 15 min |
| [2 — Your First Agent](part2-first-agent/README.md) | Build and chat with a "Hello World" agent | 20 min |
| [2b — Bob Custom Rules](part2b-bob-custom-rules/README.md) | Teach Bob your project conventions for consistent code generation | 10 min |
| [3 — Custom Tools](part3-custom-tools/README.md) | Write Python tools for order status and refunds; wire them into your agent | 30 min |
| [3b — AI Gateway & Models](part3b-ai-gateway-models/README.md) | Swap LLM providers, compare costs, and build intelligent model routing | 25 min |
| [4 — Knowledge Bases & Collaborators](part4-knowledge/README.md) | Add an FAQ knowledge base and a specialist escalation agent | 25 min |
| [5 — Guidelines & Guardrails](part5-guidelines-guardrails/README.md) | Add rule-based behaviour controls and content safety plugins | 20 min |
| [6 — MCP Servers](part6-mcp-servers/README.md) | Build a reusable MCP server and connect it as a product-catalog agent | 25 min |
| [6b — Agentic Workflows](part6b-agentic-workflows/README.md) | Replace LLM-driven steps with deterministic flows — 60% faster, 80% cheaper | 25 min |
| [7 — Evaluations & Red-Teaming](part7-agent-evaluation/README.md) | Measure quality with automated evals; probe for vulnerabilities with red-teaming | 30 min |
| [8 — Testing & Deployment](part8-deployment/README.md) | Unit-test tools, deploy to live, generate a webchat embed snippet | 20 min |
| [9 — Multi-Agent Orchestration](part9-multi-agent-orchestration/README.md) ⭐ | Build a travel concierge with four specialist agents and an orchestrator | 30 min |

> ⭐ Part 9 can also be run as a **standalone advanced exercise** (Part 1 + Part 9, ~75 min).

## How Bob Helps You

Throughout this workshop, you'll use Bob to:

- **Generate code**: "Bob, create a Python tool that checks order status"
- **Debug issues**: "Bob, why is my agent not calling the refund tool?"
- **Explain concepts**: "Bob, explain how agent instructions work"
- **Refactor code**: "Bob, improve the error handling in my tool"
- **Create tests**: "Bob, write tests for my order status tool"

## Learning Objectives

By the end of this workshop, you will:

- ✅ Understand watsonx Orchestrate agent architecture
- ✅ Create and configure agents using YAML specifications
- ✅ Build custom Python tools for specific business logic
- ✅ Integrate knowledge bases for FAQ handling
- ✅ Use agent collaborators for complex workflows
- ✅ Configure and use different AI models through the AI Gateway
- ✅ Implement safety guidelines and guardrails
- ✅ Create and use MCP servers for backend integration
- ✅ Design and orchestrate multi-agent systems
- ✅ Build responsible AI agents
- ✅ Leverage Bob as an AI pair programmer
- ✅ Test and deploy agents to production

## 🧠 Test Your Knowledge Along the Way

Every part of this workshop comes with a short **5-question quiz** to help you lock in what you've just learned. Quizzes are built right into the workshop pages — just scroll to the bottom of any part and hit the quiz link.

You need **4 out of 5** to pass, and your results are saved automatically in your browser so you can pick up where you left off. Want to see how you're doing across all parts at a glance? Check your personal progress dashboard — it's always one click away in the top navigation menu.

[View your Quiz Progress →](quiz-progress/index.md){ .md-button .md-button--primary }

## Tips for Success

1. **Ask Bob for help**: Don't hesitate to ask Bob questions throughout the workshop
2. **Experiment**: Try modifying the examples to see what happens
3. **Read error messages**: They often tell you exactly what's wrong
4. **Test incrementally**: Build and test one feature at a time
5. **Use the documentation**: Bob can search the watsonx Orchestrate docs for you

## Additional Resources

- [Bob Helpful Prompts](bob-prompts/helpful-prompts.md)
- [watsonx Orchestrate Documentation](https://developer.watson-orchestrate.ibm.com/)
- [Python Tools Guide](https://developer.watson-orchestrate.ibm.com/tools/create_tool)
- [Agent Builder API Reference](https://developer.watson-orchestrate.ibm.com/apis/agents/)
- [Community Forum](https://community.ibm.com/community/user/groups/community-home?CommunityKey=3ad46381-9535-462e-85c9-568b21f4b067)

## Need Help?

- Ask Bob: "Bob, I'm stuck on [specific issue]"
- Review the bob-prompts guide for helpful prompts
- Consult the watsonx Orchestrate documentation

## Reporting issues and asking for enhancements

If you have any issues or suggestions for improvement, please open an issue in the [Bobchestrate repository](https://github.com/juseljuk/bobchestrate-workshop/issues) - you'll need a GitHub account to do this. Cheers 🍻

## Getting Started

Let's get started! 🚀  Head to [Part 1: Setup](part1-setup/README.md) →