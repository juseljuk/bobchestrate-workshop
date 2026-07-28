# Part 3b: AI Gateway and External Model Providers

<p align="center">
  <img src="bobchestrate_part3b.png" alt="Bobchestrate - AI Gateway" width="700">
</p>

**Duration:** 25 minutes

**Objective:** Learn how to configure external AI models through watsonx Orchestrate's AI Gateway and implement model policies

> 📋 **Quick Reference:** Check out the [Model Selection Guide](model-selection-guide.md) for a quick reference on AI Gateway capabilities!

## What You'll Learn

- Understanding the AI Gateway architecture
- How to connect external LLM providers
- Configuring model policies for governance
- Managing model access and usage
- Testing agents with external models
- Best practices for model management

## Why AI Gateway Matters

The AI Gateway in watsonx Orchestrate provides:

- 🔌 **Unified Interface** - Access multiple LLM providers through a single API
- 🌐 **External Provider Support** - Connect to OpenAI, Anthropic, Google, AWS Bedrock, Azure, and more
- 🔄 **Model Flexibility** - Switch between models without changing agent code
- 🛡️ **Governance & Policies** - Centralized control over model access, usage limits, and compliance
- 💰 **Cost Management** - Track and control model usage and costs
- 📊 **Monitoring** - Comprehensive visibility into model performance and usage patterns

## Available Model Options

watsonx Orchestrate supports models through two main approaches.

### Default Platform Models

The platform includes a default model that is optimized and validated:

- **groq/openai/gpt-oss-120b** ⭐ - High-performance model optimized for speed, tool calling, and multilingual support
  - Available from Groq (ultra-fast inference)
  - Also available from AWS Bedrock (enterprise-grade reliability)

### External Models via AI Gateway

You can connect to external model providers through the AI Gateway:

| Provider | Example Models | Use Cases |
|----------|---------------|-----------|
| **OpenAI** | GPT-4, GPT-4-turbo, GPT-3.5-turbo | General purpose, advanced reasoning |
| **Anthropic** | Claude 3 Opus, Sonnet, Haiku | Long context, analysis, coding |
| **Google** | Gemini Pro, Gemini Flash | Multimodal, fast inference |
| **AWS Bedrock** | Various foundation models | Enterprise deployment, compliance |
| **Azure OpenAI** | Azure-hosted OpenAI models | Microsoft ecosystem integration |
| **Ollama** | Locally hosted models | On-premises, data privacy |

> **Note:** External models require proper configuration through the AI Gateway and may incur additional costs from the provider.

## Step 1: Understanding AI Gateway Architecture

The AI Gateway acts as a unified interface between your agents and various LLM providers:

```
┌────────────────────────────────────────────────────┐
│             watsonx Orchestrate                    │
│                                                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ Agent A  │  │ Agent B  │  │ Agent C  │          │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘          │
│       │             │             │                │
│       └─────────────┴─────────────┘                │
│                     │                              │
│              ┌──────▼──────┐                       │
│              │ AI Gateway  │                       │
│              │  + Policies │                       │
│              └──────┬──────┘                       │
│                     │                              │
└─────────────────────┼──────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
   ┌────▼────┐   ┌───▼─────┐   ┌───▼────┐
   │ OpenAI  │   │Anthropic│   │ Google │
   └─────────┘   └─────────┘   └────────┘
```

### Key Capabilities

1. **Provider Abstraction** - Agents don't need to know which provider they're using
2. **Policy Enforcement** - Centralized governance and compliance
3. **Usage Tracking** - Monitor costs and performance across all models
4. **Failover Support** - Automatic fallback to alternative providers
5. **Rate Limiting** - Control usage to manage costs

## Step 2: Configuring External Model Providers

### How to Connect to an External Model

To connect an external model provider to watsonx Orchestrate, you need to follow these key steps:

#### 1. Create a Connection Definition

First, establish a connection to your external provider by configuring the necessary credentials and endpoint information. This typically involves:

- **Provider credentials** - Normally an API key
- **Endpoint configuration** - Base URL and region settings for the provider - needed for custom providers
- **Authentication method** - How the gateway will authenticate with the provider - if something else than API key

