"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { Plus, Trash2, X, Scan, Loader2 } from "lucide-react"
import { EditorObject, ObjectSheet, DbReplaceableTemplate, ReplaceableObjectType, DbImageObject } from "./types"

interface ObjectsPanelProps {
  objects: EditorObject[]
  selectedObjectId: string | null
  onAddObject: (name: string) => void
  onDeleteObject: (objectId: string) => void
  onSelectObject: (objectId: string) => void
  onRenameObject: (objectId: string, newName: string) => void
  onAddSheet: (objectId: string) => void
  onDeleteSheet: (objectId: string, sheetId: string) => void
  onSetActiveSheet: (objectId: string, sheetIndex: number) => void
  onUpdateSheetImage: (objectId: string, sheetId: string, imageUrl: string) => void
  onUpdateSheetTransform: (objectId: string, sheetId: string, transform: { x?: number; y?: number; width?: number; height?: number }) => void
  replaceableTemplates: DbReplaceableTemplate[]
  onAddReplaceableTemplate: (title: string, description: string, type: ReplaceableObjectType) => void
  onDeleteReplaceableTemplate: (templateId: string) => void
  currentPageObjects: DbImageObject[]
  currentPageOriginalImage: string | null
  onDetectBoundingBoxes: (boundingBoxes: { label: string; type: string; box_2d: number[] }[]) => void
}

function SheetCanvasEditor({
  sheet,
  objectId,
  onUpdateSheetImage,
  onUpdateSheetTransform,
}: {
  sheet: ObjectSheet
  objectId: string
  onUpdateSheetImage: (objectId: string, sheetId: string, imageUrl: string) => void
  onUpdateSheetTransform: (objectId: string, sheetId: string, transform: { x?: number; y?: number; width?: number; height?: number }) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const canvasWidth = 200
  const canvasHeight = 200

  useEffect(() => {
    if (sheet.imageUrl) {
      const img = new Image()
      img.src = sheet.imageUrl
      img.onload = () => setImage(img)
    } else {
      setImage(null)
    }
  }, [sheet.imageUrl])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.fillStyle = "#1a1a2e"
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    ctx.strokeStyle = "#333"
    ctx.lineWidth = 1
    for (let i = 0; i < canvasWidth; i += 20) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, canvasHeight)
      ctx.stroke()
    }
    for (let i = 0; i < canvasHeight; i += 20) {
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(canvasWidth, i)
      ctx.stroke()
    }

    if (image) {
      ctx.drawImage(image, sheet.imageX, sheet.imageY, sheet.imageWidth, sheet.imageHeight)

      ctx.strokeStyle = "#00d4ff"
      ctx.lineWidth = 2
      ctx.strokeRect(sheet.imageX, sheet.imageY, sheet.imageWidth, sheet.imageHeight)

      ctx.fillStyle = "#00d4ff"
      ctx.fillRect(sheet.imageX + sheet.imageWidth - 6, sheet.imageY + sheet.imageHeight - 6, 12, 12)
    }
  }, [image, sheet.imageX, sheet.imageY, sheet.imageWidth, sheet.imageHeight])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!image) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const resizeX = sheet.imageX + sheet.imageWidth - 6
    const resizeY = sheet.imageY + sheet.imageHeight - 6
    if (x >= resizeX && x <= resizeX + 12 && y >= resizeY && y <= resizeY + 12) {
      setIsResizing(true)
      setDragStart({ x, y })
      return
    }

    if (
      x >= sheet.imageX &&
      x <= sheet.imageX + sheet.imageWidth &&
      y >= sheet.imageY &&
      y <= sheet.imageY + sheet.imageHeight
    ) {
      setIsDragging(true)
      setDragStart({ x: x - sheet.imageX, y: y - sheet.imageY })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging && !isResizing) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (isDragging) {
      const newX = Math.max(0, Math.min(canvasWidth - sheet.imageWidth, x - dragStart.x))
      const newY = Math.max(0, Math.min(canvasHeight - sheet.imageHeight, y - dragStart.y))
      onUpdateSheetTransform(objectId, sheet.id, { x: newX, y: newY })
    } else if (isResizing) {
      const newWidth = Math.max(20, x - sheet.imageX)
      const newHeight = Math.max(20, y - sheet.imageY)
      onUpdateSheetTransform(objectId, sheet.id, { width: newWidth, height: newHeight })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setIsResizing(false)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string
      onUpdateSheetImage(objectId, sheet.id, imageUrl)
      onUpdateSheetTransform(objectId, sheet.id, { x: 20, y: 20, width: 160, height: 160 })
    }
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  return (
    <div ref={containerRef} className="relative">
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className="border border-[#333] rounded cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      {!image && (
        <div
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="text-center text-gray-500">
            <Plus className="w-8 h-8 mx-auto mb-1" />
            <span className="text-xs">Add Image</span>
          </div>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />
    </div>
  )
}

