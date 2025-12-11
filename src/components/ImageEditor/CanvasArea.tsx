"use client"

import { RefObject } from "react"

interface CanvasAreaProps {
  containerRef: RefObject<HTMLDivElement | null>
  canvasRef: RefObject<HTMLCanvasElement | null>
}

export function CanvasArea({ containerRef, canvasRef }: CanvasAreaProps) {
  return (
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
  )
}
