"use client"

import { RefObject } from "react"
import { Button } from "@/components/ui/button"
import { Upload, Image, Layers } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DbImageObject } from "./types"

interface ObjectsSidebarProps {
  objects: DbImageObject[]
  selectedObjectId: string | null
  fileInputRef: RefObject<HTMLInputElement | null>
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSelectObject: (objectId: string) => void
}

export function ObjectsSidebar({
  objects,
  selectedObjectId,
  fileInputRef,
  onUpload,
  onSelectObject,
}: ObjectsSidebarProps) {
  const sortedObjects = [...objects].sort((a, b) => b.z_index - a.z_index)

  return (
    <div className="w-64 border-l border-[#2a2a4a] bg-[#16162a] flex flex-col">
      <div className="p-4 border-b border-[#2a2a4a] flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white tracking-wide">Objects</h2>
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
          {objects.length === 0 ? (
            <p className="text-[#6b6b8d] text-sm text-center py-8">
              No objects yet.<br />Upload images to start.
            </p>
          ) : (
            sortedObjects.map((obj) => (
              <div
                key={obj.id}
                className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                  selectedObjectId === obj.id
                    ? "bg-[#00d4ff]/20 border border-[#00d4ff]/50"
                    : "hover:bg-[#2a2a4a] border border-transparent"
                }`}
                onClick={() => onSelectObject(obj.id)}
              >
                <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded text-[#00d4ff]">
                  {obj.type === "background" ? (
                    <Image className="w-4 h-4" />
                  ) : (
                    <Layers className="w-4 h-4" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <span
                    className="text-sm text-white truncate block"
                    title={obj.title || obj.type}
                  >
                    {obj.title || obj.type}
                  </span>
                  <span className="text-xs text-[#6b6b8d]">
                    z: {obj.z_index} • {obj.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
