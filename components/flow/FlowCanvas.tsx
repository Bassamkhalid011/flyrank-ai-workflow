"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Connection,
  useReactFlow,
  BackgroundVariant,
  Panel,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import { useWorkflowStore, NodeData } from "@/lib/store"
import { getStartNode } from "@/lib/workflow"
import DecisionNode from "./DecisionNode"
import { edgeTypes } from "./EdgeTypes"
import { LogPanel } from "./LogPanel"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nodeTypes: any = { decisionNode: DecisionNode }

interface EdgeDialogState {
  open: boolean
  connection: Connection | null
}

interface ContextMenuState {
  open: boolean
  nodeId: string | null
  x: number
  y: number
}

export default function FlowCanvas() {
  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    addNode,
    addEdgeConnection,
    updateNodeStatus,
    addLog,
    clearExecution,
    saveWorkflow,
    loadWorkflow,
    deleteWorkflow,
    savedWorkflows,
    addExecutionRun,
    importWorkflow,
  } = useWorkflowStore()

  const { screenToFlowPosition } = useReactFlow()
  const [running, setRunning] = useState(false)
  const [logOpen, setLogOpen] = useState(true)
  const [edgeDialog, setEdgeDialog] = useState<EdgeDialogState>({ open: false, connection: null })
  const [saveDialog, setSaveDialog] = useState(false)
  const [loadDialog, setLoadDialog] = useState(false)
  const [workflowName, setWorkflowName] = useState("")
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ open: false, nodeId: null, x: 0, y: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      setContextMenu({ open: true, nodeId: detail.nodeId, x: detail.x, y: detail.y })
    }
    window.addEventListener("node-context-menu", handler)
    return () => window.removeEventListener("node-context-menu", handler)
  }, [])

  useEffect(() => {
    const close = () => setContextMenu((m) => ({ ...m, open: false }))
    window.addEventListener("click", close)
    return () => window.removeEventListener("click", close)
  }, [])

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdgeDialog({ open: true, connection })
    },
    []
  )

  const handleEdgeChoice = useCallback(
    (label: "YES" | "NO") => {
      if (edgeDialog.connection) {
        addEdgeConnection(edgeDialog.connection, label)
      }
      setEdgeDialog({ open: false, connection: null })
    },
    [edgeDialog, addEdgeConnection]
  )

  async function runWorkflow(startId?: string) {
    if (running) return
    setRunning(true)
    clearExecution()
    addLog("Starting workflow execution...", "info")

    const startNode = startId
      ? nodes.find((n) => n.id === startId)
      : getStartNode(nodes, edges)

    if (!startNode) {
      addLog("No start node found", "error")
      setRunning(false)
      return
    }

    addLog(`Starting from node: ${startNode.data.label}`, "info")

    try {
      // Fire-and-forget Inngest event (optional — requires Inngest dev server)
      fetch("/api/workflow/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes, edges, startNodeId: startNode.id }),
      }).catch(() => {}) // ignore if Inngest not running

      await simulateExecution(startNode.id)
    } catch (err) {
      addLog(`Error: ${err}`, "error")
    }

    setRunning(false)
  }

  async function simulateExecution(startNodeId: string) {
    const visited: string[] = []
    const results: Record<string, string> = {}
    let currentId = startNodeId

    while (currentId) {
      const currentNode = nodes.find((n) => n.id === currentId)
      if (!currentNode) break

      visited.push(currentId)
      updateNodeStatus(currentId, "running")
      addLog(`Node "${currentNode.data.label}" started`, "info")

      // Animate incoming edge
      setEdges((eds) =>
        eds.map((e) =>
          e.target === currentId ? { ...e, animated: true } : { ...e, animated: false }
        )
      )

      try {
        const res = await fetch("/api/ai/decide", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: currentNode.data.prompt }),
        })

        const data = await res.json()
        const decision: "YES" | "NO" = data.result === "YES" ? "YES" : "NO"

        results[currentId] = decision
        updateNodeStatus(currentId, decision === "YES" ? "done-yes" : "done-no", decision)
        addLog(`Node "${currentNode.data.label}" returned ${decision}`, "success")

        const matchingEdge = edges.find(
          (e) => e.source === currentId && e.label === decision
        )

        // Animate active edge
        setEdges((eds) =>
          eds.map((e) =>
            e.id === matchingEdge?.id ? { ...e, animated: true } : { ...e, animated: false }
          )
        )

        if (!matchingEdge) {
          addLog(`Workflow stopped — no matching edge from "${currentNode.data.label}"`, "warning")
          break
        }

        const nextNode = nodes.find((n) => n.id === matchingEdge.target)
        if (!nextNode) break

        addLog(`Following ${decision} edge to "${nextNode.data.label}"`, "info")

        if (visited.includes(matchingEdge.target)) {
          addLog(`Cycle detected at "${nextNode.data.label}" — stopping`, "warning")
          break
        }

        await new Promise((r) => setTimeout(r, 500))
        currentId = matchingEdge.target
      } catch (err) {
        updateNodeStatus(currentId, "error")
        addLog(`Error in node "${currentNode.data.label}": ${err}`, "error")
        break
      }
    }

    setEdges((eds) => eds.map((e) => ({ ...e, animated: false })))
    addLog("Workflow complete", "success")

    addExecutionRun({
      timestamp: new Date().toLocaleString(),
      visited,
      results,
      outcome: "completed",
    })
  }

  function handleAddNode() {
    const center = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
    addNode(center)
  }

  function handleExport() {
    const data = JSON.stringify({ nodes, edges }, null, 2)
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "workflow.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        importWorkflow(data)
        addLog("Workflow imported successfully", "success")
      } catch {
        addLog("Failed to import workflow — invalid JSON", "error")
      }
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
      {/* Main canvas */}
      <div className="flex-1 relative">

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={(changes) => {
            setNodes((nds) => {
              const updated = [...nds]
              changes.forEach((change) => {
                if (change.type === "position" && change.position) {
                  const idx = updated.findIndex((n) => n.id === change.id)
                  if (idx >= 0) updated[idx] = { ...updated[idx], position: change.position }
                }
                if (change.type === "select") {
                  const idx = updated.findIndex((n) => n.id === change.id)
                  if (idx >= 0) updated[idx] = { ...updated[idx], selected: change.selected }
                }
              })
              return updated
            })
          }}
          onEdgesChange={(changes) => {
            setEdges((eds) => {
              const updated = [...eds]
              changes.forEach((change) => {
                if (change.type === "remove") {
                  const idx = updated.findIndex((e) => e.id === change.id)
                  if (idx >= 0) updated.splice(idx, 1)
                }
              })
              return updated
            })
          }}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          className="bg-zinc-950"
          defaultEdgeOptions={{ type: "yes" }}
        >
          <Background variant={BackgroundVariant.Dots} color="#3f3f46" gap={20} size={1} />
          <Controls className="!bg-zinc-900 !border-zinc-700" />
          <MiniMap
            className="!bg-zinc-900 !border-zinc-700"
            nodeColor={(n) => {
              const d = n.data as NodeData
              if (d.status === "done-yes") return "#22c55e"
              if (d.status === "done-no") return "#ef4444"
              if (d.status === "running") return "#eab308"
              if (d.status === "error") return "#b91c1c"
              return "#52525b"
            }}
          />

          {/* Top-left toolbar */}
          <Panel position="top-left">
            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                variant="outline"
                className="bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-white"
                onClick={handleAddNode}
              >
                + Add Node
              </Button>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-white text-xs"
                  onClick={() => setSaveDialog(true)}
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-white text-xs"
                  onClick={() => setLoadDialog(true)}
                >
                  Load
                </Button>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-white text-xs"
                  onClick={handleExport}
                >
                  Export
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-white text-xs"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Import
                </Button>
                <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
              </div>
            </div>
          </Panel>

          {/* Top-right toolbar */}
          <Panel position="top-right">
            <div className="flex gap-2 items-center">
              <Button
                size="sm"
                variant="ghost"
                className="text-zinc-400 hover:text-white"
                onClick={() => setLogOpen((o) => !o)}
              >
                {logOpen ? "Hide Logs" : "Show Logs"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-white"
                onClick={clearExecution}
                disabled={running}
              >
                Reset
              </Button>
              <Button
                size="sm"
                className={`font-semibold ${running ? "bg-yellow-600 hover:bg-yellow-700" : "bg-blue-600 hover:bg-blue-700"}`}
                onClick={() => runWorkflow()}
                disabled={running}
              >
                {running ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-white rounded-full animate-bounce" />
                    Running...
                  </span>
                ) : (
                  "▶ Run Workflow"
                )}
              </Button>
            </div>
          </Panel>

          {/* Node count badge */}
          <Panel position="bottom-left">
            <Badge variant="outline" className="text-zinc-500 border-zinc-700 bg-zinc-900/50">
              {nodes.length} nodes · {edges.length} edges
            </Badge>
          </Panel>
        </ReactFlow>
      </div>

      {/* Log panel */}
      {logOpen && (
        <div className="w-80 flex flex-col border-l border-zinc-800">
          <LogPanel />
        </div>
      )}

      {/* Edge type dialog */}
      <Dialog open={edgeDialog.open} onOpenChange={(o) => !o && setEdgeDialog({ open: false, connection: null })}>
        <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-sm">Which path is this?</DialogTitle>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 font-bold"
              onClick={() => handleEdgeChoice("YES")}
            >
              YES
            </Button>
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700 font-bold"
              onClick={() => handleEdgeChoice("NO")}
            >
              NO
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save dialog */}
      <Dialog open={saveDialog} onOpenChange={setSaveDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-sm">Save Workflow</DialogTitle>
          </DialogHeader>
          <Input
            className="bg-zinc-800 border-zinc-700 text-white"
            placeholder="Workflow name..."
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && workflowName) {
                saveWorkflow(workflowName)
                setSaveDialog(false)
                setWorkflowName("")
              }
            }}
          />
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => {
              if (workflowName) {
                saveWorkflow(workflowName)
                setSaveDialog(false)
                setWorkflowName("")
              }
            }}
          >
            Save
          </Button>
        </DialogContent>
      </Dialog>

      {/* Load dialog */}
      <Dialog open={loadDialog} onOpenChange={setLoadDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-sm">Load Workflow</DialogTitle>
          </DialogHeader>
          {savedWorkflows.length === 0 ? (
            <p className="text-zinc-500 text-sm">No saved workflows.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {savedWorkflows.map((w) => (
                <div key={w.name} className="flex items-center justify-between bg-zinc-800 rounded px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{w.name}</p>
                    <p className="text-xs text-zinc-500">{new Date(w.savedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs border-zinc-600 hover:bg-zinc-700"
                      onClick={() => { loadWorkflow(w.name); setLoadDialog(false) }}
                    >
                      Load
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs text-red-400 hover:text-red-300"
                      onClick={() => deleteWorkflow(w.name)}
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Context menu for retry */}
      {contextMenu.open && (
        <div
          className="fixed z-50 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl py-1 min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            className="w-full text-left px-4 py-2 text-sm text-yellow-400 hover:bg-zinc-800"
            onClick={() => {
              if (contextMenu.nodeId) {
                runWorkflow(contextMenu.nodeId)
              }
              setContextMenu((m) => ({ ...m, open: false }))
            }}
          >
            ↺ Retry from here
          </button>
        </div>
      )}
    </div>
  )
}
