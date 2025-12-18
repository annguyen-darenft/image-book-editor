"use client"

import { RefObject } from "react"
import { Upload, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DbImageObject } from "./types"

interface CanvasAreaProps {
  containerRef: RefObject<HTMLDivElement | null>
  canvasRef: RefObject<HTMLCanvasElement | null>
  currentPageObjects: DbImageObject[]
  onUploadClick?: () => void
  isUploading?: boolean
}

export function CanvasArea({ 
  containerRef, 
  canvasRef, 
  currentPageObjects, 
  onUploadClick,
  isUploading = false,
}: CanvasAreaProps) {
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
      
      {isUploading && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center z-50 transition-all">
          <div className="bg-[#16162a] border border-[#00d4ff]/30 p-6 rounded-xl shadow-2xl flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-[#00d4ff]/20 animate-pulse" />
              <Loader2 className="w-12 h-12 text-[#00d4ff] animate-spin absolute inset-0" />
            </div>
            <div className="text-center">
              <p className="text-white font-medium">Processing Image...</p>
              <p className="text-xs text-[#6b6b8d] mt-1">Fitting to canvas size</p>
            </div>
          </div>
        </div>
      )}

      {!hasObjects && !isUploading && (
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
