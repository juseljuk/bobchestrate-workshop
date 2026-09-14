# Real-Time Retail Inventory Optimization with Confluent Cloud and watsonx Orchestrate

## Overview

This bootcamp demonstrates how to build an intelligent, real-time retail inventory optimization system by combining **Confluent Cloud's stream processing capabilities** with **IBM watsonx Orchestrate's AI-powered decision-making**. You'll learn to detect inventory velocity spike patterns and enrich inventory alerts with AI-driven recommendations.

### What You'll Build

By the end of this bootcamp, you will have created:

- **Real-time inventory velocity detection pipeline** using Confluent Cloud and Flink SQL
- **Velocity spike detection** that identifies when products are selling much faster than expected
- **AI-powered inventory analysis** using watsonx Orchestrate agents with custom knowledge bases
- **End-to-end integration** from event detection to intelligent decision-making

### Architecture

```text
┌─────────────────────────────────────────────────────────────────────┐
│                         PART 1: Event Processing                    │
│                                                                     │
│  Inventory Events  →  Flink SQL Detection  →  Velocity Alerts       │
│  (Kafka Topic)         (Velocity Spike Logic)   (Kafka Topic)       │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      PART 2: AI-Powered Analysis                    │
│                                                                     │
│  Python Consumer  →  watsonx Agent  →  Enriched Response            │
│  (Reads Alerts)      (Inventory Analysis) (Published to Kafka)      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Learning Objectives

### Technical Skills

By completing this bootcamp, you will learn:

**Stream Processing & Event-Driven Architecture:**
- Configure Confluent Cloud environments and Kafka clusters
- Design and register JSON schemas for streaming inventory data
- Write Flink SQL queries for real-time inventory pattern detection
- Process Kafka events with Python producers and consumers
- Manage event-time processing with timestamps and watermarks

**AI Integration & Orchestration:**
- Create and configure watsonx Orchestrate agents
- Build knowledge bases for AI-powered inventory decisions
- Integrate AI agents with event-driven systems
- Validate and publish structured AI responses
- Handle authentication and API integration

**DevOps & Best Practices:**
- Use modern Python package management with uv
- Manage environment variables and secrets securely
- Implement schema validation for data quality
- Monitor and troubleshoot distributed systems

### Business Skills

**Retail Inventory Optimization Fundamentals:**
- Understand velocity spike detection patterns
- Apply thresholds for retail inventory alerts
- Interpret stockout risk signals
- Evaluate inventory alert outcomes

**AI-Augmented Decision Making:**
- Leverage AI for inventory response planning
- Provide explainable inventory decisions
- Integrate historical and operational context
- Scale inventory management workflows

---

## Prerequisites

Before starting this bootcamp, ensure you have:

### Required Accounts
- **Confluent Cloud account** - [Sign up for free trial](https://www.confluent.io/confluent-cloud/tryfree/)
- **watsonx Orchestrate instance** - [Reserve via TechZone](#reserving-watsonx-orchestrate-on-techzone)

### Technical Requirements
- **uv package manager** - [Installation instructions](#installing-uv)
  - *Modern Python package manager for dependency management*
- **IBM BOB** - Required for Part 2 agent creation
  - *AI coding assistant for automating watsonx Orchestrate agent setup*
- **Git** - For cloning the repository
  - *To download the bootcamp code and resources*
- **VS Code** or another code editor - Optional but recommended
  - *For viewing and editing configuration files*

### Knowledge Prerequisites
- Basic understanding of SQL (SELECT, WHERE, CASE clauses)
  - *Required for writing and understanding Flink SQL queries*
- Familiarity with JSON data structures
  - *For working with schemas and message formats*
- Basic Python knowledge (helpful but not required)
  - *For understanding the consumer/producer applications*
- Understanding of REST APIs (helpful for Part 2)
  - *For integrating with watsonx Orchestrate*

---

## Reserving watsonx Orchestrate on TechZone

To complete Part 2 of this bootcamp, you'll need access to a watsonx Orchestrate instance. Follow these steps to reserve one via IBM TechZone:

1. **Go to TechZone:** Visit [watsonx Orchestrate Essentials](https://techzone.ibm.com/my/reservations/create/6931cf6125f231c47e59cb7f)

2. **Request an environment:**
   - Click on **"Request an environment"**

3. **Fill in the reservation details:**
   - **Purpose:** Select **"Education"**
   - **Purpose description:** Enter `for retail inventory optimization bootcamp`
   - **Preferred region:** Choose your preferred region

4. **Accept terms and submit:**
   - Check **"I agree to IBM Technology Zone's Terms & Conditions"**
   - Click **"Submit"**

5. **Wait for provisioning:**
   - Your reservation will be processed
   - You'll receive an email with access details once ready

> [!NOTE]
> Make sure to reserve your watsonx Orchestrate instance before starting Part 2 of the bootcamp.

---

## Installing uv

### macOS/Linux

Use curl to download and execute the installation script:
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

If your system doesn't have curl, use wget:
```bash
wget -qO- https://astral.sh/uv/install.sh | sh
```

### Windows

Use PowerShell to download and execute the installation script:
```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

> [!NOTE]
> Changing the execution policy allows running a script from the internet.

