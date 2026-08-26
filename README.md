# AI Workflow Builder

A visual AI workflow system where each node represents an AI decision step that returns either YES or NO. The workflow execution runs through Inngest while the frontend visualizes the flow using React Flow.

## What it does

- Drag-and-drop visual workflow editor with decision nodes
- Each node sends a prompt to GPT-4o-mini and gets back YES or NO
- Workflow branches based on the AI decision
- Real-time visual feedback — nodes animate while running
- Save/load workflows, export/import JSON, execution history

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Copy `.env.local` and fill in your OpenAI key:

```
OPENAI_API_KEY=sk-...
INNGEST_EVENT_KEY=local
INNGEST_SIGNING_KEY=local
```

### 3. Run the dev server

```bash
npm run dev
```

### 4. Run the Inngest dev server (separate terminal)

```bash
npx inngest-cli@latest dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Required env vars

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | Your OpenAI API key |
| `INNGEST_EVENT_KEY` | Use `local` for development |
| `INNGEST_SIGNING_KEY` | Use `local` for development |

## Usage

1. **Add nodes** — click "+ Add Node" to add decision nodes
2. **Edit prompts** — click a node to select it, then edit the prompt in the textarea
3. **Connect nodes** — drag from a YES/NO handle to another node's input; choose YES or NO path
4. **Run workflow** — click "▶ Run Workflow" to execute; watch nodes animate
5. **View logs** — the right panel shows execution logs and history
6. **Save/Load** — save named workflows to localStorage; reload them anytime
7. **Export/Import** — download/upload workflow JSON files
8. **Retry** — right-click an error node to retry from that point
