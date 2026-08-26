"use client"

import { memo, useState, useRef, useEffect } from "react"
import { Handle, Position, NodeProps, Node } from "@xyflow/react"
import { NodeData, NodeStatus, useWorkflowStore } from "@/lib/store"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"

type DecisionNodeType = Node<NodeData>

function StatusBadge({ status }: { status: NodeStatus }) {
  if (status === "idle") return <Badge variant="secondary" className="text-xs">Idle</Badge>
  if (status === "running")
    return <Badge className="text-xs bg-yellow-500 text-black animate-pulse">Running...</Badge>
  if (status === "done-yes") return <Badge className="text-xs bg-green-500">✓ YES</Badge>
  if (status === "done-no") return <Badge className="text-xs bg-red-500">✗ NO</Badge>
  if (status === "error") return <Badge className="text-xs bg-red-700">⚠ Error</Badge>
  return null
}

function borderClass(status: NodeStatus) {
  if (status === "running") return "border-yellow-400 shadow-yellow-400/50 shadow-lg animate-pulse"
  if (status === "done-yes") return "border-green-500 shadow-green-500/50 shadow-lg"
  if (status === "done-no") return "border-red-500 shadow-red-500/50 shadow-lg"
  if (status === "error") return "border-red-700 shadow-red-700/50 shadow-lg"
  return "border-zinc-700"
}

function DecisionNode({ id, data, selected }: NodeProps<DecisionNodeType>) {
  const { updateNodeData, deleteNode } = useWorkflowStore()
  const [editingLabel, setEditingLabel] = useState(false)
  const labelRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingLabel) labelRef.current?.focus()
  }, [editingLabel])

  const status = data.status as NodeStatus
  const label = data.label as string
  const prompt = data.prompt as string
  const nodeNumber = data.nodeNumber as number

  const promptPreview = prompt?.length > 50 ? prompt.slice(0, 50) + "…" : prompt

  return (
    <div
      className={`relative min-w-[220px] max-w-[260px] rounded-xl bg-zinc-900 border-2 transition-all duration-300 ${borderClass(status)}`}
      onContextMenu={(e) => {
        if (status === "error") {
          e.preventDefault()
          const event = new CustomEvent("node-context-menu", { detail: { nodeId: id, x: e.clientX, y: e.clientY } })
          window.dispatchEvent(event)
        }
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-zinc-500 !w-3 !h-3" />

      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-400 bg-zinc-800 rounded-full w-5 h-5 flex items-center justify-center">
            {nodeNumber}
          </span>
          {editingLabel ? (
            <input
              ref={labelRef}
              className="text-sm font-semibold bg-transparent text-white border-b border-zinc-500 outline-none w-28"
              value={label}
              onChange={(e) => updateNodeData(id, { label: e.target.value })}
              onBlur={() => setEditingLabel(false)}
              onKeyDown={(e) => e.key === "Enter" && setEditingLabel(false)}
            />
          ) : (
            <span
              className="text-sm font-semibold text-white cursor-pointer hover:text-zinc-300"
              onDoubleClick={() => setEditingLabel(true)}
            >
              {label || "Untitled"}
            </span>
          )}
        </div>
        <button
          className="text-zinc-500 hover:text-red-400 text-xs font-bold w-5 h-5 flex items-center justify-center rounded hover:bg-zinc-800"
          onClick={() => deleteNode(id)}
        >
          ✕
        </button>
      </div>

      <div className="px-3 pb-1">
        <StatusBadge status={status} />
      </div>

      <div className="px-3 pb-3">
        {selected ? (
          <Textarea
            className="text-xs bg-zinc-800 border-zinc-700 text-zinc-200 resize-none h-20 focus:border-zinc-500"
            placeholder="Enter decision prompt..."
            value={prompt}
            onChange={(e) => updateNodeData(id, { prompt: e.target.value })}
          />
        ) : (
          <p className="text-xs text-zinc-400 leading-relaxed min-h-[2rem]">
            {promptPreview || <span className="italic text-zinc-600">Click to add prompt...</span>}
          </p>
        )}
      </div>

      <div className="absolute -bottom-6 left-6 flex flex-col items-center">
        <span className="text-[9px] font-bold text-green-400 mb-0.5">YES</span>
        <Handle
          type="source"
          position={Position.Bottom}
          id="yes"
          className="!bg-green-500 !w-3 !h-3"
        />
      </div>

      <div className="absolute -bottom-6 right-6 flex flex-col items-center">
        <span className="text-[9px] font-bold text-red-400 mb-0.5">NO</span>
        <Handle
          type="source"
          position={Position.Bottom}
          id="no"
          className="!bg-red-500 !w-3 !h-3"
        />
      </div>
    </div>
  )
}

export default memo(DecisionNode)
