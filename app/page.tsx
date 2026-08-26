import { ReactFlowProvider } from "@xyflow/react"
import FlowCanvas from "@/components/flow/FlowCanvas"

export default function Home() {
  return (
    <ReactFlowProvider>
      <FlowCanvas />
    </ReactFlowProvider>
  )
}
