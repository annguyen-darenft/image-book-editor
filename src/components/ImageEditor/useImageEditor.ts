"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import * as fabric from "fabric"
import { Layer, LayoutPreset, PageData, EditorObject, ObjectSheet, LAYOUT_PRESETS } from "./types"

export function useImageEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null)
  const [layers, setLayers] = useState<Layer[]>([])
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [currentLayout, setCurrentLayout] = useState<LayoutPreset | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [pages, setPages] = useState<PageData[]>([])
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [isInitialized, setIsInitialized] = useState(false)

  const [objects, setObjects] = useState<EditorObject[]>([])
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null)

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return

    const container = containerRef.current
    const c = new fabric.Canvas(canvasRef.current, {
      width: container.clientWidth,
      height: container.clientHeight,
      backgroundColor: "#FFF",
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
    setIsInitialized(true)

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

  const applyLayout = useCallback(
    (preset: LayoutPreset) => {
      if (!canvas || !containerRef.current) return

      const container = containerRef.current
      const containerWidth = container.clientWidth
      const containerHeight = container.clientHeight

      const scale = Math.min(
        (containerWidth - 40) / preset.width,
        (containerHeight - 40) / preset.height,
        1
      )

      canvas.setDimensions({
        width: containerWidth,
        height: containerHeight,
      })

      canvas.setZoom(scale)

      const offsetX = (containerWidth - preset.width * scale) / 2
      const offsetY = (containerHeight - preset.height * scale) / 2

      canvas.setViewportTransform([scale, 0, 0, scale, offsetX, offsetY])

      canvas.clipPath = new fabric.Rect({
        left: 0,
        top: 0,
        width: preset.width,
        height: preset.height,
        absolutePositioned: true,
      })

      canvas.backgroundColor = "#FFF"
      canvas.renderAll()

      setCurrentLayout(preset)
      setZoom(scale)
    },
    [canvas]
  )

  useEffect(() => {
    if (canvas && isInitialized && pages.length === 0) {
      const initialPage: PageData = {
        id: `page-${Date.now()}`,
        name: "Page 1",
        canvasJSON: "",
        thumbnail: "",
        layers: [],
      }
      setPages([initialPage])
      applyLayout(LAYOUT_PRESETS[0])
    }
  }, [canvas, isInitialized, pages.length, applyLayout])

  const saveCurrentPage = useCallback(() => {
    if (!canvas || pages.length === 0) return

    const json = JSON.stringify(canvas.toJSON())
    const thumbnail = canvas.toDataURL({
      format: "png",
      quality: 0.5,
      multiplier: 0.2,
    })

    setPages((prev) =>
      prev.map((page, idx) =>
        idx === currentPageIndex
          ? { ...page, canvasJSON: json, thumbnail, layers: [...layers] }
          : page
      )
    )
  }, [canvas, currentPageIndex, layers, pages.length])

  const loadPage = useCallback(
    async (pageIndex: number) => {
      if (!canvas || pageIndex < 0 || pageIndex >= pages.length) return

      const page = pages[pageIndex]

      canvas.clear()
      canvas.backgroundColor = "#FFF"

      if (page.canvasJSON) {
        await canvas.loadFromJSON(page.canvasJSON)
      }

      canvas.renderAll()
      setLayers(page.layers || [])
      setSelectedLayerId(null)
      setCurrentPageIndex(pageIndex)
    },
    [canvas, pages]
  )

  const addPage = useCallback(() => {
    if (!canvas) return

    saveCurrentPage()

    const newPage: PageData = {
      id: `page-${Date.now()}`,
      name: `Page ${pages.length + 1}`,
      canvasJSON: "",
      thumbnail: "",
      layers: [],
    }

    setPages((prev) => [...prev, newPage])

    setTimeout(() => {
      canvas.clear()
      canvas.backgroundColor = "#FFF"
      canvas.renderAll()
      setLayers([])
      setSelectedLayerId(null)
      setCurrentPageIndex(pages.length)
    }, 50)
  }, [canvas, pages.length, saveCurrentPage])

  const deletePage = useCallback(
    (pageIndex: number) => {
      if (pages.length <= 1) return

      saveCurrentPage()

      setPages((prev) => prev.filter((_, idx) => idx !== pageIndex))

      if (pageIndex === currentPageIndex) {
        const newIndex = pageIndex > 0 ? pageIndex - 1 : 0
        setTimeout(() => loadPage(newIndex), 50)
      } else if (pageIndex < currentPageIndex) {
        setCurrentPageIndex((prev) => prev - 1)
      }
    },
    [pages.length, currentPageIndex, saveCurrentPage, loadPage]
  )

  const switchPage = useCallback(
    (pageIndex: number) => {
      if (pageIndex === currentPageIndex || !canvas) return

      saveCurrentPage()
      setTimeout(() => loadPage(pageIndex), 50)
    },
    [currentPageIndex, canvas, saveCurrentPage, loadPage]
  )

  const goToPreviousPage = useCallback(() => {
    if (currentPageIndex > 0) {
      switchPage(currentPageIndex - 1)
    }
  }, [currentPageIndex, switchPage])

  const goToNextPage = useCallback(() => {
    if (currentPageIndex < pages.length - 1) {
      switchPage(currentPageIndex + 1)
    }
  }, [currentPageIndex, pages.length, switchPage])

  const exportAllPages = useCallback(async () => {
    if (!canvas || pages.length === 0) return

    saveCurrentPage()

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]

      if (i !== currentPageIndex && page.canvasJSON) {
        await canvas.loadFromJSON(page.canvasJSON)
        canvas.renderAll()
      }

      const dataURL = currentLayout
        ? canvas.toDataURL({
          format: "png",
          quality: 1,
          left: 0,
          top: 0,
          width: currentLayout.width,
          height: currentLayout.height,
        })
        : canvas.toDataURL({
          format: "png",
          quality: 1,
          multiplier: 2,
        })

      const link = document.createElement("a")
      link.download = `image-book-page-${i + 1}.png`
      link.href = dataURL
      link.click()

      await new Promise((resolve) => setTimeout(resolve, 300))
    }

    if (pages[currentPageIndex].canvasJSON) {
      await canvas.loadFromJSON(pages[currentPageIndex].canvasJSON)
      canvas.renderAll()
    }
  }, [canvas, pages, currentPageIndex, currentLayout, saveCurrentPage])

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
            const zoom = canvas.getZoom() || 1
            const viewWidth = canvasWidth / zoom
            const viewHeight = canvasHeight / zoom

            const scale = Math.min(
              (viewWidth * 0.5) / (img.width || 1),
              (viewHeight * 0.5) / (img.height || 1)
            )

            img.scale(scale)
            img.set({
              left: viewWidth / 4 - ((img.width || 0) * scale) / 2 + index * 20,
              top: viewHeight / 2 - ((img.height || 0) * scale) / 2 + index * 20,
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

    if (currentLayout) {
      const currentVPT = canvas.viewportTransform
      canvas.setViewportTransform([1, 0, 0, 1, 0, 0])

      const dataURL = canvas.toDataURL({
        format: "png",
        quality: 1,
        left: 0,
        top: 0,
        width: currentLayout.width,
        height: currentLayout.height,
      })

      canvas.setViewportTransform(currentVPT || [1, 0, 0, 1, 0, 0])

      const link = document.createElement("a")
      link.download = `canvas-${currentLayout.name.toLowerCase().replace(" ", "-")}.png`
      link.href = dataURL
      link.click()
    } else {
      const dataURL = canvas.toDataURL({
        format: "png",
        quality: 1,
        multiplier: 2,
      })

      const link = document.createElement("a")
      link.download = "canvas-export.png"
      link.href = dataURL
      link.click()
    }
  }, [canvas, currentLayout])

  const addObject = useCallback((name: string) => {
    const newObject: EditorObject = {
      id: `obj-${Date.now()}`,
      name,
      sheets: [],
      activeSheetIndex: 0,
    }
    setObjects((prev) => [...prev, newObject])
    setSelectedObjectId(newObject.id)
  }, [])

  const deleteObject = useCallback((objectId: string) => {
    setObjects((prev) => prev.filter((o) => o.id !== objectId))
    if (selectedObjectId === objectId) {
      setSelectedObjectId(null)
    }
  }, [selectedObjectId])

  const selectObject = useCallback((objectId: string) => {
    setSelectedObjectId(objectId)
  }, [])

  const renameObject = useCallback((objectId: string, newName: string) => {
    setObjects((prev) =>
      prev.map((o) => (o.id === objectId ? { ...o, name: newName } : o))
    )
  }, [])

  const addSheetToObject = useCallback((objectId: string) => {
    setObjects((prev) =>
      prev.map((o) => {
        if (o.id === objectId) {
          const newSheet: ObjectSheet = {
            id: `sheet-${Date.now()}`,
            name: `Sheet ${o.sheets.length + 1}`,
            imageUrl: "",
            imageX: 50,
            imageY: 50,
            imageWidth: 100,
            imageHeight: 100,
          }
          return { ...o, sheets: [...o.sheets, newSheet], activeSheetIndex: o.sheets.length }
        }
        return o
      })
    )
  }, [])

  const deleteSheet = useCallback((objectId: string, sheetId: string) => {
    setObjects((prev) =>
      prev.map((o) => {
        if (o.id === objectId) {
          const newSheets = o.sheets.filter((s) => s.id !== sheetId)
          const newActiveIndex = Math.min(o.activeSheetIndex, Math.max(0, newSheets.length - 1))
          return { ...o, sheets: newSheets, activeSheetIndex: newActiveIndex }
        }
        return o
      })
    )
  }, [])

  const setActiveSheet = useCallback((objectId: string, sheetIndex: number) => {
    setObjects((prev) =>
      prev.map((o) => (o.id === objectId ? { ...o, activeSheetIndex: sheetIndex } : o))
    )
  }, [])

  const updateSheetImage = useCallback((objectId: string, sheetId: string, imageUrl: string) => {
    setObjects((prev) =>
      prev.map((o) => {
        if (o.id === objectId) {
          return {
            ...o,
            sheets: o.sheets.map((s) =>
              s.id === sheetId ? { ...s, imageUrl } : s
            ),
          }
        }
        return o
      })
    )
  }, [])

  const updateSheetTransform = useCallback(
    (objectId: string, sheetId: string, transform: { x?: number; y?: number; width?: number; height?: number }) => {
      setObjects((prev) =>
        prev.map((o) => {
          if (o.id === objectId) {
            return {
              ...o,
              sheets: o.sheets.map((s) =>
                s.id === sheetId
                  ? {
                      ...s,
                      imageX: transform.x ?? s.imageX,
                      imageY: transform.y ?? s.imageY,
                      imageWidth: transform.width ?? s.imageWidth,
                      imageHeight: transform.height ?? s.imageHeight,
                    }
                  : s
              ),
            }
          }
          return o
        })
      )
    },
    []
  )

  return {
    canvasRef,
    containerRef,
    fileInputRef,
    canvas,
    layers,
    selectedLayerId,
    zoom,
    currentLayout,
    pages,
    currentPageIndex,
    applyLayout,
    handleUpload,
    deleteLayer,
    selectLayer,
    moveLayer,
    toggleVisibility,
    handleZoom,
    resetView,
    exportCanvas,
    exportAllPages,
    addPage,
    deletePage,
    switchPage,
    goToPreviousPage,
    goToNextPage,
    objects,
    selectedObjectId,
    addObject,
    deleteObject,
    selectObject,
    renameObject,
    addSheetToObject,
    deleteSheet,
    setActiveSheet,
    updateSheetImage,
    updateSheetTransform,
  }
}