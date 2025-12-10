import { NextRequest, NextResponse } from "next/server"
import sharp from "sharp"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("image") as File | null
    const tolerance = parseInt(formData.get("tolerance") as string) || 30

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const inputBuffer = Buffer.from(arrayBuffer)

    const { data, info } = await sharp(inputBuffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })

    const { width, height } = info
    const pixels = new Uint8Array(data)
    const threshold = 240

    // Đánh dấu pixel nào cần xóa
    const toRemove = new Uint8Array(width * height)

    const isWhite = (idx: number) => {
      const r = pixels[idx * 4]
      const g = pixels[idx * 4 + 1]
      const b = pixels[idx * 4 + 2]
      return r > threshold && g > threshold && b > threshold
    }

    // BFS flood fill từ 1 điểm
    const floodFill = (startX: number, startY: number) => {
      const stack: number[] = [startY * width + startX]

      while (stack.length > 0) {
        const idx = stack.pop()!

        if (toRemove[idx]) continue
        if (!isWhite(idx)) continue

        toRemove[idx] = 1

        const x = idx % width
        const y = Math.floor(idx / width)

        if (x > 0) stack.push(idx - 1)
        if (x < width - 1) stack.push(idx + 1)
        if (y > 0) stack.push(idx - width)
        if (y < height - 1) stack.push(idx + width)
      }
    }

    // Bắt đầu flood fill từ tất cả các pixel ở 4 cạnh
    for (let x = 0; x < width; x++) {
      floodFill(x, 0)          // Cạnh trên
      floodFill(x, height - 1) // Cạnh dưới
    }
    for (let y = 0; y < height; y++) {
      floodFill(0, y)          // Cạnh trái
      floodFill(width - 1, y)  // Cạnh phải
    }

    // Xóa những pixel đã đánh dấu
    for (let i = 0; i < toRemove.length; i++) {
      if (toRemove[i]) {
        pixels[i * 4 + 3] = 0 // Set alpha = 0
      }
    }

    const outputBuffer = await sharp(Buffer.from(pixels), {
      raw: {
        width,
        height,
        channels: 4,
      },
    })
      .png()
      .toBuffer()

    return new NextResponse(outputBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": 'attachment; filename="transparent.png"',
      },
    })
  } catch (error) {
    console.error("Error processing image:", error)
    return NextResponse.json(
      { error: "Failed to process image" },
      { status: 500 }
    )
  }
}
