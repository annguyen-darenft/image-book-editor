"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import * as fabric from "fabric"
import { Button } from "@/components/ui/button"
import { Upload, Trash2, ChevronUp, ChevronDown, Download, ZoomIn, ZoomOut, RotateCcw, Eraser } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import Link from "next/link"

interface Layer {
  id: string
  name: string
  object: fabric.FabricImage
  visible: boolean
}

export function ImageEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null)
  const [layers, setLayers] = useState<Layer[]>([])
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return

    const container = containerRef.current
    const c = new fabric.Canvas(canvasRef.current, {
      width: container.clientWidth,
      height: container.clientHeight,
      backgroundColor: "#1a1a2e",
      selection: true,
      preserveObjectStacking: true,
    })

    c.on("selection:created", (e) => {
      const obj = e.selected?.[0]
      if (obj) {
        const layer = layers.find((l) => l.object === obj)
        if (layer) setSelectedLayerId(layer.id)
      }
    })

    c.on("selection:updated", (e) => {
      const obj = e.selected?.[0]
      if (obj) {
        const layer = layers.find((l) => l.object === obj)
        if (layer) setSelectedLayerId(layer.id)
      }
    })

    c.on("selection:cleared", () => {
      setSelectedLayerId(null)
    })

    setCanvas(c)

    const handleResize = () => {
      c.setDimensions({
        width: container.clientWidth,
        height: container.clientHeight,
      })
      c.renderAll()
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      c.dispose()
    }
  }, [])

  useEffect(() => {
    if (!canvas) return

    canvas.off("selection:created")
    canvas.off("selection:updated")
    canvas.off("selection:cleared")

    canvas.on("selection:created", (e) => {
      const obj = e.selected?.[0]
      if (obj) {
        const layer = layers.find((l) => l.object === obj)
        if (layer) setSelectedLayerId(layer.id)
      }
    })

    canvas.on("selection:updated", (e) => {
      const obj = e.selected?.[0]
      if (obj) {
        const layer = layers.find((l) => l.object === obj)
        if (layer) setSelectedLayerId(layer.id)
      }
    })

    canvas.on("selection:cleared", () => {
      setSelectedLayerId(null)
    })
  }, [canvas, layers])

  const handleUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!canvas || !e.target.files) return

      const files = Array.from(e.target.files)

      files.forEach((file, index) => {
        const reader = new FileReader()
        reader.onload = (event) => {
          const imgUrl = event.target?.result as string

          fabric.FabricImage.fromURL(imgUrl).then((img) => {
            const canvasWidth = canvas.getWidth()
            const canvasHeight = canvas.getHeight()

            const scale = Math.min(
              (canvasWidth * 0.6) / (img.width || 1),
              (canvasHeight * 0.6) / (img.height || 1)
            )

            img.scale(scale)
            img.set({
              left: canvasWidth / 2 - ((img.width || 0) * scale) / 2 + index * 20,
              top: canvasHeight / 2 - ((img.height || 0) * scale) / 2 + index * 20,
              cornerColor: "#00d4ff",
              cornerStrokeColor: "#00d4ff",
              cornerSize: 12,
              cornerStyle: "circle",
              transparentCorners: false,
              borderColor: "#00d4ff",
              borderScaleFactor: 2,
            })

            canvas.add(img)
            canvas.setActiveObject(img)
            canvas.renderAll()

            const layerId = `layer-${Date.now()}-${index}`
            const layerName = file.name.replace(/\.[^/.]+$/, "")

            setLayers((prev) => [
              ...prev,
              {
                id: layerId,
                name: layerName,
                object: img,
                visible: true,
              },
            ])
            setSelectedLayerId(layerId)
          })
        }
        reader.readAsDataURL(file)
      })

      e.target.value = ""
    },
    [canvas]
  )

  const deleteLayer = useCallback(
    (layerId: string) => {
      if (!canvas) return

      const layer = layers.find((l) => l.id === layerId)
      if (layer) {
        canvas.remove(layer.object)
        canvas.renderAll()
        setLayers((prev) => prev.filter((l) => l.id !== layerId))
        if (selectedLayerId === layerId) {
          setSelectedLayerId(null)
        }
      }
    },
    [canvas, layers, selectedLayerId]
  )

  const selectLayer = useCallback(
    (layerId: string) => {
      if (!canvas) return

      const layer = layers.find((l) => l.id === layerId)
      if (layer) {
        canvas.setActiveObject(layer.object)
        canvas.renderAll()
        setSelectedLayerId(layerId)
      }
    },
    [canvas, layers]
  )

  const moveLayer = useCallback(
    (layerId: string, direction: "up" | "down") => {
      if (!canvas) return

      const layerIndex = layers.findIndex((l) => l.id === layerId)
      if (layerIndex === -1) return

      const layer = layers[layerIndex]

      if (direction === "up" && layerIndex < layers.length - 1) {
        canvas.bringObjectForward(layer.object)
        canvas.renderAll()
        setLayers((prev) => {
          const newLayers = [...prev]
          const temp = newLayers[layerIndex]
          newLayers[layerIndex] = newLayers[layerIndex + 1]
          newLayers[layerIndex + 1] = temp
          return newLayers
        })
      } else if (direction === "down" && layerIndex > 0) {
        canvas.sendObjectBackwards(layer.object)
        canvas.renderAll()
        setLayers((prev) => {
          const newLayers = [...prev]
          const temp = newLayers[layerIndex]
          newLayers[layerIndex] = newLayers[layerIndex - 1]
          newLayers[layerIndex - 1] = temp
          return newLayers
        })
      }
    },
    [canvas, layers]
  )

  const toggleVisibility = useCallback(
    (layerId: string) => {
      if (!canvas) return

      const layer = layers.find((l) => l.id === layerId)
      if (layer) {
        layer.object.set("visible", !layer.object.visible)
        canvas.renderAll()
        setLayers((prev) =>
          prev.map((l) =>
            l.id === layerId ? { ...l, visible: !l.visible } : l
          )
        )
      }
    },
    [canvas, layers]
  )

  const handleZoom = useCallback(
    (delta: number) => {
      if (!canvas) return

      const newZoom = Math.max(0.1, Math.min(3, zoom + delta))
      canvas.setZoom(newZoom)
      canvas.renderAll()
      setZoom(newZoom)
    },
    [canvas, zoom]
  )

  const resetView = useCallback(() => {
    if (!canvas) return

    canvas.setZoom(1)
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0])
    canvas.renderAll()
    setZoom(1)
  }, [canvas])

  const exportCanvas = useCallback(() => {
    if (!canvas) return

    const dataURL = canvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 2,
    })

    const link = document.createElement("a")
    link.download = "canvas-export.png"
    link.href = dataURL
    link.click()
  }, [canvas])

  return (
    <div className="flex h-screen bg-[#0f0f1a]">
      <div className="w-72 border-r border-[#2a2a4a] bg-[#16162a] flex flex-col">
        <div className="p-4 border-b border-[#2a2a4a]">
          <h2 className="text-lg font-semibold text-white tracking-wide">Layers</h2>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {layers.length === 0 ? (
              <p className="text-[#6b6b8d] text-sm text-center py-8">
                No layers yet.<br />Upload images to start.
              </p>
            ) : (
              [...layers].reverse().map((layer, idx) => (
                <div
                  key={layer.id}
                  className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                    selectedLayerId === layer.id
                      ? "bg-[#00d4ff]/20 border border-[#00d4ff]/50"
                      : "hover:bg-[#2a2a4a] border border-transparent"
                  }`}
                  onClick={() => selectLayer(layer.id)}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleVisibility(layer.id)
                    }}
                    className={`w-6 h-6 flex-shrink-0 flex items-center justify-center rounded ${
                      layer.visible ? "text-[#00d4ff]" : "text-[#4a4a6a]"
                    }`}
                  >
                    {layer.visible ? "●" : "○"}
                  </button>

                  <span className="flex-1 text-sm text-white truncate max-w-[120px]" title={layer.name}>
                    {layer.name}
                  </span>

                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        moveLayer(layer.id, "up")
                      }}
                      className="p-1 hover:bg-[#3a3a5a] rounded"
                      disabled={idx === 0}
                    >
                      <ChevronUp className="w-4 h-4 text-[#8b8bab]" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        moveLayer(layer.id, "down")
                      }}
                      className="p-1 hover:bg-[#3a3a5a] rounded"
                      disabled={idx === layers.length - 1}
                    >
                      <ChevronDown className="w-4 h-4 text-[#8b8bab]" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteLayer(layer.id)
                      }}
                      className="p-1 hover:bg-red-500/20 rounded"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-[#2a2a4a]">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-gradient-to-r from-[#00d4ff] to-[#00ff88] text-black font-semibold hover:opacity-90"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Images
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="h-14 border-b border-[#2a2a4a] bg-[#16162a] flex items-center justify-between px-4">
          <h1 className="text-xl font-bold bg-gradient-to-r from-[#00d4ff] to-[#00ff88] bg-clip-text text-transparent">
            Image Editor
          </h1>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[#2a2a4a] rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleZoom(-0.1)}
                className="text-white hover:bg-[#3a3a5a]"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm text-white w-16 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleZoom(0.1)}
                className="text-white hover:bg-[#3a3a5a]"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={resetView}
              className="text-white hover:bg-[#3a3a5a]"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>

            <Button
              onClick={exportCanvas}
              className="bg-[#00d4ff] text-black font-semibold hover:bg-[#00d4ff]/80"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>

            <Link href="/remove-bg">
              <Button className="bg-[#00ff88] text-black font-semibold hover:bg-[#00ff88]/80">
                <Eraser className="w-4 h-4 mr-2" />
                Remove BG
              </Button>
            </Link>
          </div>
        </div>

        <div
          ref={containerRef}
          className="flex-1 overflow-hidden bg-[#0a0a14]"
          style={{
            backgroundImage: `
              linear-gradient(45deg, #1a1a2e 25%, transparent 25%),
              linear-gradient(-45deg, #1a1a2e 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, #1a1a2e 75%),
              linear-gradient(-45deg, transparent 75%, #1a1a2e 75%)
            `,
            backgroundSize: "20px 20px",
            backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
          }}
        >
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  )
}