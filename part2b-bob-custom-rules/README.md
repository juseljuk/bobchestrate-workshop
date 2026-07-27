# Part 2b: Using Custom Rules with Bob IDE

<p align="center">
  <img src="bobchestrate_part2b.png" alt="Bobchestrate - Setup" width="700">
</p>

**Duration:** 10 minutes  

**Objective:** Learn how to configure Bob IDE with custom development rules for watsonx Orchestrate projects

## What You'll Learn

- How to create custom rules for Bob IDE
- How to configure Bob to follow project-specific conventions
- How to leverage custom rules for consistent development practices
- How to use the watsonx Orchestrate development rule

## Why Custom Rules Matter

Bob IDE can be configured with custom rules that guide its behavior when working on your projects. These rules help Bob:

- Follow project-specific conventions and patterns
- Use the correct folder structure for different artifact types
- Apply best practices automatically
- Leverage the right tools and MCP servers for your technology stack

## Understanding Bob's Custom Rules

Bob IDE supports custom rules through `.md` files that define project-specific guidelines. These rules are automatically applied when Bob works in your project directory.

For more information, see the [official Bob documentation on custom rules](https://bob.ibm.com/docs/ide/configuration/rules).

### Rule File Location

Custom rules should be placed in your project's `.bob/` directory:
```
your-project/
├── .bob/
│   └── rules/
│       └── your-rule.md
├── agents/
├── tools/
└── ...
```

## Step 1: Understanding the watsonx Orchestrate Development Rule

Let's examine the watsonx Orchestrate development rule that helps Bob work effectively with ADK projects.

### Rule Structure

A good custom rule includes:

1. **Context**: When the rule applies
2. **Project Structure**: Folder conventions and organization
3. **Key Patterns**: Code patterns and decorators to use
4. **Tool Integration**: Which tools and servers to leverage

### Example: watsonx Orchestrate Development Rule

Here's a simple example for a development rule for watsonx Orchestrate projects:

```markdown
## watsonx Orchestrate Development Rule

When working with IBM watsonx Orchestrate or watsonx Orchestrate ADK projects:

1. **Project Structure and folders**: Follow ADK conventions when creating and saving artefacts:
   - tools/ for flows and Python tools
   - agents/ for YAML configurations
   - knowledge_bases/ for knowledge bases
   - models/ for LLM configurations
   - toolkits/ for MCP toolkits
   - import-all.sh for deployment
   - README.md with architecture + workflow diagrams

2. **Key Patterns**:
   - Use @flow decorator for flows
   - Use @tool decorator for Python tools
   - Include inline KVP schemas for document processing
   - Create native agents for document handling
   - Preferably use Command Line Interface to import the agents and tools

3. **MCP Server Integration**:
   - Use `watsonx-orchestrate-adk-docs` MCP server to search IBM watson Orchestrate ADK documentation
   - Leverage MCP tools for finding API references, code examples, and implementation guides
   - Query the knowledge base when uncertain about ADK features or best practices
```

## Step 2: Setting Up Custom Rules in Your Environment

### Download the Enhanced Rule File

1. **Create the rules directory structure:**
   ```bash
   mkdir -p .bob/rules
   ```

2. **Download the enhanced rule file:**
   
      Download more comprehensive <a href="https://github.com/juseljuk/bobchestrate-workshop/blob/main/part2b-bob-custom-rules/wxo-dev-rule-enhanced.md" target="_blank">wxo-dev-rule-enhanced.md</a> file from the workshop repository.

      Click the link above to view the file, then click the "Download raw file" button in GitHub to download it and save it to your local machine.

3. **Place the file in your rules directory:**
   ```bash
   # Move the downloaded file to your .bob/rules directory
   mv ~/Downloads/wxo-dev-rule-enhanced.md .bob/rules/
   ```

### What's in the Enhanced Rule File?

The enhanced rule file includes comprehensive guidance on:

- **Project Structure** - Complete directory organization
- **Development Patterns** - Error handling, logging, connections
- **Testing & QA** - Evaluation strategies and metrics
- **Security & Guardrails** - Pre/post-invoke plugins, credential management
- **Deployment & Channels** - Multi-channel deployment patterns
- **MCP Integration** - Local and remote MCP server patterns
- **Documentation Standards** - README templates, YAML documentation
- **Troubleshooting** - Common errors and debugging strategies
- **Performance Optimization** - Token usage, caching, model selection
- **Quick Reference** - All CLI commands with correct syntax

## Step 3: Verify Bob Recognizes Your Rules

Ask Bob to confirm it's using your custom rules:

```
Bob, what custom rules are you following for this watsonx Orchestrate project?
```

Bob should acknowledge the watsonx Orchestrate development rule and explain how it will apply the conventions.


## Step 4: Test the Custom Rules

Let's test that Bob follows the custom rules by asking it to create a new agent:

```
Bob, create a new agent called "test-rules-agent" that demonstrates you're following the watsonx Orchestrate development conventions.
```
>NOTE: Bob might work for a while. Be patient 😇 and let it create the agent and all the other files. Keep your eye on the chat as well, since Bob might ask you to confirm some of the actions.

**What to observe:**

- ✅ Bob should save the agent YAML in the `agents/` directory
- ✅ Bob should use proper ADK conventions in the agent specification (like the agent naming convention)
- ✅ Bob should reference the MCP server documentation when needed

## Step 5: Creating Your Own Custom Rules

You can create additional custom rules for your specific needs. Here's a template:

```markdown
## [Your Rule Name]

When working with [technology/framework]:

1. **Project Structure**:
   - [folder1]/ for [purpose]
   - [folder2]/ for [purpose]
   - [file] for [purpose]

2. **Key Patterns**:
   - Use [pattern] for [use case]
   - Follow [convention] when [scenario]
   - Prefer [approach] over [alternative]

3. **Tool Integration**:
   - Use [tool/server] for [purpose]
   - Leverage [feature] when [condition]
   - Query [resource] for [information]

4. **Best Practices**:
   - Always [practice]
   - Never [anti-pattern]
   - Consider [guideline] when [situation]
```

## Benefits of Custom Rules

### Consistency
- All team members (and Bob) follow the same conventions
- Reduces code review friction
- Maintains project structure integrity

### Efficiency
- Bob automatically applies best practices
- Less time explaining project conventions
- Faster onboarding for new developers

### Quality
- Enforces architectural patterns
- Prevents common mistakes
- Leverages project-specific tools correctly

## Common Use Cases for Custom Rules

1. **Framework-Specific Conventions**
   - React component structure
   - Django app organization
   - FastAPI project layout

2. **Company Standards**
   - Naming conventions
   - Documentation requirements
   - Testing patterns

3. **Technology Stack Integration**
   - Database access patterns
   - API design guidelines
   - Deployment procedures

4. **Domain-Specific Patterns**
   - Healthcare compliance requirements
   - Financial data handling
   - E-commerce workflows

## Tips for Writing Effective Custom Rules

### Do's ✅
- **Be specific**: "Use `@tool` decorator for Python tools" vs "Use decorators"
- **Provide context**: Explain when and why rules apply
- **Include examples**: Show concrete implementations
- **Reference tools**: Mention specific MCP servers or utilities
- **Keep it concise**: Focus on essential guidelines

### Don'ts ❌
- **Don't be vague**: Avoid "follow best practices" without specifics
- **Don't overload**: Too many rules become hard to follow
- **Don't contradict**: Ensure rules work together harmoniously
- **Don't forget updates**: Keep rules current with project evolution

## Troubleshooting

### Bob Isn't Following My Rules

**Check:**

1. Rule file is in `.bob/rules/` directory
3. Rule syntax is valid markdown
4. Bob has been restarted or refreshed

**Solution:**
```
Bob, please reload your custom rules and confirm you can see the watsonx Orchestrate development rule.
```

### Rules Conflict with Each Other

**Solution:**

- Review all rule files in `.bob/rules/`
- Consolidate overlapping rules
- Establish clear priority order
- Remove or update conflicting guidelines

### Bob Misinterprets a Rule

**Solution:**

- Make the rule more specific<
- Add examples to clarify intent
- Break complex rules into simpler steps
- Test with Bob and iterate

## Key Takeaways

✅ Custom rules guide Bob's behavior in your projects  
✅ Rules should be specific, contextual, and actionable  
✅ The `.bob/rules/` directory contains project-specific guidelines  
✅ watsonx Orchestrate projects benefit from ADK-specific rules  
✅ Good rules improve consistency, efficiency, and code quality  

## Next Steps

Now that you understand how to configure Bob with custom rules, you're ready to add more powerful capabilities to your agents!

Continue to [Part 3: Adding Custom Tools](../part3-custom-tools/README.md) →

## Additional Resources

- [Bob IDE Documentation](https://docs.bob-ide.com/custom-rules)
- [watsonx Orchestrate ADK Best Practices](https://developer.watson-orchestrate.ibm.com/getting_started/best_practices)
- [Project Structure Guidelines](https://developer.watson-orchestrate.ibm.com/getting_started/project_structure)

---

**💡 Pro Tip:** Start with a simple rule file and expand it as you discover patterns in your project. Let Bob help you refine the rules based on real usage!

---

## 🧠 Knowledge Check

Now that you understand Bob custom rules, test what you've learned!

!!! tip "Part 2b Quiz"
    Take the short 5-question quiz to check your understanding of Bob custom rules and ADK project conventions.
    Your score is saved automatically and shown on the [home page dashboard](../index.md).

    [Take the Part 2b Quiz →](quiz.md){ .md-button .md-button--primary }
