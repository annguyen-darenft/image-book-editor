import { NextRequest, NextResponse } from "next/server"

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

    const externalFormData = new FormData()
    externalFormData.append("file", file)
    externalFormData.append("objects", objectsStr)

    const response = await fetch(
      "https://image-edit-api.nft2scan.com/api/image/detect-bounding-boxes",
      {
        method: "POST",
        body: externalFormData,
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: "External API request failed", details: errorData },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error detecting bounding boxes:", error)
    return NextResponse.json(
      { error: "Failed to detect bounding boxes", details: String(error) },
      { status: 500 }
    )
  }
}