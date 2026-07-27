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
  var AVAILABLE_QUIZZES = ['part1-setup'];

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
        var bCls = passed ? 'quiz-score-banner pass show' : 'quiz-score-banner retry show';
        var bTitle = passed
          ? '✓ Passed — ' + score + ' / ' + questions.length + ' correct'
          : score + ' / ' + questions.length + ' correct — Try again to improve your score';
        var bBody = passed
          ? 'Great work! You\'ve completed the Part 1 quiz.'
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

  /* ── Auto-init: dashboard + any quiz container on this page ── */
  document.addEventListener('DOMContentLoaded', function () {
    // Dashboard
    if (document.getElementById('quiz-dashboard')) {
      renderDashboard('quiz-dashboard');
    }
    // Quiz containers — keyed by div id in QUIZ_DATA
    Object.keys(QUIZ_DATA).forEach(function (containerId) {
      if (document.getElementById(containerId)) {
        var cfg = QUIZ_DATA[containerId];
        init({ id: cfg.id, containerId: containerId, questions: cfg.questions });
      }
    });
  });

})();