export function ObjectsPanel({
  objects,
  selectedObjectId,
  onAddObject,
  onDeleteObject,
  onSelectObject,
  onRenameObject,
  onAddSheet,
  onDeleteSheet,
  onSetActiveSheet,
  onUpdateSheetImage,
  onUpdateSheetTransform,
  replaceableTemplates,
  onAddReplaceableTemplate,
  onDeleteReplaceableTemplate,
  currentPageObjects,
  currentPageOriginalImage,
  onDetectBoundingBoxes,
}: ObjectsPanelProps) {
  const [newTitle, setNewTitle] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [newType, setNewType] = useState<ReplaceableObjectType>("human")
  const [editingObjectId, setEditingObjectId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [isDetecting, setIsDetecting] = useState(false)

  const selectedObject = objects.find((o) => o.id === selectedObjectId)
  const selectedTemplate = replaceableTemplates.find((t) => t.id === selectedTemplateId)

  const matchingPageObjects = (currentPageObjects || []).filter((pageObj) =>
    replaceableTemplates.some(
      (template) => template.title.toLowerCase() === pageObj.title?.toLowerCase()
    )
  )

  const handleDetectBoundingBoxes = async () => {
    if (!currentPageOriginalImage || replaceableTemplates.length === 0) return

    setIsDetecting(true)
    try {
      const response = await fetch(currentPageOriginalImage)
      const blob = await response.blob()
      const file = new File([blob], "image.png", { type: blob.type })

      const formData = new FormData()
      formData.append("image", file)
      formData.append("objects", JSON.stringify(
        replaceableTemplates.map((t) => ({
          title: t.title,
          description: t.description || "",
          type: t.type,
        }))
      ))

      const detectResponse = await fetch("/api/detect-bounding-boxes", {
        method: "POST",
        body: formData,
      })

      if (!detectResponse.ok) {
        throw new Error("Failed to detect bounding boxes")
      }

      const data = await detectResponse.json()
      onDetectBoundingBoxes(data.boundingBoxes)
    } catch (error) {
      console.error("Error detecting bounding boxes:", error)
    } finally {
      setIsDetecting(false)
    }
  }

  const handleAddTemplate = () => {
    if (newTitle.trim()) {
      onAddReplaceableTemplate(newTitle.trim(), newDescription.trim(), newType)
      setNewTitle("")
      setNewDescription("")
    }
  }

  const handleStartEdit = (obj: EditorObject) => {
    setEditingObjectId(obj.id)
    setEditName(obj.name)
  }

  const handleSaveEdit = () => {
    if (editingObjectId && editName.trim()) {
      onRenameObject(editingObjectId, editName.trim())
    }
    setEditingObjectId(null)
    setEditName("")
  }

  return (
    <div className="h-64 bg-[#1a1a2e] border-t border-[#2a2a4a] flex">
      <div className="w-56 border-r border-[#2a2a4a] flex flex-col">
        <div className="p-2 border-b border-[#2a2a4a]">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Replaceable</span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {replaceableTemplates.map((template) => (
            <div
              key={template.id}
              className={`px-2 py-1.5 rounded cursor-pointer text-sm flex items-center justify-between group ${
                selectedTemplateId === template.id ? "bg-[#00d4ff]/20 text-[#00d4ff]" : "text-gray-300 hover:bg-[#2a2a4a]"
              }`}
              onClick={() => setSelectedTemplateId(template.id)}
            >
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{template.title}</span>
                  <span className="text-[10px] px-1 bg-[#2a2a4a] text-gray-400 rounded uppercase">
                    {template.type}
                  </span>
                </div>
                {template.description && (
                  <span className="truncate text-xs text-gray-500">{template.description}</span>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteReplaceableTemplate(template.id)
                  if (selectedTemplateId === template.id) {
                    setSelectedTemplateId(null)
                  }
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400 ml-1"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
          {replaceableTemplates.length === 0 && (
            <div className="text-xs text-gray-500 text-center py-2">No templates</div>
          )}
        </div>
        <div className="p-2 border-t border-[#2a2a4a] space-y-1">
          <div className="flex gap-1">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Title..."
              className="flex-1 bg-[#0f0f1a] border border-[#2a2a4a] rounded px-2 py-1 text-xs text-white placeholder-gray-500 outline-none focus:border-[#00d4ff]"
            />
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as ReplaceableObjectType)}
              className="bg-[#0f0f1a] border border-[#2a2a4a] rounded px-1 py-1 text-[10px] text-white outline-none focus:border-[#00d4ff] appearance-none cursor-pointer"
            >
              <option value="human">Human</option>
              <option value="animal">Animal</option>
              <option value="item">Item</option>
            </select>
          </div>
          <div className="flex gap-1">
            <input
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTemplate()}
              placeholder="Description..."
              className="flex-1 bg-[#0f0f1a] border border-[#2a2a4a] rounded px-2 py-1 text-xs text-white placeholder-gray-500 outline-none focus:border-[#00d4ff]"
            />
            <button
              onClick={handleAddTemplate}
              disabled={!newTitle.trim()}
              className="p-1 bg-[#00d4ff] text-black rounded hover:bg-[#00b8e0] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {selectedObject && (
        <>
          <div className="w-28 border-r border-[#2a2a4a] flex flex-col">
            <div className="p-2 border-b border-[#2a2a4a] flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Sheets</span>
              <button
                onClick={() => onAddSheet(selectedObject.id)}
                className="p-0.5 text-gray-400 hover:text-[#00d4ff]"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {selectedObject.sheets.map((sheet, idx) => (
                <div
                  key={sheet.id}
                  className={`px-2 py-1.5 rounded cursor-pointer text-sm flex items-center justify-between group ${
                    selectedObject.activeSheetIndex === idx ? "bg-[#00d4ff]/20 text-[#00d4ff]" : "text-gray-300 hover:bg-[#2a2a4a]"
                  }`}
                  onClick={() => onSetActiveSheet(selectedObject.id, idx)}
                >
                  <span>Sheet {idx + 1}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteSheet(selectedObject.id, sheet.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {selectedObject.sheets.length === 0 && (
                <div className="text-xs text-gray-500 text-center py-2">No sheets</div>
              )}
            </div>
          </div>

          <div className="flex-1 p-3 flex flex-col">
            <div className="text-xs text-gray-400 mb-2">
              {selectedObject.sheets.length > 0
                ? `Sheet ${selectedObject.activeSheetIndex + 1} - Move & Resize`
                : "Add a sheet to start"}
            </div>
            {selectedObject.sheets[selectedObject.activeSheetIndex] && (
              <SheetCanvasEditor
                sheet={selectedObject.sheets[selectedObject.activeSheetIndex]}
                objectId={selectedObject.id}
                onUpdateSheetImage={onUpdateSheetImage}
                onUpdateSheetTransform={onUpdateSheetTransform}
              />
            )}
          </div>
        </>
      )}

      {!selectedObject && (
        <div className="flex-1 flex flex-col border-r border-[#2a2a4a]">
          <div className="p-2 border-b border-[#2a2a4a]">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Page Objects</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {matchingPageObjects.length > 0 ? (
              <div className="space-y-1">
                {matchingPageObjects.map((obj) => (
                  <div
                    key={obj.id}
                    className="px-2 py-1.5 rounded text-sm text-gray-300 hover:bg-[#2a2a4a] cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{obj.title}</span>
                      <span className="text-[10px] px-1 bg-[#2a2a4a] text-gray-400 rounded uppercase">
                        {obj.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <span className="text-xs text-gray-500 text-center">
                  No matching objects found
                </span>
                {currentPageOriginalImage && replaceableTemplates.length > 0 && (
                  <button
                    onClick={handleDetectBoundingBoxes}
                    disabled={isDetecting}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[#00d4ff] text-black rounded text-xs font-medium hover:bg-[#00b8e0] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDetecting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Detecting...
                      </>
                    ) : (
                      <>
                        <Scan className="w-4 h-4" />
                        Detect Replaceable
                      </>
                    )}
                  </button>
                )}
                {!currentPageOriginalImage && (
                  <span className="text-[10px] text-gray-600">Upload an image first</span>
                )}
                {replaceableTemplates.length === 0 && (
                  <span className="text-[10px] text-gray-600">Add replaceable templates first</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}