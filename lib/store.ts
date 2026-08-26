"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { addEdge, Connection, Edge, Node } from "@xyflow/react"

export type NodeStatus = "idle" | "running" | "done-yes" | "done-no" | "error"

export interface NodeData {
  label: string
  prompt: string
  status: NodeStatus
  result: null | "YES" | "NO"
  nodeNumber: number
  [key: string]: unknown
}

export interface LogEntry {
  timestamp: string
  message: string
  type: "info" | "success" | "error" | "warning"
}

export interface ExecutionRun {
  id: string
  timestamp: string
  visited: string[]
  results: Record<string, string>
  outcome: string
}

const DEFAULT_NODES: Node<NodeData>[] = [
  {
    id: "1",
    type: "decisionNode",
    position: { x: 400, y: 50 },
    data: {
      label: "Start",
      prompt: "Is this message a customer support request?",
      status: "idle",
      result: null,
      nodeNumber: 1,
    },
  },
  {
    id: "2",
    type: "decisionNode",
    position: { x: 200, y: 220 },
    data: {
      label: "Support",
      prompt: "Is this an urgent support request requiring immediate attention?",
      status: "idle",
      result: null,
      nodeNumber: 2,
    },
  },
  {
    id: "3",
    type: "decisionNode",
    position: { x: 600, y: 220 },
    data: {
      label: "Sales",
      prompt: "Is this a sales inquiry about pricing?",
      status: "idle",
      result: null,
      nodeNumber: 3,
    },
  },
  {
    id: "4",
    type: "decisionNode",
    position: { x: 100, y: 420 },
    data: {
      label: "Urgent Team",
      prompt: "Should this be escalated to the senior support team?",
      status: "idle",
      result: null,
      nodeNumber: 4,
    },
  },
  {
    id: "5",
    type: "decisionNode",
    position: { x: 350, y: 420 },
    data: {
      label: "Standard Queue",
      prompt: "Is the issue related to billing?",
      status: "idle",
      result: null,
      nodeNumber: 5,
    },
  },
]

const DEFAULT_EDGES: Edge[] = [
  { id: "e1-2", source: "1", target: "2", label: "YES", type: "yes", animated: false },
  { id: "e1-3", source: "1", target: "3", label: "NO", type: "no", animated: false },
  { id: "e2-4", source: "2", target: "4", label: "YES", type: "yes", animated: false },
  { id: "e2-5", source: "2", target: "5", label: "NO", type: "no", animated: false },
]

interface SavedWorkflow {
  name: string
  nodes: Node<NodeData>[]
  edges: Edge[]
  savedAt: string
}

interface WorkflowStore {
  nodes: Node<NodeData>[]
  edges: Edge[]
  executionLog: LogEntry[]
  executionHistory: ExecutionRun[]
  savedWorkflows: SavedWorkflow[]
  nodeCounter: number

  setNodes: (nodes: Node<NodeData>[] | ((prev: Node<NodeData>[]) => Node<NodeData>[])) => void
  setEdges: (edges: Edge[] | ((prev: Edge[]) => Edge[])) => void
  addNode: (position: { x: number; y: number }) => void
  deleteNode: (id: string) => void
  updateNodeData: (id: string, data: Partial<NodeData>) => void
  updateNodeStatus: (id: string, status: NodeStatus, result?: "YES" | "NO" | null) => void
  addEdgeConnection: (connection: Connection, label: "YES" | "NO") => void
  addLog: (message: string, type?: LogEntry["type"]) => void
  clearExecution: () => void
  saveWorkflow: (name: string) => void
  loadWorkflow: (name: string) => void
  deleteWorkflow: (name: string) => void
  addExecutionRun: (run: Omit<ExecutionRun, "id">) => void
  importWorkflow: (data: { nodes: Node<NodeData>[]; edges: Edge[] }) => void
}

export const useWorkflowStore = create<WorkflowStore>()(
  persist(
    (set, get) => ({
      nodes: DEFAULT_NODES,
      edges: DEFAULT_EDGES,
      executionLog: [],
      executionHistory: [],
      savedWorkflows: [],
      nodeCounter: DEFAULT_NODES.length,

      setNodes: (nodes) =>
        set((state) => ({
          nodes: typeof nodes === "function" ? nodes(state.nodes) : nodes,
        })),

      setEdges: (edges) =>
        set((state) => ({
          edges: typeof edges === "function" ? edges(state.edges) : edges,
        })),

      addNode: (position) => {
        const counter = get().nodeCounter + 1
        const newNode: Node<NodeData> = {
          id: String(Date.now()),
          type: "decisionNode",
          position,
          data: {
            label: `Node ${counter}`,
            prompt: "",
            status: "idle",
            result: null,
            nodeNumber: counter,
          },
        }
        set((state) => ({
          nodes: [...state.nodes, newNode],
          nodeCounter: counter,
        }))
      },

      deleteNode: (id) =>
        set((state) => ({
          nodes: state.nodes.filter((n) => n.id !== id),
          edges: state.edges.filter((e) => e.source !== id && e.target !== id),
        })),

      updateNodeData: (id, data) =>
        set((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === id ? { ...n, data: { ...n.data, ...data } } : n
          ),
        })),

      updateNodeStatus: (id, status, result = null) =>
        set((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === id ? { ...n, data: { ...n.data, status, result } } : n
          ),
        })),

      addEdgeConnection: (connection, label) =>
        set((state) => ({
          edges: addEdge(
            {
              ...connection,
              label,
              type: label.toLowerCase(),
              animated: false,
              id: `e${connection.source}-${connection.target}-${label}`,
            },
            state.edges
          ),
        })),

      addLog: (message, type = "info") =>
        set((state) => ({
          executionLog: [
            ...state.executionLog,
            {
              timestamp: new Date().toLocaleTimeString(),
              message,
              type,
            },
          ],
        })),

      clearExecution: () =>
        set((state) => ({
          nodes: state.nodes.map((n) => ({
            ...n,
            data: { ...n.data, status: "idle" as NodeStatus, result: null },
          })),
          edges: state.edges.map((e) => ({ ...e, animated: false })),
          executionLog: [],
        })),

      saveWorkflow: (name) => {
        const { nodes, edges, savedWorkflows } = get()
        const existing = savedWorkflows.findIndex((w) => w.name === name)
        const workflow: SavedWorkflow = { name, nodes, edges, savedAt: new Date().toISOString() }
        if (existing >= 0) {
          const updated = [...savedWorkflows]
          updated[existing] = workflow
          set({ savedWorkflows: updated })
        } else {
          set({ savedWorkflows: [...savedWorkflows, workflow] })
        }
      },

      loadWorkflow: (name) => {
        const { savedWorkflows } = get()
        const workflow = savedWorkflows.find((w) => w.name === name)
        if (workflow) {
          set({ nodes: workflow.nodes, edges: workflow.edges, executionLog: [] })
        }
      },

      deleteWorkflow: (name) =>
        set((state) => ({
          savedWorkflows: state.savedWorkflows.filter((w) => w.name !== name),
        })),

      addExecutionRun: (run) =>
        set((state) => ({
          executionHistory: [
            { ...run, id: String(Date.now()) },
            ...state.executionHistory.slice(0, 4),
          ],
        })),

      importWorkflow: (data) =>
        set({ nodes: data.nodes, edges: data.edges, executionLog: [] }),
    }),
    {
      name: "ai-workflow-storage",
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        savedWorkflows: state.savedWorkflows,
        executionHistory: state.executionHistory,
        nodeCounter: state.nodeCounter,
      }),
    }
  )
)
