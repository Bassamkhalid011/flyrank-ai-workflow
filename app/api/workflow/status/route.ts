import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const eventId = req.nextUrl.searchParams.get("eventId")
  if (!eventId) {
    return NextResponse.json({ error: "Missing eventId" }, { status: 400 })
  }
  return NextResponse.json({ eventId, status: "processing" })
}
