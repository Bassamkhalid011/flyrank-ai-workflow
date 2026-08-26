"use client"

import { EdgeProps, getBezierPath, EdgeLabelRenderer, BaseEdge } from "@xyflow/react"

function YesEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, animated }: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: "#22c55e",
          strokeWidth: 2,
          strokeDasharray: animated ? "6 3" : undefined,
          animation: animated ? "dashdraw 0.5s linear infinite" : undefined,
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)` }}
          className="absolute pointer-events-none"
        >
          <span className="text-[10px] font-bold text-green-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-green-600">
            YES
          </span>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

function NoEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, animated }: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: "#ef4444",
          strokeWidth: 2,
          strokeDasharray: animated ? "6 3" : undefined,
          animation: animated ? "dashdraw 0.5s linear infinite" : undefined,
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)` }}
          className="absolute pointer-events-none"
        >
          <span className="text-[10px] font-bold text-red-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-red-600">
            NO
          </span>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

export const edgeTypes = {
  yes: YesEdge,
  no: NoEdge,
}
