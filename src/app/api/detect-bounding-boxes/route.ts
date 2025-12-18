import { NextRequest, NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"
import sharp from "sharp"

interface ReplaceableObject {
  title: string
  description: string | null
  type: string
}

interface BoundingBoxResult {
  label: string
  type: "object" | "cover"
  box_2d: [number, number, number, number]
}

interface TransformedBoundingBox {
  title: string
  type: string
  size: {
    h: number
    w: number
  }
  position: {
    x: number
    y: number
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get("image") as File | null
    const objectsJson = formData.get("objects") as string | null

    if (!imageFile) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    if (!objectsJson) {
      return NextResponse.json({ error: "No objects provided" }, { status: 400 })
    }

    const objects: ReplaceableObject[] = JSON.parse(objectsJson)

    if (objects.length === 0) {
      return NextResponse.json({ error: "Objects array is empty" }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 })
    }

    const arrayBuffer = await imageFile.arrayBuffer()
    const imageBuffer = Buffer.from(arrayBuffer)
    const base64Image = imageBuffer.toString("base64")
    const mimeType = imageFile.type || "image/jpeg"

    const metadata = await sharp(imageBuffer).metadata()
    const imageWidth = metadata.width || 1000
    const imageHeight = metadata.height || 1000

    const objectsList = objects
      .map((obj, idx) => `- ${idx + 1}: ${obj.title}. Mô tả: ${obj.description || "Không có"}. Thuộc loại ${obj.type}`)
      .join("\n")

    const prompt = `Hãy phân tích tệp hình ảnh gốc.
Nhiệm vụ 1: xác định khung hình chữ nhật bao quanh (bounding box) cho các đối tượng chính:
${objectsList}
Yêu cầu về bounding box: phải bao bọc 'khít' nhất có thể, nhưng phải chứa toàn bộ các yếu tố sau:
- Toàn bộ cơ thể của nhân vật.
- Bóng đổ của nhân vật đó trên mặt đất.
- Các đối tượng vừa chắn lên nhân vật nhưng cũng vừa bị một phần nhân vật che lên (ví dụ đang ôm quả bóng, tay phải che lên quả bóng nhưng bóng che lên tay trái)
Nhiệm vụ 2: xác định bounding box của các vật thể tiền cảnh đang chắn lên bất kì bộ phận nào của các nhân vật trên.
Yêu cầu về bounding box cho vật thể tiền cảnh: phải chứa toàn bộ ảnh của vật thể tiền cảnh đó.
YÊU CẦU TỐI QUAN TRỌNG: Trả về kết quả là một mảng JSON theo cấu trúc sau:
[
 {
  "label": "Tên object đó (nếu object là đối tượng chính) hoặc tên của vật thể tiền cảnh",
  "type": "'object' nếu đó là đối tượng, 'cover' nếu là vật thể tiền cảnh",
  "box_2d": [y_min, x_min, y_max, x_max]
 }
]
Lưu ý:
- Tọa độ box_2d phải là số nguyên trong khoảng [0, 1000] (normalized coordinates).`

    const ai = new GoogleGenAI({ apiKey })

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Image,
              },
            },
            { text: prompt },
          ],
        },
      ],
      config: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    })

    const text = response.text || ""
    
    let rawBoxes: BoundingBoxResult[]
    try {
      rawBoxes = JSON.parse(text)
    } catch {
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        rawBoxes = JSON.parse(jsonMatch[0])
      } else {
        return NextResponse.json({ error: "Failed to parse AI response", raw: text }, { status: 500 })
      }
    }

    const boundingBoxes: TransformedBoundingBox[] = rawBoxes.map((box) => {
      const [yMin, xMin, yMax, xMax] = box.box_2d
      
      const x = Math.round((xMin / 1000) * imageWidth)
      const y = Math.round((yMin / 1000) * imageHeight)
      const w = Math.round(((xMax - xMin) / 1000) * imageWidth)
      const h = Math.round(((yMax - yMin) / 1000) * imageHeight)

      return {
        title: box.label,
        type: box.type,
        size: { h, w },
        position: { x, y },
      }
    })

    return NextResponse.json({ boundingBoxes })
  } catch (error) {
    console.error("Error detecting bounding boxes:", error)
    return NextResponse.json(
      { error: "Failed to detect bounding boxes", details: String(error) },
      { status: 500 }
    )
  }
}