>**NOTE**: If you want to test this with OpenAI for example, you can get your api key from here: https://platform.openai.com/api-keys, you need to login / create your developer account first though. You can see the available OpenAI models here: https://developers.openai.com/api/docs/models/all

Example API Key connection configuration:
```bash
orchestrate connections add -a openai
orchestrate connections configure -a openai --env draft -k key_value -t team
orchestrate connections set-credentials -a openai --env draft -e "api_key=<your_openai_api_key>"
```
>**NOTE**: The `--env draft` flag indicates that the configuration is for draft environment. If you want to use it with agents deployed also to production, you need to create the connection with `--env live` as well.

> **Security Note:** Always use environment variables or secure credential management systems for API keys. Never commit credentials to version control.

#### 2. Add the Model Definition

Once the connection is established, you can add specific models using either of two methods:

**Method A: Using a YAML File (Recommended for complex configurations)**

Create a model definition file:
```yaml
# gpt-5.yaml
spec_version: v1
kind: model
name: openai/gpt-5-2025-08-07
display_name: GPT 5
description: |-
    GPT-5 is our flagship model for coding, reasoning, and agentic tasks across domains. Learn more in our GPT-5 usage guide.
tags:
- openai
- gpt
model_type: chat
```

Import the model:
```bash
orchestrate models import -f gpt-5.yaml -a openai
```

**Method B: Using CLI Commands (Quick setup)**

Add a model directly via command line:
```bash
orchestrate models add \
  --name openai/gpt-5-2025-08-07 \
  --description "OpenAI GPT-5 for advanced reasoning" \
  --display-name "GPT 5" \
  --app-id openai \
  --type chat
```

#### 3. Verify the Model

After adding the model, verify it's available:
```bash
# List all available models
orchestrate models list
```

#### 4. Use in Your Agents

Reference the model in your agent configuration:
```yaml
spec_version: v1
kind: native
name: my_agent
style: default
hide_reasoning: true
description: Agent using external model

llm: virtual-model/openai/gpt-5-2025-08-07   # Reference your external model as it shows when listing models from your orchestrate instance

instructions: |
  Your agent instructions here...
```

## Step 3: Implementing Model Policies

Model policies allow you to coordinate multiple models for load balancing, fallback, and retry strategies.

### Policy Strategy Types

1. **Load Balancing** - Distribute requests across multiple model instances
2. **Fallback** - Automatically switch to backup models on errors
3. **Single with Retry** - Retry failed requests on the same model

### Creating Model Policies

#### Load Balancing Policy

Distributes traffic across multiple models based on weight:

```yaml
# load-balance-policy.yaml
spec_version: v1
kind: model
name: balanced_gpt
description: Load balances between Groq and AWS Bedrock
display_name: Balanced GPT

policy:
  strategy:
    mode: loadbalance
    on_status_codes: [503, 504]
  retry:
    attempts: 1
  targets:
    - model_name: groq/openai/gpt-oss-120b
      weight: 0.75   # 75% of traffic
    - model_name: bedrock/openai.gpt-oss-120b-1:0
      weight: 0.25   # 25% of traffic
```

#### Fallback Policy

Automatically switches to backup model on errors:

```yaml
# fallback-policy.yaml
spec_version: v1
kind: model
name: resilient_gpt
description: Falls back to AWS Bedrock if Groq fails
display_name: Resilient GPT

policy:
  strategy:
    mode: fallback
  retry:
    attempts: 1
    on_status_codes: [503, 500]
  targets:
    - model_name: groq/openai/gpt-oss-120b
    - model_name: bedrock/openai.gpt-oss-120b-1:0
```

#### Single Model with Retry

Retries on the same model for transient errors:

```yaml
# retry-policy.yaml
spec_version: v1
kind: model
name: retry_gpt
description: Retries up to 3 times on transient errors
display_name: Retry GPT

policy:
  strategy:
    mode: single
  retry:
    attempts: 3
    on_status_codes: [503]
  targets:
    - model_name: groq/openai/gpt-oss-120b
```

### Managing Model Policies

