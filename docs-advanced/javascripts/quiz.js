/* ============================================================
   Bobchestrate Workshop — Quiz Engine
   Namespace: window.WXOQuiz
   Storage key: wxo_quiz_results  (localStorage)
   ============================================================ */

(function () {
  'use strict';

  /* ── Game unlock URL ──────────────────────────────────── */
  // Update this to the Code Engine URL after deploying game/index.html.
  // This is the only line instructors need to change before each workshop run.
  var GAME_URL = 'https://your-app.example.appdomain.cloud';

  /* ── Storage helpers ──────────────────────────────────── */
  var STORAGE_KEY = 'wxo_quiz_results_advanced';

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

  /* ── Game unlock check ────────────────────────────────── */
  // Returns true when every quiz in AVAILABLE_QUIZZES has passed: true.
  // Threshold rises automatically as new IDs are added to AVAILABLE_QUIZZES.
  function checkGameUnlock() {
    var results = loadResults();
    return AVAILABLE_QUIZZES.every(function (id) {
      return results[id] && results[id].passed === true;
    });
  }

  /* ── Quiz registry (all modules) ─────────────────────── */
  // id must match the folder-name convention used in quiz.md pages
  var QUIZ_REGISTRY = [
    { id: 'adv-part1-langgraph',           label: 'Advanced Part 1 — LangGraph Agents' }
  ];

  // IDs that have a quiz.md page ready
  var AVAILABLE_QUIZZES = ['adv-part1-langgraph'];

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
      // quiz.id uses the 'adv-partN-*' prefix; strip 'adv-' to match the MkDocs folder name.
      var folder = quiz.id.replace(/^adv-/, '');
      var quizUrl = '../' + folder + '/quiz/';
      var scoreHTML, badgeHTML, dateHTML;

      if (result) {
        scoreHTML = '<div class="quiz-card-score">' + result.score + ' / ' + result.total + '</div>';
        badgeHTML = result.passed
          ? '<a href="' + quizUrl + '" class="quiz-badge quiz-badge-pass">Passed ↗</a>'
          : '<a href="' + quizUrl + '" class="quiz-badge quiz-badge-retry">Try again ↗</a>';
        dateHTML = '<div class="quiz-card-date">' + formatDate(result.completedAt) + '</div>';
      } else if (available) {
        scoreHTML = '<div class="quiz-card-score" style="color:var(--quiz-text-muted)">—</div>';
        badgeHTML = '<a href="' + quizUrl + '" class="quiz-badge quiz-badge-pending">Start quiz ↗</a>';
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

    /* ── Game unlock panel ──────────────────────────────── */
    var unlocked = checkGameUnlock();
    var panelHTML;
    if (unlocked) {
      panelHTML =
        '<div class="game-unlock-panel unlocked">' +
          '<div class="game-unlock-icon">🎮</div>' +
          '<div class="game-unlock-body">' +
            '<strong class="game-unlock-title">You unlocked Bobchestrate Coins!</strong>' +
            '<p class="game-unlock-desc">All advanced quizzes passed. Your reward awaits.</p>' +
          '</div>' +
          '<a href="' + GAME_URL + '" target="_blank" rel="noopener" class="game-unlock-btn">Play now →</a>' +
        '</div>';
    } else {
      var total    = AVAILABLE_QUIZZES.length;
      var results2 = loadResults();
      var done     = AVAILABLE_QUIZZES.filter(function(id) { return results2[id] && results2[id].passed; }).length;
      panelHTML =
        '<div class="game-unlock-panel locked">' +
          '<div class="game-unlock-icon">🔒</div>' +
          '<div class="game-unlock-body">' +
            '<strong class="game-unlock-title">Bobchestrate Coins</strong>' +
            '<p class="game-unlock-desc">Complete all advanced quizzes to unlock the arcade game! ' +
              '(' + done + ' / ' + total + ' passed)</p>' +
          '</div>' +
        '</div>';
    }
    el.insertAdjacentHTML('beforeend', panelHTML);
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
    'quiz-adv-part1-langgraph': {
      id: 'adv-part1-langgraph',
      questions: [
        {
          text: 'What is the required function signature for the wxO LangGraph agent entry point?',
          options: [
            'def run_agent(messages: list) -> list',
            'def create_agent(config: RunnableConfig) -> StateGraph',
            'def build_graph(state: AgentState) -> StateGraph',
            'class LangGraphAgent: def __init__(self, config): ...'
          ],
          correctIndex: 1,
          hint: '`create_agent(config: RunnableConfig) -> StateGraph` is the required factory function. wxO calls it at startup, injects the RunnableConfig containing the runtime execution context, and compiles the returned graph internally. The exact name "create_agent" must match the entrypoint declared in agent.yaml.'
        },
        {
          text: 'What is the key watsonx Orchestrate limitation when using custom state fields in a LangGraph AgentState?',
          options: [
            'Custom state fields must use Pydantic models — plain TypedDict fields are not supported',
            'Only the `messages` field persists between separate chat turns — all other custom state fields reset on every new invocation',
            'Custom state fields are limited to string and integer types only',
            'Custom state fields are supported but must be declared in agent.yaml under the `state_schema:` key'
          ],
          correctIndex: 1,
          hint: 'wxO only persists the `messages` field (typed as `Annotated[List[BaseMessage], add_messages]`) between turns. Any other fields you add to AgentState reset at the start of every new invocation. Use the Agentic SDK memory API for data that must survive across turns.'
        },
        {
          text: 'What is the purpose of `ChatWxO` from `ibm_watsonx_orchestrate_sdk.langchain` and why use it instead of `ChatOpenAI` directly?',
          options: [
            'ChatWxO is a faster model — it skips the tokenisation step for improved latency',
            'ChatWxO routes LLM calls through the wxO AI Gateway using runtime authentication, making all platform-managed models available without hardcoded API keys',
            'ChatWxO is required because LangChain\'s ChatOpenAI is not compatible with LangGraph graphs',
            'ChatWxO automatically selects the best model for each query using cost-based routing'
          ],
          correctIndex: 1,
          hint: 'ChatWxO uses `Client.from_runnable_config(config)` for authentication — no hardcoded keys, no separate credentials. It routes through the wxO AI Gateway so any platform-managed model is available by name, and usage is tracked in wxO observability.'
        },
        {
          text: 'You want the research agent to remember a user\'s product preferences from a previous session (days ago). Which mechanism do you use?',
          options: [
            'A `memory` checkpointer in agent.yaml — it persists all state indefinitely',
            'A SQLite checkpointer — it stores state in a local file that survives across sessions',
            'The Agentic SDK memory API (`client.memory.add_messages()` / `client.memory.search()`) — user-scoped semantic memory that persists across sessions',
            'Store preferences in the `messages` list as a SystemMessage — it will be available on the next session'
          ],
          correctIndex: 2,
          hint: 'Checkpointers (memory, SQLite, PostgreSQL) persist graph state within a session — they reset when the user starts a new conversation. The Agentic SDK memory API (`client.memory`) stores semantic facts that survive indefinitely across sessions, agents, and thread boundaries.'
        },
        {
          text: 'Which CLI command imports a LangGraph agent package into watsonx Orchestrate?',
          options: [
            'orchestrate agents import -f agents/my_agent/agent.yaml',
            'orchestrate tools import -k python --package-root agents/my_agent',
            'orchestrate agents import --package-root agents/my_agent --config-file agents/my_agent/agent.yaml',
            'orchestrate toolkits import --kind langgraph --package-root agents/my_agent'
          ],
          correctIndex: 2,
          hint: '`orchestrate agents import --package-root <dir> --config-file <dir>/agent.yaml` packages the directory, uploads it, and deploys the agent. The `agent.yaml` must include `framework: langgraph` and `deployment.code_bundle.entrypoint: "module:function"`.'
        }
      ]
    }

    /* Foundation workshop quiz data intentionally not included here.
       This file serves the advanced workshop only. */

    // placeholder — future advanced quizzes go here

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

  // Run immediately (sync script at bottom of body)
  // AND guard with DOMContentLoaded for deferred/module loading
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runOnPage);
  } else {
    runOnPage();
  }

  // Re-run on Material instant navigation (turbo/ajax page transitions)
  document.addEventListener('DOMContentLoaded', runOnPage);

})();
