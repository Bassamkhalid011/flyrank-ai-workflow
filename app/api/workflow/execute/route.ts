import { NextRequest, NextResponse } from "next/server"
import { inngest } from "@/lib/inngest"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { nodes, edges, startNodeId } = body

    if (!nodes || !edges) {
      return NextResponse.json({ error: "Missing nodes or edges" }, { status: 400 })
    }

    const events = await inngest.send({
      name: "workflow/execute",
      data: { nodes, edges, startNodeId },
    })

    return NextResponse.json({ eventId: events.ids[0] })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