```bash
# Add a policy via CLI
orchestrate models policy add \
  --name resilient_gpt \
  --model groq/openai/gpt-oss-120b \
  --model bedrock/openai.gpt-oss-120b-1:0 \
  --strategy fallback \
  --strategy-on-code 503 \
  --retry-attempts 2

# Import from YAML file
orchestrate models policy import --file fallback-policy.yaml

# Export a policy
orchestrate models policy export -n resilient_gpt -o policy.zip

# Remove a policy
orchestrate models policy remove -n resilient_gpt
```

### Applying Policies to Agents

Once created, reference the policy name in your agent's `llm` field:

```yaml
# agent-with-policy.yaml
spec_version: v1
kind: native
name: resilient_support_agent
style: default
hide_reasoning: true
description: Support agent with automatic fallback

instructions: |
  You are a customer support agent providing helpful, efficient responses.

# Reference the policy name (not a direct model)
llm: resilient_gpt

tools:
  - check_order_status
  - process_refund
```

## Create with Bob

Test createting some of the model related configurations with Bob.

1. Create a script to adds new connection definition to be used to import an external model from OpenAI

```
Bob, create a shell script that adds a new connection definition for importing OpenAI LLM model with an API key to both draft and live enviroment. Connection app-id should be "openai". The script should be named "add_openai_connection.sh" and should be executable.
```

> NOTE: When asking Bob to create something, it's best practice to be as specific as possible about what you want created. This helps Bob generate the most accurate and useful output.

2. Create a script to import an external model from OpenAI

```
Bob, create a shell script that imports an external model "openai/gpt-5-2025-08-07" from OpenAI using the connection definition "openai" to both draft and live enviroment. The script should be named "import_openai_model.sh" and should be executable.
```

## Best Practices

### ✅ DO:

- **Start with default models** - Use groq/openai/gpt-oss-120b for most use cases
- **Implement policies early** - Set up governance before scaling
- **Monitor usage closely** - Track costs and performance regularly
- **Use environment variables** - Never hardcode API keys
- **Test external models** - Validate behavior before production use
- **Document model choices** - Record why specific models were selected
- **Set up alerts** - Get notified of issues before they become problems
- **Review policies regularly** - Adjust as usage patterns change

### ❌ DON'T:

- **Expose API keys** - Always use secure credential management
- **Skip policy configuration** - Governance is critical for production
- **Ignore cost monitoring** - External models can be expensive
- **Use untested models** - Always validate before production deployment
- **Forget about compliance** - Consider data residency and privacy requirements
- **Overlook rate limits** - Plan for provider limitations
- **Mix environments** - Keep development and production configurations separate

## Key Takeaways

✅ AI Gateway provides unified access to multiple model providers  
✅ Model policies enable governance and cost control  
✅ External models offer flexibility but require careful management  
✅ Start with default models and add external providers as needed  
✅ Security and compliance must be built in from the start  

## Next Steps

Now that you understand AI Gateway and model policies, let's add knowledge bases and collaborators!

Continue to [Part 4: Knowledge Bases & Collaborators](../part4-knowledge/README.md) →

## Additional Resources

- [watsonx Orchestrate AI Gateway Documentation](https://developer.watson-orchestrate.ibm.com/llm/managing_llm)
- [Model Policies Guide](https://developer.watson-orchestrate.ibm.com/llm/model_policies)
- [External Provider Configuration](https://developer.watson-orchestrate.ibm.com/llm/managing_llm#supported-providers)
- [LLM Monitoring and Observability](https://developer.watson-orchestrate.ibm.com/llm/observability)

---

**💡 Pro Tip:** Start with the default groq/openai/gpt-oss-120b model and only add external providers when you have specific requirements that the default model cannot meet!

---

## 🧠 Knowledge Check

Now that you understand the AI Gateway and model policies, test what you've learned!

!!! tip "Part 3b Quiz"
    Take the short 5-question quiz to check your understanding of AI Gateway and external model providers.
    Your score is saved automatically and shown on the [home page dashboard](../index.md).

    [Take the Part 3b Quiz →](quiz.md){ .md-button .md-button--primary }