# Part 1 Quiz — Setup & Environment

Test your knowledge of the setup steps before moving on to Part 2.

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
        text: 'Which Python versions are supported for this workshop?',
        options: [
          'Python 3.8, 3.9, or 3.10',
          'Python 3.11, 3.12, or 3.13',
          'Python 3.6 or higher',
          'Any Python 3.x version'
        ],
        correctIndex: 1,
        hint: 'The workshop requires Python 3.11–3.13. Earlier versions are not supported by the watsonx Orchestrate ADK.'
      },
      {
        text: 'What is `uv` used for in this workshop?',
        options: [
          'A tool to upload files to IBM Cloud',
          'A Python package manager and virtual environment tool',
          'The command-line interface for watsonx Orchestrate',
          'An IBM Bob IDE extension'
        ],
        correctIndex: 1,
        hint: '`uv` is a fast Python package installer and virtual environment manager, used here to create and manage the workshop\'s Python environment.'
      },
      {
        text: 'Where do you download IBM Bob IDE?',
        options: [
          'https://marketplace.visualstudio.com',
          'https://pypi.org/project/ibm-bob',
          'https://bob.ibm.com/download',
          'https://developer.watson-orchestrate.ibm.com'
        ],
        correctIndex: 2,
        hint: 'IBM Bob IDE is available at bob.ibm.com/download. For full installation instructions, visit bob.ibm.com/docs/ide/getting-started/install.'
      },
      {
        text: 'Why should you avoid spaces in your workshop folder path?',
        options: [
          'MkDocs cannot build sites from paths with spaces',
          'Spaces cause issues with some CLI tools and scripts used in the workshop',
          'IBM Bob IDE does not support folders with spaces',
          'Python cannot import modules from paths containing spaces'
        ],
        correctIndex: 1,
        hint: 'Spaces in folder paths can break shell commands and scripts. The workshop recommends using hyphens or underscores instead — e.g. `bobchestrate-ws`.'
      },
      {
        text: 'What must you do in IBM Bob IDE before its AI capabilities are available?',
        options: [
          'Install the watsonx Orchestrate ADK extension',
          'Configure a `.env` file with your API keys',
          'Log in with your IBM ID',
          'Run `orchestrate env activate` in the terminal'
        ],
        correctIndex: 2,
        hint: 'You must be logged in with your IBM ID to use Bob\'s AI features throughout the workshop. If you encounter login issues, contact your instructor.'
      }
    ]
  });
});
</script>

---

[← Back to Part 1: Setup & Environment](README.md){ .md-button }
[Continue to Part 2: First Agent →](../part2-first-agent/README.md){ .md-button .md-button--primary }
