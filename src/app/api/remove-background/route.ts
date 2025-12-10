import { NextRequest, NextResponse } from "next/server"
import sharp from "sharp"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("image") as File | null

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

    // Track which pixels to remove and their distance from non-white pixels
    const toRemove = new Uint8Array(width * height)
    const distance = new Float32Array(width * height).fill(Infinity)

    const isWhite = (idx: number) => {
      const r = pixels[idx * 4]
      const g = pixels[idx * 4 + 1]
      const b = pixels[idx * 4 + 2]
      return r > threshold && g > threshold && b > threshold
    }

    // Calculate how "white" a pixel is (0 = not white, 1 = fully white)
    const getWhiteness = (idx: number) => {
      const r = pixels[idx * 4]
      const g = pixels[idx * 4 + 1]
      const b = pixels[idx * 4 + 2]
      const minVal = Math.min(r, g, b)
      if (minVal < threshold) return 0
      return (minVal - threshold) / (255 - threshold)
    }

    // BFS flood fill from edges
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

    // Start flood fill from all edge pixels
    for (let x = 0; x < width; x++) {
      floodFill(x, 0)
      floodFill(x, height - 1)
    }
    for (let y = 0; y < height; y++) {
      floodFill(0, y)
      floodFill(width - 1, y)
    }

    // Calculate distance from each background pixel to nearest foreground pixel
    // Using a simple BFS from foreground pixels
    const queue: number[] = []
    
    // Initialize: foreground pixels have distance 0
    for (let i = 0; i < width * height; i++) {
      if (!toRemove[i]) {
        distance[i] = 0
        queue.push(i)
      }
    }

    // BFS to calculate distances
    let head = 0
    while (head < queue.length) {
      const idx = queue[head++]
      const x = idx % width
      const y = Math.floor(idx / width)
      const currentDist = distance[idx]

      const neighbors = [
        x > 0 ? idx - 1 : -1,
        x < width - 1 ? idx + 1 : -1,
        y > 0 ? idx - width : -1,
        y < height - 1 ? idx + width : -1,
        // Diagonal neighbors for smoother edges
        x > 0 && y > 0 ? idx - width - 1 : -1,
        x < width - 1 && y > 0 ? idx - width + 1 : -1,
        x > 0 && y < height - 1 ? idx + width - 1 : -1,
        x < width - 1 && y < height - 1 ? idx + width + 1 : -1,
      ]

      for (const nIdx of neighbors) {
        if (nIdx === -1) continue
        const diagDist = (nIdx === idx - width - 1 || nIdx === idx - width + 1 || 
                          nIdx === idx + width - 1 || nIdx === idx + width + 1) ? 1.414 : 1
        const newDist = currentDist + diagDist
        if (newDist < distance[nIdx]) {
          distance[nIdx] = newDist
          queue.push(nIdx)
        }
      }
    }

    // Apply smooth alpha based on distance and whiteness
    const featherRadius = 2.5 // Pixels to feather over

    for (let i = 0; i < width * height; i++) {
      if (toRemove[i]) {
        const dist = distance[i]
        const whiteness = getWhiteness(i)
        
        if (dist <= featherRadius) {
          // Smooth transition zone - use distance-based alpha
          const t = dist / featherRadius
          // Use smooth step function for better transition
          const smoothT = t * t * (3 - 2 * t)
          const alpha = Math.round((1 - smoothT) * pixels[i * 4 + 3])
          pixels[i * 4 + 3] = Math.max(0, Math.min(255, alpha))
        } else {
          // Fully transparent
          pixels[i * 4 + 3] = 0
        }
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