For more installation options, see the [official uv documentation](https://docs.astral.sh/uv/getting-started/installation/).

---

## Getting Started

### Clone the Repository

```bash
git clone https://github.ibm.com/AmericasTopTeam/wxo-confluent-americas.git
cd wxo-confluent-americas
```

### Open the Folder in IBM BOB (Optional)

If you plan to complete Part 2 using IBM BOB, open the cloned repository folder in IBM BOB.

### Install Dependencies

```bash
cd retail-inventory-optimization
uv sync --locked
```

This will:
- Create a virtual environment
- Install all required dependencies from `pyproject.toml`
- Use the locked versions from `uv.lock` for reproducibility

---

## Bootcamp Structure

This bootcamp is divided into two main parts, each containing hands-on labs:

### Part 1: Confluent Cloud Event Processing

Build a real-time retail inventory detection pipeline using Confluent Cloud and Flink SQL.

#### [Lab 1: Confluent Cloud Setup](labs/part1-confluent-cep/lab1-confluent-setup/README.md)

Set up your Confluent Cloud environment and deploy a Flink SQL inventory velocity detection query.

**What you'll learn:**
- Create Confluent Cloud environments and Kafka clusters
- Design and register JSON schemas
- Set up Flink compute pools
- Write Flink SQL for inventory velocity detection
- Generate API keys for secure access

**What you'll build:**
- Input topic: `fashion.inventory.events`
- Output topic: `fashion.velocity.anomalies`
- Agent response topic: `fashion.agent.responses`
- Flink SQL query detecting velocity spike patterns
- Schema Registry with validated data contracts

#### [Lab 2: Testing Inventory Velocity Scenarios](labs/part1-confluent-cep/lab2-testing-inventory-scenarios/README.md)

Test your inventory velocity detection pipeline with realistic inventory event data.

**What you'll learn:**
- Configure Python applications with Confluent Cloud
- Send test inventory events with proper timestamps
- Consume and interpret velocity alerts
- Analyze detection accuracy

**What you'll build:**
- Python producer sending test inventory events
- Python consumer displaying velocity alerts
- Verification of inventory detection logic
- Understanding of system behavior

---

### Part 2: watsonx Orchestrate AI Integration

Enhance inventory alerts with AI-powered recommendations using watsonx Orchestrate.

#### [Lab: watsonx Orchestrate Agent Integration](labs/part2-watsonx-orchestrate/README.md)

Integrate an AI agent that analyzes inventory alerts and provides intelligent recommendations.

**What you'll learn:**
- Create and configure watsonx Orchestrate agents
- Build inventory decision knowledge bases
- Extract and configure integration credentials
- Validate AI responses against schemas
- Publish enriched responses to Kafka

**What you'll build:**
- Inventory alert analysis agent
- Inventory knowledge base with decision rules
- Python consumer with agent integration
- Agent response topic: `fashion.agent.responses`
- End-to-end AI-augmented inventory workflow

---

## Project Structure

```text
Retail-Inventory-Optimization/
├── fashion-inventory-consumer/          # Python applications
│   ├── .env.example
│   ├── consume_velocity_alerts.py
│   ├── consume_velocity_alerts_with_agent.py
│   ├── produce_inventory_events.py
│   ├── orchestrate_client.py
│   ├── agent_payload_builder.py
│   ├── agent_response_producer.py
│   └── response_validator.py
│
├── fashion-inventory-setup/             # Confluent setup assets
│   ├── COMPLETE_SETUP_GUIDE.md
│   ├── data/
│   │   └── test_winter_jacket_spike.csv
│   ├── schemas/
│   │   ├── fashion-inventory-event.schema.json
│   │   ├── velocity-anomaly-alert.schema.json
│   │   └── agent-response.schema.json
│   └── sql/
│       └── velocity_anomaly_detection.sql
│
└── labs/
    └── fashion-labs/
        ├── README.md
        ├── part1-confluent-cep/
        │   ├── README.md
        │   ├── lab1.1-kafka-basics/
        │   └── lab1.2-schema-registry/
        └── part2-watsonx-orchestrate/
```

---

## Key Concepts

### Inventory Velocity Detection

The retail inventory system identifies when a product is selling much faster than expected.

A complete real-time inventory velocity detection system:
- Ingests inventory events from POS systems, warehouses, and e-commerce
- Calculates rolling baseline velocity per SKU
- Detects velocity spikes (3x baseline threshold)
- Calculates hours to stockout
- Generates severity-based alerts
- Routes alerts for automated action

**Business Scenario:**

**Retailer:** Fashion & Apparel Chain
**Challenge:** Winter jacket selling 12.5x faster than normal
**Risk:** Stockout in 3 hours, lost sales opportunity

**Example Detection Flow:**
1. **Event:** POS records 25 jacket sales in 1 hour
2. **Baseline:** Historical average is 2 sales/hour
3. **Ratio:** 25 ÷ 2 = 12.5x (exceeds 3x threshold)
4. **Stock:** 75 units remaining
5. **Prediction:** 75 ÷ 25 = 3 hours to stockout
6. **Alert:** CRITICAL severity, reorder action needed
7. **Response:** Automated reorder or agent-assisted follow-up

### AI-Powered Inventory Analysis

The watsonx Orchestrate agent enhances inventory alerts with:

- **Urgency Assessment:** Criticality and recommended action
- **Contextual Analysis:** Product and inventory history
- **Recommended Actions:** reorder, reprioritize, notify teams
- **Explainable Decisions:** Reasoning for each response
- **Structured Output:** Schema-validated JSON responses

---

## Support & Resources

### Documentation
- [Confluent Cloud Documentation](https://docs.confluent.io/cloud/current/overview.html)
- [Flink SQL Reference](https://docs.confluent.io/cloud/current/flink/reference/overview.html)
- [watsonx Orchestrate Documentation](https://www.ibm.com/docs/en/watsonx/watson-orchestrate)
- [uv Documentation](https://docs.astral.sh/uv/)

### Troubleshooting
- Check lab-specific guidance
- Review error messages carefully
- Verify environment variables and credentials
- Ensure all prerequisites are met

---
**Ready to get started?** → [Start with Lab 1: Confluent Cloud Setup](labs/part1-confluent-cep/lab1-confluent-setup/README.md)

---
