# AI Workflow Builder

A visual AI workflow system where each node represents an AI decision step that returns either YES or NO. The workflow execution runs through Inngest while the frontend visualizes the flow using React Flow. Runs **100% locally** using Ollama — no paid API needed.

## What it does

- Drag-and-drop visual workflow editor with decision nodes
- Each node sends a prompt to a local LLM (via Ollama) and gets back YES or NO
- Workflow branches based on the AI decision
- Real-time visual feedback — nodes animate while running
- Save/load workflows, export/import JSON, execution history

## Tech stack

- **Next.js 14** (App Router)
- **React Flow** (@xyflow/react) — visual canvas
- **Inngest** — workflow execution engine
- **Ollama** — local LLM inference (free, no API key needed)
- **Zustand** — graph state management
- **Shadcn/ui + Tailwind CSS** — UI components

## Getting started

### 1. Install Ollama

Download from **https://ollama.com** and install it.

### 2. Pull a model (one-time, ~2GB)

```bash
ollama pull llama3.2
```

> Want something smaller? Try `ollama pull mistral` and update `OLLAMA_MODEL` in `.env.local`.

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

The defaults in `.env.local` work out of the box with Ollama:

```
OLLAMA_BASE_URL=http://localhost:11434/v1
OLLAMA_MODEL=llama3.2
INNGEST_EVENT_KEY=local
INNGEST_SIGNING_KEY=local
```

### 5. Run the dev server

```bash
npm run dev
```

### 6. (Optional) Run the Inngest dev server

In a separate terminal:

```bash
npx inngest-cli@latest dev
```

Open **http://localhost:3000** — the demo workflow loads automatically.

## Usage

1. **Add nodes** — click "+ Add Node"
2. **Edit prompts** — click a node to select it, then edit the prompt
3. **Connect nodes** — drag from a YES/NO handle to another node; choose YES or NO path
4. **Run workflow** — click "▶ Run Workflow" and watch nodes animate
5. **View logs** — right panel shows execution logs and history
6. **Save/Load** — save named workflows to localStorage
7. **Export/Import** — download/upload workflow JSON files
8. **Retry** — right-click an error node to retry from that point

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `OLLAMA_BASE_URL` | `http://localhost:11434/v1` | Ollama API endpoint |
| `OLLAMA_MODEL` | `llama3.2` | Model to use for decisions |
| `INNGEST_EVENT_KEY` | `local` | Use `local` for development |
| `INNGEST_SIGNING_KEY` | `local` | Use `local` for development |
