import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey || apiKey === "your_key") {
    return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
  }

  try {
    const { prompt } = await req.json()

    const openai = new OpenAI({ apiKey })

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a decision engine. Answer only YES or NO. Nothing else. No explanation.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 5,
      temperature: 0,
    })

    const text = response.choices[0]?.message?.content?.trim().toUpperCase() || "NO"
    const result = text.includes("YES") ? "YES" : "NO"

    return NextResponse.json({ result })
  } catch (err) {
    console.error("OpenAI error:", err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
