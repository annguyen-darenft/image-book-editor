"use client"

import { RefObject } from "react"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DbImageObject } from "./types"

interface CanvasAreaProps {
  containerRef: RefObject<HTMLDivElement | null>
  canvasRef: RefObject<HTMLCanvasElement | null>
  currentPageObjects: DbImageObject[]
  onUploadClick?: () => void
}

export function CanvasArea({ containerRef, canvasRef, currentPageObjects, onUploadClick }: CanvasAreaProps) {
  const hasObjects = currentPageObjects.length > 0

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-hidden bg-[#0a0a14] relative"
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
      {!hasObjects && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto">
            <Button
              onClick={onUploadClick}
              className="bg-[#00d4ff] hover:bg-[#00b8e6] text-[#0a0a14] font-semibold px-6 py-3 rounded-lg flex items-center gap-2"
            >
              <Upload className="w-5 h-5" />
              Upload Image
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
