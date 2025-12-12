"use client"

import { Button } from "@/components/ui/button"
import { Plus, ChevronUp, ChevronDown, X } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PageData } from "./types"

interface PagesSidebarProps {
  pages: PageData[]
  currentPageIndex: number
  onAddPage: () => void
  onDeletePage: (index: number) => void
  onSwitchPage: (index: number) => void
  onPreviousPage: () => void
  onNextPage: () => void
}

export function PagesSidebar({
  pages,
  currentPageIndex,
  onAddPage,
  onDeletePage,
  onSwitchPage,
  onPreviousPage,
  onNextPage,
}: PagesSidebarProps) {
  return (
    <div className="w-48 border-r border-[#2a2a4a] bg-[#16162a] flex flex-col">
      <div className="p-3 border-b border-[#2a2a4a] flex items-center justify-between">
        <span className="text-sm font-semibold text-white">Pages</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddPage}
          className="h-6 w-6 p-0 text-[#00d4ff] hover:bg-[#2a2a4a]"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex items-center justify-center gap-1 p-2 border-b border-[#2a2a4a]">
        <Button
          variant="ghost"
          size="sm"
          onClick={onPreviousPage}
          disabled={currentPageIndex === 0}
          className="h-6 w-6 p-0 text-white hover:bg-[#2a2a4a] disabled:opacity-30"
        >
          <ChevronUp className="w-4 h-4" />
        </Button>
        <span className="text-white text-xs font-medium">
          {currentPageIndex + 1}/{pages.length}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onNextPage}
          disabled={currentPageIndex >= pages.length - 1}
          className="h-6 w-6 p-0 text-white hover:bg-[#2a2a4a] disabled:opacity-30"
        >
          <ChevronDown className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 max-h-[calc(100vh-160px)]">
        <div className="flex flex-col gap-2 p-2">
          {pages.map((page, idx) => (
            <div
              key={page.id}
              onClick={() => onSwitchPage(idx)}
              className={`relative w-full aspect-square rounded cursor-pointer border-2 transition-all group ${
                idx === currentPageIndex
                  ? "border-[#00d4ff]"
                  : "border-[#2a2a4a] hover:border-[#4a4a6a]"
              }`}
            >
              {page.thumbnail ? (
                <img
                  src={page.thumbnail}
                  alt={page.name}
                  className="w-full h-full object-cover rounded"
                />
              ) : (
                <div className="w-full h-full bg-[#1a1a2e] rounded flex items-center justify-center">
                  <span className="text-[#4a4a6a] text-xs">{idx + 1}</span>
                </div>
              )}
              {pages.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeletePage(idx)
                  }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
