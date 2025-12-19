"use client";

import { Square, Trash2, Hand } from "lucide-react";

interface ToolsBarProps {
  isDrawingMode: boolean;
  onToggleDrawingMode: () => void;
  onClearAllBoundingBoxes: () => void;
  hasBoundingBoxes: boolean;
}

export function ToolsBar({
  isDrawingMode,
  onToggleDrawingMode,
  onClearAllBoundingBoxes,
  hasBoundingBoxes,
}: ToolsBarProps) {
  return (
    <div className="h-10 bg-[#16162a] border-b border-[#2a2a4a] flex items-center px-3 gap-2">
      <div className="flex items-center gap-2 border-r border-[#2a2a4a] pr-3">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          Tools
        </span>
      </div>

      <button
        onClick={onToggleDrawingMode}
        className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
          isDrawingMode
            ? "bg-[#00ff88] text-black"
            : "bg-[#2a2a4a] text-gray-300 hover:bg-[#3a3a5a]"
        }`}
        title={
          isDrawingMode
            ? "Exit drawing mode (click to cancel)"
            : "Draw bounding box (click and drag on canvas)"
        }
      >
        {isDrawingMode ? (
          <>
            <Hand className="w-4 h-4" />
            Exit Drawing Mode
          </>
        ) : (
          <>
            <Square className="w-4 h-4" />
            Bounding Box
          </>
        )}
      </button>

      {hasBoundingBoxes && (
        <button
          onClick={onClearAllBoundingBoxes}
          className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
          title="Clear all bounding boxes"
        >
          <Trash2 className="w-4 h-4" />
          Clear All Boxes
        </button>
      )}

      {isDrawingMode && (
        <div className="ml-auto text-xs text-[#00ff88] animate-pulse">
          Click and drag on canvas to draw a bounding box
        </div>
      )}
    </div>
  );
}
