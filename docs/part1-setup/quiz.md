# Part 1 Quiz — Setup & Environment

Test your knowledge of watsonx Orchestrate and IBM Bob before moving on to Part 2.

!!! tip "How it works"
    Read each question and select the answer you think is correct, then click **Check Answer** to see instant feedback. Work through all 5 questions and submit to see your final score. You need **4 out of 5** to pass. Your result is saved automatically in your browser.

<div id="quiz-part1"></div>

<script>
document.addEventListener('DOMContentLoaded', function () {
  WXOQuiz.init({
    id: 'part1-setup',
    containerId: 'quiz-part1',
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
  });
});
</script>

---

[← Back to Part 1: Setup & Environment](README.md){ .md-button }
[Continue to Part 2: First Agent →](../part2-first-agent/README.md){ .md-button .md-button--primary }
