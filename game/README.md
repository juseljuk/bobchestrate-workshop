# Bobchestrate Coins 🎮

> Classic Asteroids arcade game — Bobchestrate Workshop Edition.
> Participants unlock this game by completing all advanced workshop quizzes.

## Local Testing

### Method 1 — Open directly in browser (fastest)

Because `index.html` is fully self-contained with no external dependencies, just open it directly:

```bash
open game/index.html          # macOS
xdg-open game/index.html      # Linux
start game/index.html         # Windows
```

Or drag the file into any browser tab. Use this while iterating on gameplay — no server needed.

### Method 2 — Run the container locally (mirrors Code Engine)

Use this to verify the nginx config and port mapping are correct before deploying:

```bash
# Build and run
docker build -t bobchestrate-coins ./game
docker run --rm -p 8080:8080 bobchestrate-coins

# Open in browser
open http://localhost:8080
```

---

## Deployment to IBM Cloud Code Engine

### Prerequisites

| Tool | Install |
|------|---------|
| IBM Cloud CLI | https://cloud.ibm.com/docs/cli |
| Code Engine plugin | `ibmcloud plugin install code-engine` |
| Container Registry plugin | `ibmcloud plugin install container-registry` |
| Docker | https://docs.docker.com/get-docker/ |
| Python 3 | Pre-installed on most systems (used to parse the app URL) |

You also need:
- An IBM Cloud account with an active Container Registry namespace in `eu-de`
- A Code Engine project created in `eu-de` (create one at https://cloud.ibm.com/codeengine)

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `IBMCLOUD_API_KEY` | Your IBM Cloud API key | `abc123...` |
| `ICR_NAMESPACE` | Your Container Registry namespace | `my-workshop-images` |

### Optional Overrides

| Variable | Default | Description |
|----------|---------|-------------|
| `ICR_REGION` | `de.icr.io` | Container Registry endpoint |
| `IMAGE_NAME` | `bobchestrate-coins` | Docker image name |
| `CE_PROJECT` | `bobchestrate-workshop` | Code Engine project name |
| `CE_APP_NAME` | `bobchestrate-coins` | Code Engine application name |
| `CE_REGION` | `eu-de` | IBM Cloud region |

### Deploy

```bash
# Set required variables
export IBMCLOUD_API_KEY=your-api-key-here
export ICR_NAMESPACE=your-namespace-here

# Make script executable (first time only)
chmod +x game/deploy.sh

# Deploy (from repo root)
./game/deploy.sh
```

The script will:
1. Log in to IBM Cloud (`eu-de`)
2. Build and push the Docker image to Container Registry (`de.icr.io`)
3. Create or update the Code Engine application
4. Print the public game URL

### Redeploying after changes

Just run `./game/deploy.sh` again — it detects whether the app already exists and runs `update` instead of `create`.

---

## Sharing the Game URL

The game URL is the access key — **only share it after participants have completed all advanced quizzes**.

Once you have the URL from the deploy script:

1. Open `docs-advanced/javascripts/quiz.js`
2. Find the line near the top:
   ```js
   var GAME_URL = 'https://your-app.example.appdomain.cloud';
   ```
3. Replace the placeholder with your actual Code Engine URL
4. Commit and push — the Quiz Progress page will now reveal the link to participants who have passed all available advanced quizzes

> **Security note:** Code Engine apps are publicly accessible by URL. Access control is through URL obscurity — don't publish the URL anywhere until participants have earned it.

---

## Game Controls

| Key | Action |
|-----|--------|
| `W` / `↑` | Thrust |
| `A` / `←` | Rotate left |
| `D` / `→` | Rotate right |
| `Space` | Fire / Start / Restart |

## Scoring

| Event | Points |
|-------|--------|
| Collect a Bobchestrate Coin | +50 |
| Destroy large asteroid | +20 |
| Destroy medium asteroid | +50 |
| Destroy small asteroid | +100 |

High score is saved in the player's browser `localStorage`.
