import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

interface BoundingBoxObject {
  name: string
  description: string
}

interface BoundingBoxResult {
  object: string
  position: {
    x: number
    y: number
  }
  size: {
    w: number
    h: number
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const objectsStr = formData.get("objects") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!objectsStr) {
      return NextResponse.json(
        { error: "No objects provided" },
        { status: 400 }
      )
    }

    let objects: BoundingBoxObject[]
    try {
      objects = JSON.parse(objectsStr)
      if (!Array.isArray(objects)) {
        throw new Error("Objects must be an array")
      }
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid objects JSON format" },
        { status: 400 }
      )
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      )
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

    const arrayBuffer = await file.arrayBuffer()
    const base64Image = Buffer.from(arrayBuffer).toString("base64")

    const image = {
      inlineData: {
        data: base64Image,
        mimeType: file.type,
      },
    }

    const objectDescriptions = objects
      .map((obj) => `- ${obj.name}: ${obj.description}`)
      .join("\n")

    const prompt = `Detect the following objects in this image and return their bounding box coordinates:

${objectDescriptions}

Return ONLY a valid JSON array of bounding boxes. Each bounding box must have this exact format:
{
  "label": "object name",
  "box_2d": [y_min, x_min, y_max, x_max]
}

The coordinates should be normalized to a 1000x1000 scale. Do not include any markdown formatting, explanations, or additional text. Return ONLY the JSON array.`

    const result = await model.generateContent([prompt, image])
    const response = result.response
    let text = response.text()

    text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()

    let detectedObjects: Array<{
      label: string
      box_2d: [number, number, number, number]
    }>

    try {
      detectedObjects = JSON.parse(text)
    } catch (error) {
      console.error("Failed to parse Gemini response:", text)
      return NextResponse.json(
        { error: "Failed to parse AI response", details: text },
        { status: 500 }
      )
    }

    const img = new Image()
    const imageLoadPromise = new Promise<{ width: number; height: number }>(
      (resolve, reject) => {
        img.onload = () => resolve({ width: img.width, height: img.height })
        img.onerror = reject
      }
    )

    img.src = `data:${file.type};base64,${base64Image}`
    const { width: imageWidth, height: imageHeight } = await imageLoadPromise

    const boundingBoxes: BoundingBoxResult[] = detectedObjects.map((obj) => {
      const [yMin, xMin, yMax, xMax] = obj.box_2d

      const x = Math.round((xMin / 1000) * imageWidth)
      const y = Math.round((yMin / 1000) * imageHeight)
      const w = Math.round(((xMax - xMin) / 1000) * imageWidth)
      const h = Math.round(((yMax - yMin) / 1000) * imageHeight)

      return {
        object: obj.label,
        position: { x, y },
        size: { w, h },
      }
    })

    return NextResponse.json({
      boundingBoxes,
      totalDetected: boundingBoxes.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error detecting bounding boxes:", error)
    return NextResponse.json(
      { error: "Failed to detect bounding boxes", details: String(error) },
      { status: 500 }
    )
  }
}
