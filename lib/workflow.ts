import { Node, Edge } from "@xyflow/react"
import { NodeData } from "./store"

export function getStartNode(nodes: Node<NodeData>[], edges: Edge[]): Node<NodeData> | undefined {
  const targetIds = new Set(edges.map((e) => e.target))
  return nodes.find((n) => !targetIds.has(n.id)) || nodes[0]
}

export function getNextNode(
  currentId: string,
  result: "YES" | "NO",
  edges: Edge[],
  nodes: Node<NodeData>[]
): Node<NodeData> | undefined {
  const edge = edges.find((e) => e.source === currentId && e.label === result)
  if (!edge) return undefined
  return nodes.find((n) => n.id === edge.target)
}

export function exportWorkflow(nodes: Node<NodeData>[], edges: Edge[]): void {
  const data = JSON.stringify({ nodes, edges }, null, 2)
  const blob = new Blob([data], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "workflow.json"
  a.click()
  URL.revokeObjectURL(url)
}
