"use client"

import { Button } from "@/components/ui/button"
import { Download, ZoomIn, ZoomOut, RotateCcw, LayoutGrid, BookOpen } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LayoutPreset, LAYOUT_PRESETS } from "./types"

interface HeaderProps {
  currentLayout: LayoutPreset | null
  zoom: number
  onApplyLayout: (preset: LayoutPreset) => void
  onZoom: (delta: number) => void
  onResetView: () => void
  onExportCanvas: () => void
  onExportAllPages: () => void
}

export function Header({
  currentLayout,
  zoom,
  onApplyLayout,
  onZoom,
  onResetView,
  onExportCanvas,
  onExportAllPages,
}: HeaderProps) {
  return (
    <div className="h-14 border-b border-[#2a2a4a] bg-[#16162a] flex items-center justify-between px-4">
      <h1 className="text-xl font-bold bg-gradient-to-r from-[#00d4ff] to-[#00ff88] bg-clip-text text-transparent">
        Image Book Editor
      </h1>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-[#3a3a5a] gap-2"
            >
              <LayoutGrid className="w-4 h-4" />
              {currentLayout ? currentLayout.name : "Layout"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[#16162a] border-[#2a2a4a]">
            {LAYOUT_PRESETS.map((preset) => (
              <DropdownMenuItem
                key={preset.name}
                onClick={() => onApplyLayout(preset)}
                className="text-white hover:bg-[#2a2a4a] focus:bg-[#2a2a4a] cursor-pointer"
              >
                {preset.name} ({preset.width}×{preset.height})
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-1 bg-[#2a2a4a] rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onZoom(-0.1)}
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
            onClick={() => onZoom(0.1)}
            className="text-white hover:bg-[#3a3a5a]"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onResetView}
          className="text-white hover:bg-[#3a3a5a]"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>

        <Button
          onClick={onExportCanvas}
          className="bg-[#00d4ff] text-black font-semibold hover:bg-[#00d4ff]/80"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Page
        </Button>

        <Button
          onClick={onExportAllPages}
          className="bg-[#ff6b00] text-white font-semibold hover:bg-[#ff6b00]/80"
        >
          <BookOpen className="w-4 h-4 mr-2" />
          Export Book
        </Button>
      </div>
    </div>
  )
}
