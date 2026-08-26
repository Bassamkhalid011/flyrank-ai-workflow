import { Inngest } from "inngest"
import OpenAI from "openai"

export const inngest = new Inngest({ id: "ai-workflow" })

interface WorkflowNode {
  id: string
  data: { label: string; prompt: string; status: string; result: string | null }
  position: { x: number; y: number }
  type: string
}

interface WorkflowEdge {
  id: string
  source: string
  target: string
  label: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const executeWorkflow = (inngest as any).createFunction(
  { id: "execute-workflow", event: "workflow/execute" },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ event, step }: { event: Record<string, any>; step: Record<string, any> }) => {
    const { nodes, edges, startNodeId } = event.data as {
      nodes: WorkflowNode[]
      edges: WorkflowEdge[]
      startNodeId: string
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const nodeMap = new Map(nodes.map((n: WorkflowNode) => [n.id, n]))
    let currentNodeId = startNodeId || nodes[0]?.id
    const visited: string[] = []
    const results: Record<string, string> = {}

    while (currentNodeId) {
      const currentNode = nodeMap.get(currentNodeId)
      if (!currentNode) break

      visited.push(currentNodeId)

      await inngest.send({
        name: "workflow/node.started",
        data: { nodeId: currentNodeId, label: currentNode.data.label },
      })

      const result = await step.run(`node-${currentNodeId}`, async () => {
        try {
          const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: "You are a decision engine. Answer only YES or NO. Nothing else. No explanation.",
              },
              { role: "user", content: currentNode.data.prompt },
            ],
            max_tokens: 5,
            temperature: 0,
          })

          const text = response.choices[0]?.message?.content?.trim().toUpperCase() || "NO"
          const decision = text.includes("YES") ? "YES" : "NO"

          await inngest.send({
            name: "workflow/node.completed",
            data: { nodeId: currentNodeId, label: currentNode.data.label, result: decision },
          })

          return { nodeId: currentNodeId, result: decision, success: true }
        } catch (err) {
          await inngest.send({
            name: "workflow/node.error",
            data: { nodeId: currentNodeId, label: currentNode.data.label, error: String(err) },
          })
          return { nodeId: currentNodeId, result: "NO", success: false, error: String(err) }
        }
      })

      results[currentNodeId] = result.result

      const matchingEdge = edges.find(
        (e: WorkflowEdge) => e.source === currentNodeId && e.label === result.result
      )

      if (!matchingEdge) {
        await inngest.send({
          name: "workflow/completed",
          data: { visited, results, stoppedAt: currentNodeId, reason: "no-matching-edge" },
        })
        break
      }

      currentNodeId = matchingEdge.target

      if (visited.includes(currentNodeId)) {
        await inngest.send({
          name: "workflow/completed",
          data: { visited, results, stoppedAt: currentNodeId, reason: "cycle-detected" },
        })
        break
      }
    }

    return { visited, results }
  }
)
