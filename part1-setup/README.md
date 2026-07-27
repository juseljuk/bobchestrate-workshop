# Part 1: Setup & Environment

<p align="center">
  <img src="bobchestrate_part1.png" alt="Bobchestrate - Setup" width="700">
</p>

**Duration:** 15 minutes

**Objective:** Get your development environment ready for building watsonx Orchestrate agents

## Prerequisites Check

Before starting, ensure you have:

- [ ] Python 3.11-3.13 installed
- [ ] uv installed
- [ ] IBM Bob IDE installed
- [ ] watsonx Orchestrate access (SaaS or Developer Edition)

### ⚠️ Warning ⚠️ ###

> **Make sure you have all the prerequisites filled! You will face a lot of issues with the wrong Python version for example. Follow the steps in the correct order to assure the setup procedure works as designed!**

## Step 1: Verify Python Installation

### macOS / Linux

Open a terminal and run:
```bash
python3 --version
```
***IMPORTANT: If you see something other than version 3.11.x, 3.12.x or 3.13.x, you need to install one of the supported versions, 3.11.x - 3.13.x, on your computer!***

### Windows 11

Open PowerShell or Windows Terminal and run:
```powershell
python --version
```
> **Note:** On Windows, use `python` not `python3`. If typing `python` opens the Microsoft Store instead of showing a version, disable the stub via **Settings → Apps → Advanced app settings → App execution aliases** and toggle off the Python entries.

***IMPORTANT: If you see something other than version 3.11.x, 3.12.x or 3.13.x, you need to install one of the supported versions, 3.11.x - 3.13.x, on your computer!***

During installation, make sure to check:
- ✅ **Add Python to PATH**
- ✅ **Install pip**

---

