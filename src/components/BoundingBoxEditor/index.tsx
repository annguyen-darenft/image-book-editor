"use client"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Plus, Trash2, Copy } from "lucide-react"

interface BoundingBox {
  id: string
  object: string
  x: number
  y: number
  width: number
  height: number
}

interface DetectObject {
  name: string
  description: string
}

type ResizeHandle = "tl" | "tr" | "bl" | "br" | "t" | "r" | "b" | "l" | null

export function BoundingBoxEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [boundingBoxes, setBoundingBoxes] = useState<BoundingBox[]>([])
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null)
  const [objects, setObjects] = useState<DetectObject[]>([])
  const [isDetecting, setIsDetecting] = useState(false)
  
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle>(null)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [boxStart, setBoxStart] = useState({ x: 0, y: 0, width: 0, height: 0 })

  useEffect(() => {
    if (!canvasRef.current || !imageRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const img = imageRef.current

    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0)

    boundingBoxes.forEach((box) => {
      const isSelected = box.id === selectedBoxId

      ctx.strokeStyle = isSelected ? "#00ff88" : "#00d4ff"
      ctx.lineWidth = isSelected ? 3 : 2
      ctx.strokeRect(box.x, box.y, box.width, box.height)

      ctx.fillStyle = isSelected ? "#00ff88" : "#00d4ff"
      const label = box.object
      ctx.font = "14px sans-serif"
      const textMetrics = ctx.measureText(label)
      const padding = 4
      ctx.fillRect(
        box.x,
        box.y - 20,
        textMetrics.width + padding * 2,
        20
      )

      ctx.fillStyle = "#000"
      ctx.fillText(label, box.x + padding, box.y - 6)

      if (isSelected) {
        const handleSize = 8
        ctx.fillStyle = "#00ff88"
        
        ctx.fillRect(box.x - handleSize / 2, box.y - handleSize / 2, handleSize, handleSize)
        ctx.fillRect(box.x + box.width - handleSize / 2, box.y - handleSize / 2, handleSize, handleSize)
        ctx.fillRect(box.x - handleSize / 2, box.y + box.height - handleSize / 2, handleSize, handleSize)
        ctx.fillRect(box.x + box.width - handleSize / 2, box.y + box.height - handleSize / 2, handleSize, handleSize)
        
        ctx.fillRect(box.x + box.width / 2 - handleSize / 2, box.y - handleSize / 2, handleSize, handleSize)
        ctx.fillRect(box.x + box.width - handleSize / 2, box.y + box.height / 2 - handleSize / 2, handleSize, handleSize)
        ctx.fillRect(box.x + box.width / 2 - handleSize / 2, box.y + box.height - handleSize / 2, handleSize, handleSize)
        ctx.fillRect(box.x - handleSize / 2, box.y + box.height / 2 - handleSize / 2, handleSize, handleSize)
      }
    })
  }, [uploadedImage, boundingBoxes, selectedBoxId])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        imageRef.current = img
        setUploadedImage(event.target?.result as string)
        setBoundingBoxes([])
        setSelectedBoxId(null)
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleDetectBoundingBoxes = async () => {
    if (!uploadedImage || objects.length === 0) return

    setIsDetecting(true)
    try {
      const blob = await fetch(uploadedImage).then((r) => r.blob())
      const formData = new FormData()
      formData.append("file", blob, "image.png")
      formData.append("objects", JSON.stringify(objects))

      const response = await fetch(
        "http://14.224.161.49/api/image/detect-bounding-boxes",
        {
          method: "POST",
          body: formData,
        }
      )

      if (!response.ok) {
        throw new Error("Failed to detect bounding boxes")
      }

      const data = await response.json()
      
      const boxes: BoundingBox[] = data.boundingBoxes.map((item: any, index: number) => ({
        id: `box-${Date.now()}-${index}`,
        object: item.object,
        x: item.position.x,
        y: item.position.y,
        width: item.size.w,
        height: item.size.h,
      }))

      setBoundingBoxes(boxes)
    } catch (error) {
      console.error("Error detecting bounding boxes:", error)
      alert("Failed to detect bounding boxes. Please try again.")
    } finally {
      setIsDetecting(false)
    }
  }

  const addObject = () => {
    setObjects([...objects, { name: "", description: "" }])
  }

  const updateObject = (index: number, field: "name" | "description", value: string) => {
    const newObjects = [...objects]
    newObjects[index][field] = value
    setObjects(newObjects)
  }

  const deleteObject = (index: number) => {
    setObjects(objects.filter((_, i) => i !== index))
  }

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const getResizeHandle = (x: number, y: number, box: BoundingBox): ResizeHandle => {
    const handleSize = 12
    const half = handleSize / 2

    if (Math.abs(x - box.x) < half && Math.abs(y - box.y) < half) return "tl"
    if (Math.abs(x - (box.x + box.width)) < half && Math.abs(y - box.y) < half) return "tr"
    if (Math.abs(x - box.x) < half && Math.abs(y - (box.y + box.height)) < half) return "bl"
    if (Math.abs(x - (box.x + box.width)) < half && Math.abs(y - (box.y + box.height)) < half) return "br"

    if (Math.abs(x - (box.x + box.width / 2)) < half && Math.abs(y - box.y) < half) return "t"
    if (Math.abs(x - (box.x + box.width)) < half && Math.abs(y - (box.y + box.height / 2)) < half) return "r"
    if (Math.abs(x - (box.x + box.width / 2)) < half && Math.abs(y - (box.y + box.height)) < half) return "b"
    if (Math.abs(x - box.x) < half && Math.abs(y - (box.y + box.height / 2)) < half) return "l"

    return null
  }

  const isInsideBox = (x: number, y: number, box: BoundingBox) => {
    return x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height
  }

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoordinates(e)

    if (selectedBoxId) {
      const selectedBox = boundingBoxes.find((b) => b.id === selectedBoxId)
      if (selectedBox) {
        const handle = getResizeHandle(x, y, selectedBox)
        if (handle) {
          setIsResizing(true)
          setResizeHandle(handle)
          setDragStart({ x, y })
          setBoxStart({ x: selectedBox.x, y: selectedBox.y, width: selectedBox.width, height: selectedBox.height })
          return
        }
      }
    }

    for (let i = boundingBoxes.length - 1; i >= 0; i--) {
      const box = boundingBoxes[i]
      if (isInsideBox(x, y, box)) {
        setSelectedBoxId(box.id)
        setIsDragging(true)
        setDragStart({ x, y })
        setBoxStart({ x: box.x, y: box.y, width: box.width, height: box.height })
        return
      }
    }

    setSelectedBoxId(null)
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoordinates(e)

    if (isResizing && selectedBoxId && resizeHandle) {
      const dx = x - dragStart.x
      const dy = y - dragStart.y

      setBoundingBoxes((boxes) =>
        boxes.map((box) => {
          if (box.id !== selectedBoxId) return box

          let newX = boxStart.x
          let newY = boxStart.y
          let newWidth = boxStart.width
          let newHeight = boxStart.height

          switch (resizeHandle) {
            case "tl":
              newX = boxStart.x + dx
              newY = boxStart.y + dy
              newWidth = boxStart.width - dx
              newHeight = boxStart.height - dy
              break
            case "tr":
              newY = boxStart.y + dy
              newWidth = boxStart.width + dx
              newHeight = boxStart.height - dy
              break
            case "bl":
              newX = boxStart.x + dx
              newWidth = boxStart.width - dx
              newHeight = boxStart.height + dy
              break
            case "br":
              newWidth = boxStart.width + dx
              newHeight = boxStart.height + dy
              break
            case "t":
              newY = boxStart.y + dy
              newHeight = boxStart.height - dy
              break
            case "r":
              newWidth = boxStart.width + dx
              break
            case "b":
              newHeight = boxStart.height + dy
              break
            case "l":
              newX = boxStart.x + dx
              newWidth = boxStart.width - dx
              break
          }

          if (newWidth < 20) {
            newWidth = 20
            if (resizeHandle?.includes("l")) newX = box.x + box.width - 20
          }
          if (newHeight < 20) {
            newHeight = 20
            if (resizeHandle?.includes("t")) newY = box.y + box.height - 20
          }

          return { ...box, x: newX, y: newY, width: newWidth, height: newHeight }
        })
      )
    } else if (isDragging && selectedBoxId) {
      const dx = x - dragStart.x
      const dy = y - dragStart.y

      setBoundingBoxes((boxes) =>
        boxes.map((box) =>
          box.id === selectedBoxId
            ? { ...box, x: boxStart.x + dx, y: boxStart.y + dy }
            : box
        )
      )
    } else if (selectedBoxId) {
      const selectedBox = boundingBoxes.find((b) => b.id === selectedBoxId)
      if (selectedBox) {
        const handle = getResizeHandle(x, y, selectedBox)
        if (handle) {
          const cursorMap: Record<string, string> = {
            tl: "nwse-resize",
            tr: "nesw-resize",
            bl: "nesw-resize",
            br: "nwse-resize",
            t: "ns-resize",
            r: "ew-resize",
            b: "ns-resize",
            l: "ew-resize",
          }
          if (canvasRef.current) {
            canvasRef.current.style.cursor = cursorMap[handle]
          }
          return
        }
      }
    }

    if (canvasRef.current) {
      canvasRef.current.style.cursor = "default"
    }
  }

  const handleCanvasMouseUp = () => {
    setIsDragging(false)
    setIsResizing(false)
    setResizeHandle(null)
  }

    const deleteSelectedBox = () => {
      if (selectedBoxId) {
        setBoundingBoxes(boundingBoxes.filter((box) => box.id !== selectedBoxId))
        setSelectedBoxId(null)
      }
    }

    const copyBoundingBoxesJSON = () => {
      const formattedData = boundingBoxes.map((box) => ({
        object: box.object,
        position: { x: box.x, y: box.y },
        size: { w: box.width, h: box.height },
      }))
      const jsonData = JSON.stringify(formattedData)
      navigator.clipboard.writeText(jsonData)
      alert("Bounding boxes JSON copied to clipboard!")
    }

  return (
    <div className="flex h-screen bg-[#0f0f1a]">
      <div className="w-80 border-r border-[#2a2a4a] bg-[#16162a] p-4 overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-4">Bounding Box Editor</h2>

        <div className="mb-6">
          <Label htmlFor="image-upload" className="text-white mb-2 block">
            Upload Image
          </Label>
          <Input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="bg-[#2a2a4a] border-[#3a3a5a] text-white"
          />
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-white">Objects to Detect</Label>
            <Button
              size="sm"
              onClick={addObject}
              className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/80"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-3">
            {objects.map((obj, index) => (
              <div key={index} className="bg-[#2a2a4a] p-3 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Object name"
                    value={obj.name}
                    onChange={(e) => updateObject(index, "name", e.target.value)}
                    className="bg-[#1a1a2e] border-[#3a3a5a] text-white"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteObject(index)}
                    className="text-red-400 hover:bg-red-400/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <Input
                  placeholder="Description (optional)"
                  value={obj.description}
                  onChange={(e) => updateObject(index, "description", e.target.value)}
                  className="bg-[#1a1a2e] border-[#3a3a5a] text-white"
                />
              </div>
            ))}
          </div>
        </div>

        <Button
          onClick={handleDetectBoundingBoxes}
          disabled={!uploadedImage || objects.length === 0 || isDetecting}
          className="w-full bg-[#00ff88] text-black font-semibold hover:bg-[#00ff88]/80 mb-4"
        >
          {isDetecting ? "Detecting..." : "Detect Bounding Boxes"}
        </Button>

        {boundingBoxes.length > 0 && (
          <div>
            <Label className="text-white mb-2 block">Detected Boxes</Label>
            <div className="space-y-2">
              {boundingBoxes.map((box) => (
                <div
                  key={box.id}
                  onClick={() => setSelectedBoxId(box.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedBoxId === box.id
                      ? "bg-[#00ff88] text-black"
                      : "bg-[#2a2a4a] text-white hover:bg-[#3a3a5a]"
                  }`}
                >
                  <div className="font-semibold">{box.object}</div>
                  <div className="text-sm opacity-70">
                    Position: ({Math.round(box.x)}, {Math.round(box.y)})
                  </div>
                  <div className="text-sm opacity-70">
                    Size: {Math.round(box.width)} × {Math.round(box.height)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

          {boundingBoxes.length > 0 && (
            <Button
              onClick={copyBoundingBoxesJSON}
              className="w-full mt-4 bg-[#00d4ff] text-black hover:bg-[#00d4ff]/80"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy JSON
            </Button>
          )}

          {selectedBoxId && (
            <Button
              onClick={deleteSelectedBox}
              className="w-full mt-4 bg-red-500 text-white hover:bg-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected Box
            </Button>
          )}
      </div>

      <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
        {uploadedImage ? (
          <div className="relative">
            <canvas
              ref={canvasRef}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              className="max-w-full max-h-full border border-[#3a3a5a] rounded-lg shadow-2xl"
              style={{ cursor: "default" }}
            />
            <div className="absolute top-4 right-4 bg-[#16162a] px-3 py-2 rounded-lg text-white text-sm">
              Click boxes to select • Drag to move • Drag handles to resize
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-400">
            <Upload className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Upload an image to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}
