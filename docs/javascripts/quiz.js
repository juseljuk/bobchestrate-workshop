/* ============================================================
   Bobchestrate Workshop — Quiz Engine
   Namespace: window.WXOQuiz
   Storage key: wxo_quiz_results  (localStorage)
   ============================================================ */

(function () {
  'use strict';

  /* ── Storage helpers ──────────────────────────────────── */
  var STORAGE_KEY = 'wxo_quiz_results';

  function loadResults() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch (e) {
      return {};
    }
  }

  function saveResult(id, score, total) {
    var results = loadResults();
    var passed = score >= Math.ceil(total * 0.8);
    // Keep best score
    if (!results[id] || score > results[id].score) {
      results[id] = {
        score: score,
        total: total,
        passed: passed,
        completedAt: new Date().toISOString()
      };
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
  }

  function clearResults() {
    localStorage.removeItem(STORAGE_KEY);
    // Re-render any dashboard present on the page
    var dash = document.getElementById('quiz-dashboard');
    if (dash) renderDashboard('quiz-dashboard');
  }

  /* ── Quiz registry (all modules) ─────────────────────── */
  // id must match the folder-name convention used in quiz.md pages
  var QUIZ_REGISTRY = [
    { id: 'part1-setup',                   label: 'Part 1 — Setup & Environment' },
    { id: 'part2-first-agent',             label: 'Part 2 — First Agent' },
    { id: 'part2b-bob-custom-rules',       label: 'Part 2b — Bob Custom Rules' },
    { id: 'part3-custom-tools',            label: 'Part 3 — Custom Tools' },
    { id: 'part3b-ai-gateway-models',      label: 'Part 3b — AI Gateway Models' },
    { id: 'part4-knowledge',               label: 'Part 4 — Knowledge Bases' },
    { id: 'part5-guidelines-guardrails',   label: 'Part 5 — Guidelines & Guardrails' },
    { id: 'part6-mcp-servers',             label: 'Part 6 — MCP Servers' },
    { id: 'part6b-agentic-workflows',      label: 'Part 6b — Agentic Workflows' },
    { id: 'part7-agent-evaluation',        label: 'Part 7 — Agent Evaluations' },
    { id: 'part8-deployment',              label: 'Part 8 — Deployment' },
    { id: 'part9-multi-agent',             label: 'Part 9 — Multi-Agent Orchestration' }
  ];

  // IDs that have a quiz.md page ready
  var AVAILABLE_QUIZZES = ['part1-setup', 'part2-first-agent', 'part2b-bob-custom-rules', 'part3-custom-tools', 'part3b-ai-gateway-models', 'part4-knowledge', 'part5-guidelines-guardrails', 'part6-mcp-servers', 'part6b-agentic-workflows'];

  /* ── Shuffle utility ──────────────────────────────────── */
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  /* ── Quiz init ────────────────────────────────────────── */
  /*
    config = {
      id: string,           // e.g. 'part1-setup'
      containerId: string,  // id of the div to render into
      questions: [
        { text: string, options: string[], correctIndex: number, hint: string }
      ]
    }
  */
  function init(config) {
    var container = document.getElementById(config.containerId);
    if (!container) return;

    var questions = config.questions.map(function (q) {
      // Build shuffled option list, track where correct answer ended up
      var indexed = q.options.map(function (opt, i) {
        return { text: opt, isCorrect: i === q.correctIndex };
      });
      var shuffled = shuffle(indexed);
      return {
        text: q.text,
        hint: q.hint || '',
        options: shuffled,
        correctIdx: shuffled.findIndex(function (o) { return o.isCorrect; })
      };
    });

    var state = {
      current: 0,
      answers: new Array(questions.length).fill(null), // selected option index or null
      revealed: new Array(questions.length).fill(false),
      submitted: false
    };

    function render() {
      container.innerHTML = buildHTML();
      attachEvents();
    }

    function buildHTML() {
      var q = questions[state.current];
      var answered = state.answers[state.current] !== null;
      var revealed = state.revealed[state.current];
      var progressPct = Math.round((state.current / questions.length) * 100);

      var optionsHTML = q.options.map(function (opt, i) {
        var cls = 'quiz-option';
        var marker = String.fromCharCode(65 + i); // A, B, C, D
        if (revealed) {
          cls += ' disabled';
          if (i === q.correctIdx) cls += ' correct';
          else if (i === state.answers[state.current]) cls += ' incorrect';
        } else if (state.answers[state.current] === i) {
          cls += ' selected';
        }
        return '<button class="' + cls + '" data-idx="' + i + '">' +
          '<span class="quiz-option-marker">' + marker + '</span>' +
          '<span>' + escHtml(opt.text) + '</span>' +
          '</button>';
      }).join('');

      var feedbackHTML = '';
      if (revealed && q.hint) {
        var fbCls = state.answers[state.current] === q.correctIdx
          ? 'quiz-feedback correct-hint show'
          : 'quiz-feedback incorrect-hint show';
        feedbackHTML = '<div class="' + fbCls + '">' + escHtml(q.hint) + '</div>';
      }

      var scoreBannerHTML = '';
      if (state.submitted) {
        var score = state.answers.reduce(function (acc, ans, idx) {
          return acc + (ans === questions[idx].correctIdx ? 1 : 0);
        }, 0);
        var passed = score >= Math.ceil(questions.length * 0.8);
        var quizEntry = QUIZ_REGISTRY.find(function (r) { return r.id === config.id; });
        var quizLabel = quizEntry ? quizEntry.label : config.id;
        var bCls = passed ? 'quiz-score-banner pass show' : 'quiz-score-banner retry show';
        var bTitle = passed
          ? '✓ Passed — ' + score + ' / ' + questions.length + ' correct'
          : score + ' / ' + questions.length + ' correct — Try again to improve your score';
        var bBody = passed
          ? 'Great work! You\'ve completed the ' + quizLabel + ' quiz.'
          : 'Review the material and give it another go — you need 4/5 to pass.';
        scoreBannerHTML = '<div class="' + bCls + '">' +
          '<div class="quiz-score-banner-title">' + bTitle + '</div>' +
          '<div class="quiz-score-banner-body">' + bBody + '</div>' +
          '</div>';
      }

      var navDisabled = !revealed ? ' disabled' : '';
      var isLast = state.current === questions.length - 1;
      var submitDisabled = (!state.submitted && !state.answers.every(function (a, i) {
        return a !== null;
      })) ? ' disabled' : '';

      var actionBtns = '';
      if (!state.submitted) {
        if (!revealed) {
          actionBtns += '<button class="quiz-btn quiz-btn-primary" id="qz-check"' +
            (answered ? '' : ' disabled') + '>Check Answer</button>';
        } else if (!isLast) {
          actionBtns += '<button class="quiz-btn quiz-btn-primary" id="qz-next">Next Question →</button>';
        } else {
          actionBtns += '<button class="quiz-btn quiz-btn-primary" id="qz-submit">Submit Quiz</button>';
        }
        if (state.current > 0) {
          actionBtns += '<button class="quiz-btn quiz-btn-secondary" id="qz-prev">← Back</button>';
        }
      } else {
        actionBtns += '<button class="quiz-btn quiz-btn-secondary" id="qz-retry">Try Again</button>';
      }

      return '<div class="quiz-container">' +
        '<div class="quiz-header"><h3>Knowledge Check</h3>' +
        '<p>Select the best answer for each question. You need 4 out of 5 to pass.</p></div>' +
        '<div class="quiz-progress-wrap">' +
          '<div class="quiz-progress-label">' +
            '<span>Question ' + (state.current + 1) + ' of ' + questions.length + '</span>' +
            '<span>' + progressPct + '%</span>' +
          '</div>' +
          '<div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:' + progressPct + '%"></div></div>' +
        '</div>' +
        '<div class="quiz-question-card">' +
          '<div class="quiz-question-number">Q' + (state.current + 1) + '</div>' +
          '<p class="quiz-question-text">' + escHtml(q.text) + '</p>' +
          '<div class="quiz-options">' + optionsHTML + '</div>' +
          feedbackHTML +
        '</div>' +
        '<div class="quiz-actions">' + actionBtns + '</div>' +
        scoreBannerHTML +
        '</div>';
    }

    function attachEvents() {
      container.querySelectorAll('.quiz-option:not(.disabled)').forEach(function (btn) {
        btn.addEventListener('click', function () {
          state.answers[state.current] = parseInt(btn.dataset.idx, 10);
          render();
        });
      });

      var checkBtn = document.getElementById('qz-check');
      if (checkBtn) checkBtn.addEventListener('click', function () {
        state.revealed[state.current] = true;
        render();
      });

      var nextBtn = document.getElementById('qz-next');
      if (nextBtn) nextBtn.addEventListener('click', function () {
        state.current++;
        render();
      });

      var prevBtn = document.getElementById('qz-prev');
      if (prevBtn) prevBtn.addEventListener('click', function () {
        state.current--;
        render();
      });

      var submitBtn = document.getElementById('qz-submit');
      if (submitBtn) submitBtn.addEventListener('click', function () {
        state.submitted = true;
        var score = state.answers.reduce(function (acc, ans, idx) {
          return acc + (ans === questions[idx].correctIdx ? 1 : 0);
        }, 0);
        saveResult(config.id, score, questions.length);
        render();
      });

      var retryBtn = document.getElementById('qz-retry');
      if (retryBtn) retryBtn.addEventListener('click', function () {
        // Re-shuffle options on retry
        init(config);
      });
    }

    render();
  }

  /* ── Dashboard renderer ───────────────────────────────── */
  function renderDashboard(elementId) {
    var el = document.getElementById(elementId);
    if (!el) return;

    var results = loadResults();

    var cardsHTML = QUIZ_REGISTRY.map(function (quiz) {
      var result = results[quiz.id];
      var available = AVAILABLE_QUIZZES.indexOf(quiz.id) !== -1;
      var scoreHTML, badgeHTML, dateHTML;

      if (result) {
        scoreHTML = '<div class="quiz-card-score">' + result.score + ' / ' + result.total + '</div>';
        badgeHTML = result.passed
          ? '<span class="quiz-badge quiz-badge-pass">Passed</span>'
          : '<span class="quiz-badge quiz-badge-retry">Try again</span>';
        dateHTML = '<div class="quiz-card-date">' + formatDate(result.completedAt) + '</div>';
      } else if (available) {
        scoreHTML = '<div class="quiz-card-score" style="color:var(--quiz-text-muted)">—</div>';
        badgeHTML = '<span class="quiz-badge quiz-badge-pending">Not attempted</span>';
        dateHTML = '';
      } else {
        scoreHTML = '';
        badgeHTML = '<span class="quiz-badge quiz-badge-soon">Coming soon</span>';
        dateHTML = '';
      }

      return '<div class="quiz-card">' +
        '<div class="quiz-card-title">' + escHtml(quiz.label) + '</div>' +
        scoreHTML + dateHTML + badgeHTML +
        '</div>';
    }).join('');

    var attempted = Object.keys(results).length;
    var passed = Object.values(results).filter(function (r) { return r.passed; }).length;

    el.innerHTML = '<div class="quiz-dashboard">' +
      '<div class="quiz-dashboard-grid">' + cardsHTML + '</div>' +
      '<div class="quiz-dashboard-actions">' +
        '<button class="quiz-clear-btn" id="qz-clear-all">Clear All Quiz History</button>' +
        '<span class="quiz-dashboard-note">' + passed + ' passed · ' + attempted + ' attempted · ' + QUIZ_REGISTRY.length + ' total</span>' +
      '</div>' +
      '</div>';

    var clearBtn = document.getElementById('qz-clear-all');
    if (clearBtn) clearBtn.addEventListener('click', function () {
      if (confirm('Clear all quiz history? This cannot be undone.')) {
        clearResults();
      }
    });
  }

  /* ── Utilities ────────────────────────────────────────── */
  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatDate(iso) {
    try {
      var d = new Date(iso);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return iso;
    }
  }

  /* ── Expose public API ────────────────────────────────── */
  window.WXOQuiz = {
    init: init,
    renderDashboard: renderDashboard,
    clearResults: clearResults,
    getResults: loadResults
  };

  /* ── Quiz data registry ───────────────────────────────── */
  var QUIZ_DATA = {
    'quiz-part6b': {
      id: 'part6b-agentic-workflows',
      questions: [
        {
          text: 'What is the fundamental difference between an agentic workflow and a regular agent in watsonx Orchestrate?',
          options: [
            'Agentic workflows use a different LLM model than regular agents',
            'Agentic workflows are deterministic predefined sequences of tool executions with no LLM reasoning between steps; agents use LLM reasoning to decide each step dynamically',
            'Agentic workflows can only run locally; regular agents run in the cloud',
            'Agentic workflows require more tokens and cost more than regular agents'
          ],
          correctIndex: 1,
          hint: 'Workflows are deterministic pipelines — same input always produces the same execution path, with no LLM calls between steps. This makes them ~60% faster and ~80% cheaper than agent-based approaches for fixed processes.'
        },
        {
          text: 'Which Python import is required for the `@flow` decorator used to define an agentic workflow?',
          options: [
            'from ibm_watsonx_orchestrate.agent_builder.tools import flow',
            'from ibm_watsonx_orchestrate.flow_builder.flows import flow',
            'from ibm_watsonx_orchestrate.workflows import flow',
            'from ibm_watsonx_orchestrate.tools import flow, Flow'
          ],
          correctIndex: 1,
          hint: 'The correct import is `from ibm_watsonx_orchestrate.flow_builder.flows import Flow, flow, START, END, Branch`. Using the wrong module (e.g. `agent_builder.tools`) will cause an import error.'
        },
        {
          text: 'In an agentic workflow, how do you pass data from the workflow input to a tool node?',
          options: [
            'The workflow input is automatically passed to all tool nodes as keyword arguments',
            'Use `aflow.connect(source="flow.input.param", target="tool_node.param")`',
            'Use `tool_node.map_input(input_variable="param", expression="flow.input.param")`',
            'Set the input in Pydantic schema defaults and the flow engine infers the mapping'
          ],
          correctIndex: 2,
          hint: '`node.map_input(input_variable="param_name", expression="flow.input.param_name")` is required to pass data into each tool node. Without it, the tool receives empty parameters and will fail with a "required property" error.'
        },
        {
          text: 'Which CLI command is used to import an agentic workflow Python file into watsonx Orchestrate?',
          options: [
            'orchestrate agents import -f tools/my_workflow.py',
            'orchestrate workflows import -f tools/my_workflow.py',
            'orchestrate tools import -k flow -f tools/my_workflow.py',
            'orchestrate toolkits import -k workflow -f tools/my_workflow.py'
          ],
          correctIndex: 2,
          hint: 'Workflows are imported as flow-type tools using `orchestrate tools import -k flow -f <file>`. They then appear in `orchestrate tools list` and can be assigned to agents like any other tool.'
        },
        {
          text: 'When should you choose an agentic workflow over a regular agent?',
          options: [
            'When you need the LLM to reason about each step and adapt to unexpected inputs',
            'When the process is fixed and deterministic, steps have clear inputs/outputs, and cost and speed are priorities',
            'When you need the agent to handle multi-turn conversation with a user',
            'When the number of tools is fewer than three'
          ],
          correctIndex: 1,
          hint: 'Use workflows for fixed, predictable processes like loan approval or order processing — no LLM reasoning needed between steps. Use agents when dynamic decision-making, conversation, or flexibility is required.'
        }
      ]
    },

    'quiz-part6': {
      id: 'part6-mcp-servers',
      questions: [
        {
          text: 'What does MCP stand for, and what is its purpose in watsonx Orchestrate?',
          options: [
            'Multi-Channel Protocol — used to deploy agents across Slack, Teams, and web chat simultaneously',
            'Model Context Protocol — a standardized protocol for connecting AI agents to external tools and data sources',
            'Managed Compute Platform — IBM\'s serverless runtime for executing Python tool code',
            'Modular Component Pipeline — a framework for chaining multiple agents in sequence'
          ],
          correctIndex: 1,
          hint: 'MCP (Model Context Protocol) is a standardized protocol that packages multiple related tools together into a "toolkit", making them reusable across agents and easy to integrate with watsonx Orchestrate.'
        },
        {
          text: 'In a Python MCP server, which two decorators are used to define and implement tools?',
          options: [
            '@app.register_tool() to define and @app.execute_tool() to implement',
            '@tool to define and @app.run() to implement',
            '@app.list_tools() to define and @app.call_tool() to implement',
            '@mcp.tool() to define and @mcp.handler() to implement'
          ],
          correctIndex: 2,
          hint: '`@app.list_tools()` registers a function that returns the list of available Tool objects (for discovery). `@app.call_tool()` handles the actual execution when an agent calls a tool.'
        },
        {
          text: 'What is the correct `kind` value in a toolkit YAML file for importing an MCP server?',
          options: [
            'kind: toolkit',
            'kind: python',
            'kind: server',
            'kind: mcp'
          ],
          correctIndex: 3,
          hint: 'The toolkit YAML must have `kind: mcp` along with `spec_version: v1`, `name`, `description`, `command` (to start the server), `env`, `tools`, and `package_root`.'
        },
        {
          text: 'Which CLI command imports an MCP server toolkit from a YAML file?',
          options: [
            'orchestrate tools import -k mcp -f product-catalog-toolkit.yaml',
            'orchestrate toolkits import -f product-catalog-toolkit.yaml',
            'orchestrate agents import -k toolkit -f product-catalog-toolkit.yaml',
            'orchestrate mcp import -f product-catalog-toolkit.yaml'
          ],
          correctIndex: 1,
          hint: '`orchestrate toolkits import -f <file>` is the correct command. After importing, verify with `orchestrate toolkits list` — you should see your toolkit with all its tools listed.'
        },
        {
          text: 'When referencing MCP toolkit tools in an agent YAML file, what format must tool names use?',
          options: [
            'Just the tool name: `search_products`',
            'The toolkit name and tool name separated by a slash: `product-catalog/search_products`',
            'The toolkit name and tool name separated by a colon: `product-catalog:search_products`',
            'A full import path: `toolkits.product-catalog.search_products`'
          ],
          correctIndex: 2,
          hint: 'MCP toolkit tools must be referenced as `toolkit-name:tool-name` in the agent YAML `tools:` list. For example: `product-catalog-JKJ:search_products`. Missing the toolkit prefix causes a "tool not found" error.'
        }
      ]
    },

    'quiz-part5': {
      id: 'part5-guidelines-guardrails',
      questions: [
        {
          text: 'Guidelines in watsonx Orchestrate use a "When-Then" format. What do the two parts represent?',
          options: [
            'When = the tool to call, Then = the expected output format',
            'When = a specific condition that triggers the guideline, Then = the action to perform',
            'When = the user role, Then = the permission level granted',
            'When = the LLM model to use, Then = the response temperature setting'
          ],
          correctIndex: 1,
          hint: 'Guidelines are condition-action rules: "When [condition is met] → Then [perform this action and/or invoke this tool]". They create predictable, rule-based responses to defined situations.'
        },
        {
          text: 'What is the key difference between guidelines and guardrails?',
          options: [
            'Guidelines are written in Python; guardrails are written in YAML',
            'Guidelines apply to all agents; guardrails are agent-specific',
            'Guidelines are evaluated by the LLM during reasoning; guardrails are code-based plugins that execute automatically before/after the LLM',
            'Guidelines filter outputs; guardrails filter inputs'
          ],
          correctIndex: 2,
          hint: 'Guidelines work inside the LLM\'s reasoning — the LLM reads and interprets them contextually. Guardrails are Python plugins that execute deterministically outside the LLM as pre-invoke (input) or post-invoke (output) filters.'
        },
        {
          text: 'Which decorator and `kind` parameter are required to create a pre-invoke guardrail plugin in Python?',
          options: [
            '@plugin with kind=PluginKind.PRE_INVOKE',
            '@guardrail with kind=GuardrailKind.INPUT',
            '@tool with kind=PythonToolKind.AGENTPREINVOKE',
            '@tool with kind=PythonToolKind.INPUT_FILTER'
          ],
          correctIndex: 2,
          hint: 'Guardrail plugins use the `@tool` decorator with `kind=PythonToolKind.AGENTPREINVOKE` for input filtering and `PythonToolKind.AGENTPOSTINVOKE` for output filtering. Both `description` and `kind` parameters are required.'
        },
        {
          text: 'According to Part 5, where should collaborator agents be referenced in a guideline — and where should they NOT be?',
          options: [
            'In the `tool:` field of the guideline — never in the `action:` field',
            'In the `action:` field description — never in the `tool:` field (which is only for tools)',
            'In both the `tool:` and `action:` fields simultaneously for redundancy',
            'In a separate `collaborators:` section inside each guideline block'
          ],
          correctIndex: 1,
          hint: 'The `tool:` field in a guideline must only reference imported tools. Collaborator handoffs are described in the `action:` field using natural language — e.g. "hand off to the escalation_agent collaborator".'
        },
        {
          text: 'What is the correct way to attach a guardrail plugin to an agent in its YAML configuration?',
          options: [
            'Add the plugin file path under a `guardrail_scripts:` key',
            'List the plugin under `tools:` alongside regular Python tools',
            'Add the plugin name under `plugins: agent_pre_invoke:` or `plugins: agent_post_invoke:`',
            'Set `guardrails_enabled: true` and list plugin names under `guardrail_names:`'
          ],
          correctIndex: 2,
          hint: 'After importing a plugin with `orchestrate tools import -k python -f plugin.py`, attach it in the agent YAML under `plugins: agent_pre_invoke:` (for input) or `plugins: agent_post_invoke:` (for output), with `- plugin_name: your_plugin`.'
        }
      ]
    },

    'quiz-part4': {
      id: 'part4-knowledge',
      questions: [
        {
          text: 'What is the correct `kind` value in a knowledge base YAML configuration file?',
          options: [
            'kind: agent',
            'kind: knowledge',
            'kind: knowledge_base',
            'kind: vector_store'
          ],
          correctIndex: 2,
          hint: 'The `kind` field must be exactly `knowledge_base`. Other required fields are `spec_version: v1`, `name`, `description`, and `documents`. Getting `kind` wrong will cause the import to fail.'
        },
        {
          text: 'Which CLI command imports a knowledge base YAML file into watsonx Orchestrate?',
          options: [
            'orchestrate agents import -f customer-support-faq.yaml',
            'orchestrate knowledge-bases import -f customer-support-faq.yaml',
            'orchestrate tools import -k knowledge -f customer-support-faq.yaml',
            'orchestrate kb add -f customer-support-faq.yaml'
          ],
          correctIndex: 1,
          hint: '`orchestrate knowledge-bases import -f <file>` uploads and indexes the knowledge base. After importing, use `orchestrate knowledge-bases list` to check the status — wait for "ready" before testing.'
        },
        {
          text: 'How do you connect a knowledge base to an agent in the agent\'s YAML configuration?',
          options: [
            'Add the knowledge base name under the `tools:` key',
            'Set `knowledge_enabled: true` and provide the name in `knowledge_source:`',
            'Add the knowledge base name under the `knowledge_base:` key',
            'Reference it in the agent\'s `instructions:` field with @knowledge syntax'
          ],
          correctIndex: 2,
          hint: 'Add a `knowledge_base:` list to the agent YAML with the exact knowledge base name (including your initials postfix). The name must match what was imported — use `orchestrate knowledge-bases list` to confirm.'
        },
        {
          text: 'In watsonx Orchestrate, what is an agent "collaborator"?',
          options: [
            'A human supervisor who reviews agent responses before they are sent',
            'Another agent that the main agent can delegate tasks to for specialised handling',
            'A shared tool that multiple agents can call simultaneously',
            'A second LLM model used to validate the primary agent\'s responses'
          ],
          correctIndex: 1,
          hint: 'Collaborators are specialist agents listed under the `collaborators:` key. The main agent can delegate tasks to them — for example, escalating complex refund requests to a senior escalation agent.'
        },
        {
          text: 'According to the Part 4 workshop, when should the customer support agent escalate to the escalation agent?',
          options: [
            'For every refund request regardless of amount',
            'Only when the customer explicitly asks to speak to a manager',
            'For refund requests over $10,000, legal threats, policy exceptions, or requests beyond its authority',
            'Whenever the knowledge base does not return a relevant result'
          ],
          correctIndex: 2,
          hint: 'The escalation criteria are: refunds over $10,000, upset customers or legal threats, requests requiring policy exceptions, issues beyond the agent\'s authority, or a customer requesting a manager.'
        }
      ]
    },

    'quiz-part3b': {
      id: 'part3b-ai-gateway-models',
      questions: [
        {
          text: 'What is the primary purpose of the AI Gateway in watsonx Orchestrate?',
          options: [
            'To store and version agent YAML configuration files',
            'To provide a unified interface for accessing multiple LLM providers through a single API',
            'To monitor Python tool execution times and errors',
            'To manage the watsonx Orchestrate CLI authentication tokens'
          ],
          correctIndex: 1,
          hint: 'The AI Gateway acts as a unified interface between your agents and various LLM providers (OpenAI, Anthropic, Google, AWS Bedrock, etc.), handling abstraction, governance, and cost tracking centrally.'
        },
        {
          text: 'Which is the default recommended model for watsonx Orchestrate agents in this workshop?',
          options: [
            'openai/gpt-4-turbo',
            'anthropic/claude-3-opus',
            'groq/openai/gpt-oss-120b',
            'watsonx/ibm/granite-3-8b-instruct'
          ],
          correctIndex: 2,
          hint: '`groq/openai/gpt-oss-120b` is the default platform model — optimised for speed, tool calling, and multilingual support. Start with this before adding external providers.'
        },
        {
          text: 'Which CLI commands are needed to connect an external model provider like OpenAI to watsonx Orchestrate?',
          options: [
            'orchestrate models connect and orchestrate models register',
            'orchestrate connections add, orchestrate connections configure, and orchestrate connections set-credentials',
            'orchestrate providers add and orchestrate providers authenticate',
            'orchestrate llm add and orchestrate llm set-key'
          ],
          correctIndex: 1,
          hint: 'Three steps: `orchestrate connections add -a openai`, then `connections configure` to set the type, then `connections set-credentials` to provide the API key. After that you can add the model with `orchestrate models add`.'
        },
        {
          text: 'What does a fallback model policy do in watsonx Orchestrate?',
          options: [
            'It resets the agent to use the default model when token limits are exceeded',
            'It distributes traffic across multiple models based on configurable weights',
            'It automatically switches to a backup model when the primary model returns errors',
            'It retries the same model request up to a configured number of times'
          ],
          correctIndex: 2,
          hint: 'A fallback policy (mode: fallback) automatically switches to the next model in the targets list when the primary returns errors (e.g. 503, 500). Loadbalance splits traffic by weight; single retries the same model.'
        },
        {
          text: 'How do you reference an external model or model policy in an agent\'s YAML configuration?',
          options: [
            'Add the provider name under an `external_llm:` key in the agent YAML',
            'Set the model in the `tools:` list alongside other tool names',
            'Set the `llm:` field to the model or policy name (e.g. `llm: resilient_gpt`)',
            'Add a `model_policy:` section with the provider and credentials'
          ],
          correctIndex: 2,
          hint: 'The `llm:` field in the agent YAML accepts either a direct model name (e.g. `groq/openai/gpt-oss-120b`) or a policy name (e.g. `resilient_gpt`). The AI Gateway resolves it at runtime.'
        }
      ]
    },

    'quiz-part3': {
      id: 'part3-custom-tools',
      questions: [
        {
          text: 'Which Python decorator is used to define a watsonx Orchestrate tool?',
          options: [
            '@agent',
            '@flow',
            '@tool',
            '@function'
          ],
          correctIndex: 2,
          hint: 'The `@tool` decorator from `ibm_watsonx_orchestrate.agent_builder.tools` marks a Python function as a watsonx Orchestrate tool. Without it, the function cannot be imported or used by an agent.'
        },
        {
          text: 'Where does a watsonx Orchestrate tool get its description from by default — the text the agent uses to decide when to call it?',
          options: [
            'The function name converted to a sentence',
            'The Python function\'s docstring',
            'The agent YAML instructions field',
            'A separate description.txt file in the tools/ directory'
          ],
          correctIndex: 1,
          hint: 'By default the tool description is extracted from the function\'s docstring. You can also pass it directly via `@tool(description="...")`. A clear description is critical — it\'s how the agent decides when to call the tool.'
        },
        {
          text: 'Which CLI command imports a Python tool file into watsonx Orchestrate?',
          options: [
            'orchestrate tools add -f tools/my_tool.py',
            'orchestrate tools deploy -k python -f tools/my_tool.py',
            'orchestrate tools import -k python -f tools/my_tool.py',
            'orchestrate agents import -k python -f tools/my_tool.py'
          ],
          correctIndex: 2,
          hint: '`orchestrate tools import -k python -f <file>` imports a Python tool. The `-k python` flag specifies the tool kind. Use `orchestrate tools list` afterwards to verify it was imported successfully.'
        },
        {
          text: 'In the workshop, why do participants add their initials as a postfix to tool function names (e.g. `check_order_status_JKJ`)?',
          options: [
            'It is required by the @tool decorator for unique identification',
            'To avoid naming conflicts since all participants share the same watsonx Orchestrate environment',
            'The CLI refuses to import tools without a unique suffix',
            'It helps Bob identify which tools belong to which developer'
          ],
          correctIndex: 1,
          hint: 'All workshop participants work in the same shared watsonx Orchestrate environment. Adding initials as a postfix ensures each participant\'s tools have unique names and don\'t overwrite each other\'s work.'
        },
        {
          text: 'For an agent to use a custom tool, what must you do in the agent\'s YAML file?',
          options: [
            'Set `tools_enabled: true` in the agent YAML',
            'Add the tool\'s file path under an `imports:` key',
            'List the tool name under the `tools:` key in the agent YAML',
            'Add a `use_tool` instruction to the agent\'s instructions field'
          ],
          correctIndex: 2,
          hint: 'Tools must be explicitly listed by name under the `tools:` key in the agent YAML. The name must exactly match the imported tool name — including any initials postfix you added.'
        }
      ]
    },

    'quiz-part2b': {
      id: 'part2b-bob-custom-rules',
      questions: [
        {
          text: 'Where must custom rule files be placed for Bob IDE to automatically apply them?',
          options: [
            'In the project root as .bobrc files',
            'In the .bob/rules/ directory inside your project',
            'In a rules/ folder next to your agents/ directory',
            'Uploaded via the Bob IDE settings panel'
          ],
          correctIndex: 1,
          hint: 'Custom rules live in `.bob/rules/` inside your project directory. Bob automatically picks them up from there — no extra configuration needed.'
        },
        {
          text: 'What format are Bob IDE custom rule files written in?',
          options: [
            'YAML — the same format as agent specifications',
            'JSON — structured key-value rule definitions',
            'Markdown (.md) — natural language guidelines',
            'Python — executable rule scripts'
          ],
          correctIndex: 2,
          hint: 'Custom rules are plain Markdown (.md) files. They use natural language to describe conventions, patterns, and guidelines that Bob should follow in your project.'
        },
        {
          text: 'According to the watsonx Orchestrate development rule, where should Python tools using the @tool decorator be saved?',
          options: [
            'In the agents/ directory alongside YAML files',
            'In the scripts/ directory',
            'In the tools/ directory',
            'In the src/ directory'
          ],
          correctIndex: 2,
          hint: 'The ADK convention is: `tools/` for Python tools and flows, `agents/` for YAML configurations, `knowledge_bases/` for knowledge bases, and `toolkits/` for MCP toolkits.'
        },
        {
          text: 'Which MCP server should Bob use when searching for watsonx Orchestrate ADK documentation, API references, and code examples?',
          options: [
            'ibm-cloud-docs',
            'watsonx-orchestrate-adk-docs',
            'wx-orchestrate-api',
            'ibm-developer-docs'
          ],
          correctIndex: 1,
          hint: 'The `watsonx-orchestrate-adk-docs` MCP server is specifically set up to search ADK documentation, find API references, and provide code examples for watsonx Orchestrate projects.'
        },
        {
          text: 'What should you do if Bob is not following your custom rules?',
          options: [
            'Reinstall the watsonx Orchestrate ADK extension',
            'Delete and recreate the .bob/ directory',
            'Check the file is in .bob/rules/, confirm valid markdown syntax, then ask Bob to reload rules',
            'Add the rules directly into the agent YAML instructions field'
          ],
          correctIndex: 2,
          hint: 'Troubleshooting checklist: verify the file is in `.bob/rules/`, check the markdown syntax is valid, restart/refresh Bob, then ask: "Bob, please reload your custom rules and confirm you can see them."'
        }
      ]
    },
    'quiz-part2': {
      id: 'part2-first-agent',
      questions: [
        {
          text: 'Which four fields are mandatory in every watsonx Orchestrate agent YAML specification?',
          options: [
            'name, description, tools, collaborators',
            'spec_version, kind, name, llm',
            'spec_version, name, instructions, style',
            'kind, name, llm, guidelines'
          ],
          correctIndex: 1,
          hint: 'Every agent MUST have `spec_version`, `kind`, `name`, and `llm`. All other fields — description, instructions, tools, etc. — are optional.'
        },
        {
          text: 'What is the most critical field in an agent\'s YAML configuration, and why?',
          options: [
            'The `llm` field — it determines the model powering the agent',
            'The `name` field — it is the unique identifier used by the CLI',
            'The `instructions` field — it defines the agent\'s personality, behavior, and how it uses tools',
            'The `kind` field — it controls whether the agent is native or external'
          ],
          correctIndex: 2,
          hint: 'The `instructions` field is the most critical part of agent configuration. Well-written instructions lead to predictable, helpful agent responses — it defines role, capabilities, behavior, and output format.'
        },
        {
          text: 'Which CLI command imports a new agent (or updates an existing one) from a YAML file?',
          options: [
            'orchestrate agents deploy -f hello-agent.yaml',
            'orchestrate agents create -f hello-agent.yaml',
            'orchestrate agents import -f hello-agent.yaml',
            'orchestrate agents push -f hello-agent.yaml'
          ],
          correctIndex: 2,
          hint: '`orchestrate agents import -f <file>` is used both to create a new agent and to update an existing one after you change the YAML. Always re-import after editing.'
        },
        {
          text: 'Agent names in watsonx Orchestrate must follow a specific convention. Which format is correct?',
          options: [
            'hello-world-agent (kebab-case with hyphens)',
            'HelloWorldAgent (PascalCase)',
            'hello_world_agent (snake_case with underscores)',
            'helloWorldAgent (camelCase)'
          ],
          correctIndex: 2,
          hint: 'watsonx Orchestrate requires snake_case for agent names — underscores only, no hyphens, no spaces, no camelCase. For example: `hello_world_agent`, not `hello-world-agent`.'
        },
        {
          text: 'Which CLI command lets you test an agent interactively without opening the watsonx Orchestrate UI?',
          options: [
            'orchestrate agents test --name <agent_name>',
            'orchestrate chat ask --agent-name <agent_name>',
            'orchestrate run --agent <agent_name>',
            'orchestrate agents chat -n <agent_name>'
          ],
          correctIndex: 1,
          hint: '`orchestrate chat ask --agent-name <name>` starts an interactive terminal chat session with your agent — great for quick testing without needing to log in to the UI.'
        }
      ]
    },
    'quiz-part1': {
      id: 'part1-setup',
      questions: [
        {
          text: 'What is IBM watsonx Orchestrate?',
          options: [
            'A Python package manager for AI projects',
            'An AI platform for building, deploying, and managing intelligent agents and workflows',
            'A cloud storage service for IBM Watson models',
            'A code editor plugin for writing YAML configurations'
          ],
          correctIndex: 1,
          hint: 'watsonx Orchestrate is IBM\'s AI platform that lets you build and deploy intelligent agents powered by LLMs, connect them to tools and data, and orchestrate multi-agent workflows.'
        },
        {
          text: 'Which command do you use to verify your watsonx Orchestrate environment is connected and working?',
          options: [
            'orchestrate env status',
            'orchestrate ping',
            'orchestrate agents list',
            'orchestrate verify --connection'
          ],
          correctIndex: 2,
          hint: '`orchestrate agents list` is the standard check — if your environment is correctly configured it will return a list of agents (or an empty list), confirming the connection works.'
        },
        {
          text: 'What is IBM Bob\'s role throughout this workshop?',
          options: [
            'Bob is the name of the watsonx Orchestrate CLI tool',
            'Bob is an AI coding assistant that helps you write, debug, and explain code',
            'Bob is a cloud deployment pipeline for publishing agents',
            'Bob is a testing framework for validating agent responses'
          ],
          correctIndex: 1,
          hint: 'IBM Bob is an AI pair programmer — you use it to generate Python tools, debug issues, explain concepts, and accelerate development throughout the workshop.'
        },
        {
          text: 'How often does your watsonx Orchestrate authentication token expire, and what must you do when it does?',
          options: [
            'Every 24 hours — restart IBM Bob IDE',
            'Every 8 hours — reinstall the ADK',
            'Every 2 hours — run `orchestrate env activate` again',
            'Every 30 minutes — regenerate your API key'
          ],
          correctIndex: 2,
          hint: 'Authentication against a remote watsonx Orchestrate environment expires every two hours. Run `orchestrate env activate <name>` to re-authenticate — keep your API key handy.'
        },
        {
          text: 'Which of the following is a good way to use IBM Bob effectively during the workshop?',
          options: [
            '"Bob, fix this" — short and direct',
            '"Bob, do everything for me" — let Bob handle all tasks',
            '"Bob, create a Python tool that checks order status given an order ID" — specific with context',
            '"Bob, make it work" — describe the desired outcome'
          ],
          correctIndex: 2,
          hint: 'Bob works best with specific, contextual prompts. Vague requests like "fix this" or "make it work" give Bob too little context to help effectively.'
        }
      ]
    }
  };


  // ── Auto-init ────────────────────────────────────────────
  // quiz.js is a synchronous <script> at the bottom of <body>.
  // By the time this code executes the DOM is fully parsed and
  // DOMContentLoaded has already fired — so run immediately.

  function runOnPage() {
    document.querySelectorAll('[data-quiz]').forEach(function (el) {
      var quizId = el.getAttribute('data-quiz');
      if (quizId && QUIZ_DATA[quizId]) {
        var cfg = QUIZ_DATA[quizId];
        init({ id: cfg.id, containerId: el.id, questions: cfg.questions });
      }
    });
    if (document.getElementById('quiz-dashboard')) {
      renderDashboard('quiz-dashboard');
    }
  }

  runOnPage();

})();