Download supported Python version: ([https://www.python.org/downloads/](https://www.python.org/downloads/))

## Step 2: Verify uv Installation

### macOS / Linux

Open a terminal and run:
```bash
uv --version
```

If not installed, install via Homebrew:
```bash
brew install uv
```

### Windows 11

Open PowerShell and run:
```powershell
uv --version
```

If not installed, install via PowerShell:
```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```
Or via pip:
```powershell
pip install uv
```

---

***IMPORTANT: You should see a version displayed. The version number does not matter, you just need to have uv installed.***

Download uv: ([https://pypi.org/project/uv/](https://pypi.org/project/uv/))

## Step 3: Create a new folder for the Workshop

> **⚠️ WARNING: Avoid spaces in your folder path.** The ADK extension will fail to install if any part of the folder path contains spaces (e.g. `My Projects/bobchestrate-ws` will cause issues). Use hyphens or underscores instead — for example `bobchestrate-ws` or `bobchestrate_ws`. This applies to all parent folders in the path as well.

Create a dedicated folder for your workshop project - you can place it wherever you want.

### macOS / Linux

```bash
mkdir bobchestrate-ws
cd bobchestrate-ws
```

### Windows 11

```powershell
mkdir bobchestrate-ws
cd bobchestrate-ws
```

> **Note:** The commands are the same, but paths on Windows use backslashes (e.g. `C:\Users\YourName\bobchestrate-ws`). PowerShell accepts both forward and backslashes.

This folder will contain all your workshop files, agents, and tools.
## Step 4: Open IBM Bob IDE and Login with your IBM ID

> **Download IBM Bob IDE:** If you haven't installed IBM Bob IDE yet, download it from [bob.ibm.com/download](https://bob.ibm.com/download) and install it to your computer. Make sure to use the **Bob IDE** version.

<img src="images/image_download.png" alt="Getting started" width="700px">

> **Detailed Installation Instructions:** For complete installation guidance, visit [bob.ibm.com/docs/ide/getting-started/install](https://bob.ibm.com/docs/ide/getting-started/install)

### ❗️ IMPORTANT ❗️ ###
> You must be logged in to use Bob's AI capabilities throughout the workshop. If you encounter any login issues, contact your instructor.

## Step 5: Open Folder in IBM Bob IDE

1. Once IBM Bob IDE has opened:
2. Click **File** → **Open Folder**
   
      <img src="images/image.png" alt="IBM Bob IDE File menu showing Open Folder option" width="250px">

3. Navigate to and select the `bobchestrate-ws` folder
4. Click **Open**
5. Click **Yes, I trust the author** to trust the workspace

      <img src="images/image-1.png" alt="IBM Bob IDE File menu showing Open Folder option" width="400px">

The empty workspace will open.

## Step 6: Create Python Virtual Environment

### ❗️ IMPORTANT ❗️ ###
> The Python virtual environment is crucial for the workshop. Please make sure to complete this step before proceeding to install the wxO VS Code extension and the wxO ADK itself.

### macOS / Linux

Create a virtual environment using IBM Bob IDE's built-in commands:

1. Open the Command Palette in IBM Bob IDE (press `Cmd+Shift+P`)
2. Start typing "Python: Create Environment" and select it
3. Choose "Venv" as the environment type
4. Select your Python interpreter (Python 3.11-3.13) and wait for the virtual environment to be created

   **IMPORTANT:** _Make sure to select the supported Python interpreter version (3.11-3.13). If you do not see the correct version, you may need to install it first. If you have installed the correct version and still don't see it, restart IBM Bob IDE._

You can now see the .venv folder in your workspace explorer view.

<img src="images/image-6-new.png" alt="IBM Bob IDE File menu showing Open Folder option" width="350px">

IBM Bob IDE will automatically:<br>
- Create a `.venv` folder in your workspace<br>
- Activate the virtual environment in new terminals<br>
- Show `(.venv)` in your terminal prompt

> **NOTE:** The virtual environment will be automatically activated when you open new terminals in IBM Bob IDE.

### Windows 11

You can create the virtual environment via IBM Bob IDE (recommended) or manually in PowerShell.

#### Option A: Using IBM Bob IDE (Recommended)

1. Open the Command Palette in IBM Bob IDE (press `Ctrl+Shift+P`)
2. Start typing "Python: Create Environment" and select it
3. Choose "Venv" as the environment type
4. Select your Python interpreter (Python 3.11-3.13) and wait for the virtual environment to be created

   **IMPORTANT:** _Make sure to select the supported Python interpreter version (3.11-3.13). If you do not see the correct version, you may need to install it first. If you have installed the correct version and still don't see it, restart IBM Bob IDE._

IBM Bob IDE will automatically create and activate `.venv` in new terminals.

#### Option B: Manual PowerShell Setup

If you prefer the terminal or run into IDE issues:

```powershell
# Navigate to your project folder
cd C:\Users\YourName\bobchestrate-ws

# Create the virtual environment
python -m venv .venv
```

Activate it:
```powershell
# PowerShell
.venv\Scripts\Activate.ps1

# CMD (if you must)
.venv\Scripts\activate.bat
```

> **⚠️ PowerShell Execution Policy:** If you get a script execution error, run this once:
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```

Verify activation — your prompt will show `(.venv)` and:
```powershell
where python   # Should point to .venv\Scripts\python.exe
pip --version  # Should show pip inside .venv
```

> **NOTE:** Add `.venv` to your `.gitignore` — never commit the virtual environment folder.

#### Alternative Tools Worth Knowing

| Tool | When to Use |
|---|---|
| venv (built-in) | Default choice for most projects |
| conda / miniconda | Data science / scientific computing (manages Python versions too) |
| pyenv-win | Need to manage multiple Python versions on the same machine |
| uv | Fastest modern alternative; drop-in replacement for pip+venv |
| pipenv | Combined dependency management + venv (heavier, less popular now) |
| poetry | Full dependency/packaging management for library authors |

## Step 7: Install watsonx Orchestrate ADK VS Code Extension

### ❗️ IMPORTANT ❗️ ###
> **If you already have the extension installed**, please reload the Bob IDE window! This ensures the extension properly detects your new virtual environment. Open the Command Palette in IBM Bob IDE (press `Cmd+Shift+P` on Mac / `Ctrl+Shift+P` on Windows/Linux), start typing "**Developer: Reload Window**" and select it. The Bob IDE window reloads and the extension will restart. You can then proceed directly with the Step 8. Do **NOT** use the extension to initialise the workspace!

Install the watsonx Orchestrate extension for IBM Bob IDE:

1. Open the Extensions view in IBM Bob IDE (Click the Extensions icon in the Activity Bar or press `Cmd+Shift+X` on Mac / `Ctrl+Shift+X` on Windows/Linux)
   
      <img src="images/image-2.png" alt="IBM Bob IDE File menu showing Open Folder option" width="50px">

2. Search for "**watsonx Orchestrate**"

      <img src="images/image-4.png" alt="IBM Bob IDE File menu showing Open Folder option" width="350px">

3. Click **Install** on the "_**watsonx Orchestrate ADK**_" extension
4. Wait for the installation to complete
5. Reload VS Code if prompted
6. You should now see the extension icon appear in the Activity Bar - You do NOT need to open it. If you do, do **NOT** initialize the workspace using it. This might cause some issues with the setup procedure we're using right now:
   
      <img src="images/image-3.png" alt="IBM Bob IDE File menu showing Open Folder option" width="75px">

The IBM watsonx Orchestrate ADK VS Code extension provides:

- Workspace Management: Automatically creates and initializes folder structures for agent development
- ADK Version Management: Install and update the watsonx Orchestrate ADK directly from VS Code
- Agent & Tool File Creation: Assists with creating agent and tool files
- Developer Edition Server Control: Start/stop the watsonx Orchestrate Developer Edition server directly from the UI
- Orchestrate AI Builder Assistant: Interactive AI assistant that guides you through building and refining agents using prompts

### ❗️ IMPORTANT ❗️ ###
> Do **NOT** open the extension itself, you just need it installed. Using the extension to initialise the workspace can cause issues!

## Step 8: Install watsonx Orchestrate ADK

### macOS / Linux

Since you now have the watsonx Orchestrate ADK extension installed, you will see the ADK information in the bottom Status Bar. Since we just created a fresh Python virtual environment to our workspace, you should see just a red cross ❌ stating that you need to install the ADK.

<img src="images/image-7.png" alt="IBM Bob IDE Status Bar showing ADK not installed" width="300px">

Click on the red cross to install the ADK. This will open a couple of commands to the search/command bar. **Select the one to install the ADK**.

<img src="images/image-8.png" alt="IBM Bob IDE Command Palette showing Install ADK command" width="500px">

Wait for the installation to complete. After a while, you should see a notification and a green checkmark in the Status Bar with the latest version number of the ADK.

<img src="images/image-9.png" alt="IBM Bob IDE Status Bar showing ADK installed" width="300px">

>**NOTE**: The version number you are seeing in the Status Bar is the version of the ADK that is installed. It might be different from the version shown in the picture above. New ADK versions are released regularly, so the version number will change over time.

### Windows 11

You can install the ADK via IBM Bob IDE (same as macOS above) or manually via PowerShell.

#### Option A: Using IBM Bob IDE (Recommended)

Follow the same steps as macOS above — click the red cross ❌ in the Status Bar and select the install option.

#### Option B: Manual Installation via PowerShell

With your virtual environment activated, run:

```powershell
pip install --upgrade ibm-watsonx-orchestrate
```

Validate the installation:
```powershell
orchestrate --version
```

You should see the ADK version number printed in the terminal.

## Step 9: Install watsonx Orchestrate MCP Servers

Install the watsonx Orchestrate MCP servers through the ADK extension:

1. Open the Command Palette in IBM Bob IDE (press `Cmd+Shift+P` on Mac / `Ctrl+Shift+P` on Windows/Linux)
2. Start typing "**watsonx Orchestrate: Install WXO MCP Servers**" and select it
3. Wait for the installation to complete
4. You should see a confirmation message that the MCP servers have been installed successfully

**Verify the installation:**

To confirm the MCP servers are installed and working:

1. Open Bob's chat panel in IBM Bob IDE
2. Ask Bob: "What MCP servers are available?"
3. You should see the following watsonx Orchestrate MCP servers listed:
   - `watsonx-orchestrate-adk` - Provides tools for interacting with watsonx Orchestrate (list agents, tools, etc.)
   - `watsonx-orchestrate-adk-docs` - Provides access to watsonx Orchestrate documentation

Alternatively, you can check the MCP servers configuration:
1. Open the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
2. Type "MCP Servers" and select it
3. Verify that the watsonx Orchestrate MCP servers are listed in the configuration and both of them marked with a green bullet point

   <img src="images/image-5.png" alt="IBM Bob IDE File menu showing Open Folder option" width="650px">

>**NOTE**: It might take a couple of seconds after the installation is run for both of the MCP servers to appear in the list.

The MCP servers provide:

- Access to watsonx Orchestrate documentation
- Integration with the watsonx Orchestrate ADK
- Tools for listing agents, tools, and other resources
- Enhanced Bob capabilities for watsonx Orchestrate development

## Step 10: Import WXO Agent Architect Mode

Import a pre-configured custom mode specialized for building watsonx Orchestrate agents.

>**NOTE**: IBM Bob Marketplace has a lot of pre-configured modes for IBM Bob IDE, including a mode for building watsonx Orchestrate agents. Unfortunately, the marketplace is currently not available for non-IBMers but will be in the near future. This step will guide you on how to import a custom mode manually.

Download the mode configuration file:

1. The file is located at: [wxo-agent-architect-export.yaml](files/wxo-agent-architect-export.yaml)
2. Click the **Download raw file** button

      <img src="images/image-10.png" alt="Download the raw file" width="300px">

3. Save the file to your Downloads folder or a location you can easily access
4. Open the Command Palette in IBM Bob IDE (press `Cmd+Shift+P` on Mac / `Ctrl+Shift+P` on Windows/Linux)
5. Type "**Modes**" and select it
6. Click on **Import** icon in the modes panel

      <img src="images/image-11.png" alt="Import custom mode" width="400px">

7. Select the `wxo-agent-architect-export.yaml` file you downloaded and click **Open**
8. You should see a confirmation message that the mode was imported successfully and see the mode appear in the modes panel

The imported "WXO Agent Architect" mode includes:

- **Role Definition**: Specialized for building watsonx Orchestrate agents
- **Custom Instructions**: Guidance on using MCP servers for agent development
- **MCP Server Integration**: Automatically uses both `watsonx-orchestrate-adk` and `watsonx-orchestrate-adk-docs` servers
- **Tool Groups**: Access to read, edit, browser, command, and MCP tools

**Verify the mode:**

1. Open Bob's chat panel if not already open
2. Click on the mode selector (usually shows the current mode like "Code" or "Ask")
3. You should see "WXO Agent Architect" in the list of available modes
4. Select "**WXO Agent Architect**" mode
5. Ask Bob: "What can you help me with in this mode?"
6. Bob should respond with information about building watsonx Orchestrate agents and mention the available MCP servers

## Step 11: Get Your watsonx Orchestrate API key and API URL

For the workshop, we will use the watsonx Orchestrate ADK to interact with a watsonx Orchestrate SaaS instance. The ADK requires your API key and API URL to authenticate and connect to your watsonx Orchestrate instance.

> **_Note:_** `Your instructor will provide you with the API key and API URL for your watsonx Orchestrate instance.` If you are using your own instance, you can follow the instructions below to get the needed API key and the API URL.

### OPTIONAL: Using your own watsonx Orchestrate SaaS instance

<ins>To generate an API key for the ADK:</ins>

1. In your watsonx Orchestrate console, click on your **profile icon** in the top-right corner
2. Select **Settings** from the dropdown menu
3. Navigate to the **API details** tab
4. Click **Generate API key** button

      <img src="images/image-12.png" alt="Generate API key button highlighted" width="350px">

5. When the key is generated, click **Copy** to save it to your clipboard
6. **Important**: Copy the API key immediately and _store_ it securely
   - The key will only be shown once
   - If you lose it, you'll need to create a new one

> **Security Best Practice**: Treat your API key like a password. Never commit it to version control or share it publicly.

<ins>To get the API URL:</ins>

Copy the **Service instance URL** from the API details information. This is the base URL for your watsonx Orchestrate instance.

   <img src="images/image-13.png" alt="Get the service URL" width="600px">

## Step 12: Configure the ADK Environment

#### Option A: Using the ADK CLI - check out the Option B before deciding which option to use 😉

1. Open a terminal window within Bob IDE:

   - From the Bob main menu bar, select **Terminal** > **New Terminal**

      <img src="images/image-14.png" alt="Open terminal" width="500px">
   
   - This will open a terminal window in the Bob IDE - notice that your Python virtual environment is automatically activated

      <img src="images/image-15.png" alt="Terminal window opened in Bob IDE" width="700px">

2. Run the following command in your terminal to **add** your environment:

   ```bash
   orchestrate env add -n <your-env-name> -u <your-api-url>
   ```
   Where `<your-env-name>` is a name you choose for your environment (e.g., "my-wxo-cloud") and `<your-api-url>` is the URL you got in Step 11.
   
   After running the command, you should see a message: `[INFO] Environment '<your-env-name>' has been created`

3. Run the following command to **activate** the environment:

   ```bash
   orchestrate env activate <your-env-name> -a <your-api-key>
   ```
   Where `<your-env-name>` is a name you choose for your environment (e.g., "my-wxo-cloud") and `<your-api-key>` is the API key you got in Step 11.
   
   After running the command, you should see a message: `[INFO] Environment '<your-env-name>' is now active`. This means your environment is now active and ready to use with the ADK. You can ignore the warning regarding the Auth Type.

### ❗️ IMPORTANT ❗️ ###
> Authentication against a remote environment expires every two hours. After expiration, you need to run orchestrate env activate again. So, keep your API key available and ready to use.

#### Option B: Using Bob to help you 😃

Now that you have watsonx Orchestrate MCP servers and the WXO Agent Architect mode enabled, you can use Bob to help you with the setup.

1. Make sure that you have the **WXO Agent Architect** mode selected for your Bob chat. Then ask Bob to create a script to add and activate a new watsonx Orchestrate environment for the ADK:

      ```
      Create a simple shell script to add and activate new watsonx Orchestrate SaaS environment for the ADK. I have the environment URL and API key ready.
      ```

      <img src="images/image-16.png" alt="Create a script to add and activate a new watsonx Orchestrate environment for the ADK" width="400px">

2. When Bob starts working, it will be asking for permission to access the watsonx-orchestrate-adk-docs MCP server. Click on the **Approve** button to allow Bob to access the documentation.

      >**NOTE**: You can also check the **Always allow** checkbox to always allow Bob to access the MCP server. One option is to enable **Auto-approval**. If you do this, you can specify the different options that you want to allow.

      <img src="images/image-17.png" alt="Approve access to MCP server" width="350px">

      >**NOTE**: Bob might ask you to approve the MCP server access multiple times. This is because Bob is trying to access the MCP server to get the more detailed information after first learning about the environment setup. Recommendation is to enable **Auto-approval** for the MCP servers to avoid granting the permission manually each time.

3. After Bob has created the script (e.g. _add_wxo_env.sh_, the name could be something else for you), it will ask for permission to save the script. Click on the **Save** button to save the script.

4. Next, Bob will (or not, depends on the day 😅) create a documentation - an MD-file - for the script. Click on the **Save** button to save the documentation.

5. After Bob has saved the documentation, it will ask you to permission to make the script executable. Click on the **Run** to execute the command.

6. Finally Bob will summarize the task for you

    <img src="images/image-18.png" alt="Task summary" width="350px">

7. Open a terminal window within Bob IDE

   - From the Bob main menu bar, select **Terminal** > **New Terminal**

      <img src="images/image-14.png" alt="Open terminal" width="550px">
   
   - This will open a terminal window in the Bob IDE - notice that your Python environment is automatically activated

      <img src="images/image-15.png" alt="Terminal window opened in Bob IDE" width="700px">

8. Run the created script in your terminal to **add** your environment

      `./<name_of_your_created_script>, e.g. ./add_wxo_env.sh`

9. When asked, provide a name for your environment, e.g. `my-wxo-cloud`

      <img src="images/image-19.png" alt="Env name" width="450px">

10. When asked, provide the URL of your Orchestrate instance that you got earlier

      <img src="images/image-20.png" alt="Env URL" width="700px">

11. When asked, provide the API key of your Orchestrate instance that you got earlier. The script will then create a new environment and activate it.

      <img src="images/image-21.png" alt="Env API key" width="450px">

12. Verify your connection is working. Run the following command in your Bob IDE terminal

      ```bash
      orchestrate agents list
      ```

      If configured correctly, this command will list any agents in your environment (or show an empty list if you haven't created any agents yet).

### ❗️ IMPORTANT ❗️ ###
> Authentication against a remote environment expires every two hours. After expiration, you need to run orchestrate env activate again. So, keep your API key available and ready to use.

## Using Bob Throughout the Workshop

Bob is your AI pair programmer for this workshop. Here's how to use Bob effectively:

### Good Bob Prompts:
✅ "Bob, create a Python tool that checks order status given an order ID"  
✅ "Bob, why is my agent not responding to user messages?"  
✅ "Bob, explain what agent instructions do in watsonx Orchestrate"  
✅ "Bob, refactor this tool to handle errors better"  

### Less Effective Prompts:
❌ "Bob, fix this" (too vague)  
❌ "Bob, make it work" (no context)  
❌ "Bob, do everything for me" (you won't learn!)  

### Bob's Special Powers:
- 🔍 **Search docs**: Bob can search watsonx Orchestrate documentation
- 💻 **Write code**: Bob can create Python tools and agent specs
- 🐛 **Debug**: Bob can analyze errors and suggest fixes
- 📚 **Explain**: Bob can explain concepts and best practices
- 🔧 **Refactor**: Bob can improve your code

### Managing Bob Chat Sessions:
- ✅ **Continue in same session**: When working on related tasks or the same topic/artifacts, continue in the same Bob chat session to maintain context
- 🆕 **Start new task**: When switching to a completely different topic or unrelated work, start a new task with Bob for a clean context
  - Click the "Start New Task" button in Bob's chat panel to start a new task
  - This helps Bob focus on the new topic without confusion from previous context
- 💡 **Best practice**: Think of each Bob session as a focused work session - keep related work together, separate unrelated work

## Troubleshooting

### Issue: "orchestrate: command not found"

#### macOS / Linux
Make sure your virtual environment is activated — `(.venv)` should appear in your prompt. Then reinstall:
```bash
pip install --upgrade ibm-watsonx-orchestrate
```
If the `orchestrate` command is still not found after reinstalling, your venv may not be activated. Open a new terminal in IBM Bob IDE (which auto-activates `.venv`) and try again.

#### Windows 11
Make sure your virtual environment is activated — `(.venv)` should appear in your prompt. Then reinstall:
```powershell
pip install --upgrade ibm-watsonx-orchestrate
```
If the `orchestrate` command is still not found, add the Scripts folder to your PATH:
```powershell
# Find the Scripts path
where.exe orchestrate

# If not found, manually add the venv Scripts folder to PATH
$env:PATH += ";C:\Users\YourName\bobchestrate-ws\.venv\Scripts"
```

### Issue: "Authentication failed"
**Solution:** Check your environment configuration:
```bash
# List environments
orchestrate env list

# Add/update environment
orchestrate env add

# Activate environment
orchestrate env activate <name>
```

### Issue: Bob isn't responding
**Solution:**

1. Restart Bob IDE
2. Check the Bob output panel for errors

## Quick Reference

### Useful Commands
```bash
# Add environment
orchestrate env add

# List environments
orchestrate env list

# Activate environment
orchestrate env activate <name>

# List agents
orchestrate agents list

# List tools
orchestrate tools list

# Get help
orchestrate --help

# Check version
orchestrate --version
```
**Remember that you can always ask Bob for help at any time!**

## Next Steps

Once your setup is verified:

1. ✅ You can connect to watsonx Orchestrate
2. ✅ Bob is responding to your questions
3. ✅ Your workspace is ready for development

**You're ready to build your first agent!**

Continue to [Part 2: Building Your First Agent](../part2-first-agent/README.md) →

## Additional Resources

- [Installation Guide](https://developer.watson-orchestrate.ibm.com/getting_started/installing)
- [Environment Configuration](https://developer.watson-orchestrate.ibm.com/environment/initiate_environment)
- [Developer Edition Setup](https://developer.watson-orchestrate.ibm.com/developer_edition/wxOde_setup)

---

**💡 Pro Tip:** Keep Bob's chat panel open throughout the workshop. Whenever you're stuck, just ask Bob for help!

## 🙏 Acknowledgements

Special thanks to **Ryan Sparks** and **Mike McMahon** for providing the Windows-specific additions to this setup guide.
