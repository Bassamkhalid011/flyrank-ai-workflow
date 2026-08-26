"use client"

import { useEffect, useRef, useState } from "react"
import { useWorkflowStore } from "@/lib/store"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"

export function LogPanel() {
  const { executionLog, clearExecution, executionHistory, nodes } = useWorkflowStore()
  const [tab, setTab] = useState<"log" | "history">("log")
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [executionLog])

  function typeColor(type: string) {
    if (type === "success") return "text-green-400"
    if (type === "error") return "text-red-400"
    if (type === "warning") return "text-yellow-400"
    return "text-zinc-300"
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-l border-zinc-800">
      {/* Tabs */}
      <div className="flex border-b border-zinc-800">
        <button
          className={`flex-1 py-2 text-xs font-semibold ${tab === "log" ? "text-white border-b-2 border-blue-500" : "text-zinc-500 hover:text-zinc-300"}`}
          onClick={() => setTab("log")}
        >
          Execution Log
        </button>
        <button
          className={`flex-1 py-2 text-xs font-semibold ${tab === "history" ? "text-white border-b-2 border-blue-500" : "text-zinc-500 hover:text-zinc-300"}`}
          onClick={() => setTab("history")}
        >
          History ({executionHistory.length})
        </button>
      </div>

      {tab === "log" && (
        <>
          <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
            <span className="text-xs text-zinc-500">{executionLog.length} entries</span>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-6 text-zinc-500 hover:text-white"
              onClick={clearExecution}
            >
              Clear
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-1 font-mono text-xs">
              {executionLog.length === 0 ? (
                <p className="text-zinc-600 italic">No logs yet. Run a workflow to see execution details.</p>
              ) : (
                executionLog.map((entry, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-zinc-600 shrink-0">{entry.timestamp}</span>
                    <span className={typeColor(entry.type)}>{entry.message}</span>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>
        </>
      )}

      {tab === "history" && (
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            {executionHistory.length === 0 ? (
              <p className="text-zinc-600 italic text-xs">No execution history yet.</p>
            ) : (
              executionHistory.map((run) => {
                const nodeLabels = run.visited.map((id) => {
                  const n = nodes.find((node) => node.id === id)
                  return n?.data.label || id
                })
                return (
                  <div key={run.id} className="bg-zinc-900 rounded-lg p-3 border border-zinc-800">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs text-zinc-400">{run.timestamp}</span>
                      <span className={`text-xs font-semibold ${run.outcome === "completed" ? "text-green-400" : "text-yellow-400"}`}>
                        {run.outcome}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300">
                      Path: {nodeLabels.join(" → ")}
                    </p>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
