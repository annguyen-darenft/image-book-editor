"use client"

import { RefObject } from "react"
import { Button } from "@/components/ui/button"
import { Upload, Trash2, ChevronUp, ChevronDown } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Layer } from "./types"

interface LayersSidebarProps {
  layers: Layer[]
  selectedLayerId: string | null
  fileInputRef: RefObject<HTMLInputElement | null>
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSelectLayer: (layerId: string) => void
  onDeleteLayer: (layerId: string) => void
  onMoveLayer: (layerId: string, direction: "up" | "down") => void
  onToggleVisibility: (layerId: string) => void
}

export function LayersSidebar({
  layers,
  selectedLayerId,
  fileInputRef,
  onUpload,
  onSelectLayer,
  onDeleteLayer,
  onMoveLayer,
  onToggleVisibility,
}: LayersSidebarProps) {
  return (
    <div className="w-64 border-l border-[#2a2a4a] bg-[#16162a] flex flex-col">
      <div className="p-4 border-b border-[#2a2a4a] flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white tracking-wide">Layers</h2>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={onUpload}
          className="hidden"
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          size="sm"
          className="h-8 bg-gradient-to-r from-[#00d4ff] to-[#00ff88] text-black font-semibold hover:opacity-90 text-xs px-3"
        >
          <Upload className="w-3 h-3 mr-1" />
          Upload
        </Button>
      </div>

      <ScrollArea className="flex-1 max-h-[calc(100vh-390px)]">
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
                onClick={() => onSelectLayer(layer.id)}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleVisibility(layer.id)
                  }}
                  className={`w-6 h-6 flex-shrink-0 flex items-center justify-center rounded ${
                    layer.visible ? "text-[#00d4ff]" : "text-[#4a4a6a]"
                  }`}
                >
                  {layer.visible ? "●" : "○"}
                </button>

                <span
                  className="flex-1 text-sm text-white truncate max-w-[100px]"
                  title={layer.name}
                >
                  {layer.name}
                </span>

                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onMoveLayer(layer.id, "up")
                    }}
                    className="p-1 hover:bg-[#3a3a5a] rounded"
                    disabled={idx === 0}
                  >
                    <ChevronUp className="w-4 h-4 text-[#8b8bab]" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onMoveLayer(layer.id, "down")
                    }}
                    className="p-1 hover:bg-[#3a3a5a] rounded"
                    disabled={idx === layers.length - 1}
                  >
                    <ChevronDown className="w-4 h-4 text-[#8b8bab]" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteLayer(layer.id)
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
    </div>
  )
}
