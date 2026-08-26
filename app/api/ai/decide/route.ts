import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1"
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2"

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json()

    // Ollama exposes an OpenAI-compatible API at /v1
    const client = new OpenAI({
      baseURL: OLLAMA_BASE_URL,
      apiKey: "ollama", // required by the SDK but ignored by Ollama
    })

    const response = await client.chat.completions.create({
      model: OLLAMA_MODEL,
      messages: [
        {
          role: "system",
          content: "You are a decision engine. Answer only YES or NO. Nothing else. No explanation.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0,
    })

    const text = response.choices[0]?.message?.content?.trim().toUpperCase() || "NO"
    const result = text.includes("YES") ? "YES" : "NO"

    return NextResponse.json({ result })
  } catch (err) {
    console.error("Ollama error:", err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
