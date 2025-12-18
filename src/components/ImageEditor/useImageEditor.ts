"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import * as fabric from "fabric"
import { LayoutPreset, PageData, EditorObject, ObjectSheet, LAYOUT_PRESETS, DbBook, DbImageObject } from "./types"
import { getFirstBook, getBookPages, getPageImageObjects, uploadPageImage, deletePageImageObject } from "@/lib/supabase/queries"

export function useImageEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null)
  const [zoom, setZoom] = useState(1)
  const [currentLayout, setCurrentLayout] = useState<LayoutPreset | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [pages, setPages] = useState<PageData[]>([])
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [isInitialized, setIsInitialized] = useState(false)

  const [objects, setObjects] = useState<EditorObject[]>([])
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null)
  
  const [currentBook, setCurrentBook] = useState<DbBook | null>(null)
  const [currentPageObjects, setCurrentPageObjects] = useState<DbImageObject[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
    const [selectedPageObjectId, setSelectedPageObjectId] = useState<string | null>(null)
    const [canvasObjects, setCanvasObjects] = useState<Map<string, fabric.FabricImage>>(new Map())
    const [isUploading, setIsUploading] = useState(false)

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
        for (const [id, fabricObj] of canvasObjects.entries()) {
          if (fabricObj === obj) {
            setSelectedPageObjectId(id)
            break
          }
        }
      }
    })

    canvas.on("selection:updated", (e) => {
      const obj = e.selected?.[0]
      if (obj) {
        for (const [id, fabricObj] of canvasObjects.entries()) {
          if (fabricObj === obj) {
            setSelectedPageObjectId(id)
            break
          }
        }
      }
    })

    canvas.on("selection:cleared", () => {
      setSelectedPageObjectId(null)
    })
  }, [canvas, canvasObjects])

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

  const renderPageObjects = useCallback(
    async (pageObjects: DbImageObject[]) => {
      if (!canvas || !currentLayout) return

      canvas.getObjects().forEach((obj) => canvas.remove(obj))
      const newCanvasObjects = new Map<string, fabric.FabricImage>()

      const sortedObjects = [...pageObjects].sort((a, b) => a.z_index - b.z_index)

      for (const obj of sortedObjects) {
        const imageUrl = obj.generate_result_path || obj.crop_result_path
        if (!imageUrl) continue

        try {
          const img = await fabric.FabricImage.fromURL(imageUrl, { crossOrigin: "anonymous" })

          if (obj.type === "background") {
            const scaleX = currentLayout.width / (img.width || 1)
            const scaleY = currentLayout.height / (img.height || 1)
            img.set({
              left: 0,
              top: 0,
              scaleX,
              scaleY,
              selectable: false,
              evented: false,
            })
          } else {
            const boundingInfo = obj.generate_result_path
              ? obj.real_bounding_info
              : obj.crop_bounding_info

            if (boundingInfo && typeof boundingInfo === "object") {
              const { x, y, width, height } = boundingInfo as { x: number; y: number; width: number; height: number }
              const scaleX = width / (img.width || 1)
              const scaleY = height / (img.height || 1)
              img.set({
                left: x,
                top: y,
                scaleX,
                scaleY,
                cornerColor: "#00d4ff",
                cornerStrokeColor: "#00d4ff",
                cornerSize: 12,
                cornerStyle: "circle",
                transparentCorners: false,
                borderColor: "#00d4ff",
                borderScaleFactor: 2,
              })
            }
          }

          canvas.add(img)
          newCanvasObjects.set(obj.id, img)
        } catch (error) {
          console.error("Failed to load image:", imageUrl, error)
        }
      }

      canvas.renderAll()
      setCanvasObjects(newCanvasObjects)
    },
    [canvas, currentLayout]
  )

  useEffect(() => {
    if (!canvas || !isInitialized) return

    const loadBookData = async () => {
      setIsLoadingData(true)
      const book = await getFirstBook()
      
      if (book) {
        setCurrentBook(book)
        const dbPages = await getBookPages(book.id)
        
        if (dbPages.length > 0) {
          const loadedPages: PageData[] = dbPages.map((p) => ({
            id: `page-${p.id}`,
            name: `Page ${p.page_number}`,
            canvasJSON: "",
            thumbnail: "",
            layers: [],
            dbId: p.id,
            pageNumber: p.page_number,
          }))
          setPages(loadedPages)
          
          const firstPageObjects = await getPageImageObjects(dbPages[0].id)
          setCurrentPageObjects(firstPageObjects)
        } else {
          const initialPage: PageData = {
            id: `page-${Date.now()}`,
            name: "Page 1",
            canvasJSON: "",
            thumbnail: "",
            layers: [],
          }
          setPages([initialPage])
        }
      } else {
        const initialPage: PageData = {
          id: `page-${Date.now()}`,
          name: "Page 1",
          canvasJSON: "",
          thumbnail: "",
          layers: [],
        }
        setPages([initialPage])
      }
      
      applyLayout(LAYOUT_PRESETS[0])
      setIsLoadingData(false)
    }

    if (pages.length === 0) {
      loadBookData()
    }
  }, [canvas, isInitialized, pages.length, applyLayout])

  useEffect(() => {
    if (currentPageObjects.length > 0 && currentLayout) {
      renderPageObjects(currentPageObjects)
    }
  }, [currentPageObjects, currentLayout, renderPageObjects])

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
          ? { ...page, canvasJSON: json, thumbnail, layers: [] }
          : page
      )
    )
  }, [canvas, currentPageIndex, pages.length])

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
      setSelectedPageObjectId(null)
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
      setSelectedPageObjectId(null)
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
    async (pageIndex: number) => {
      if (pageIndex === currentPageIndex || !canvas) return

      saveCurrentPage()
      setTimeout(() => loadPage(pageIndex), 50)
      
      const targetPage = pages[pageIndex]
      if (targetPage?.dbId) {
        const pageObjects = await getPageImageObjects(targetPage.dbId)
        setCurrentPageObjects(pageObjects)
      } else {
        setCurrentPageObjects([])
      }
    },
    [currentPageIndex, canvas, saveCurrentPage, loadPage, pages]
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
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!canvas || !e.target.files) return

      const files = Array.from(e.target.files)
      const currentPage = pages[currentPageIndex]
      const pageDbId = currentPage?.dbId

      setIsUploading(true)
      try {
        for (let index = 0; index < files.length; index++) {
          const file = files[index]
          
          if (pageDbId) {
            const result = await uploadPageImage(pageDbId, file, currentLayout)
            if (result) {
              setCurrentPageObjects((prev) => [...prev, result.imageObject])
            }
          }
        }
      } finally {
        setIsUploading(false)
        e.target.value = ""
      }
    },
    [canvas, pages, currentPageIndex, currentLayout]
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

  const selectPageObject = useCallback(
    (objectId: string) => {
      setSelectedPageObjectId(objectId)
      const fabricObj = canvasObjects.get(objectId)
      if (fabricObj && canvas) {
        canvas.setActiveObject(fabricObj)
        canvas.renderAll()
      }
    },
      [canvas, canvasObjects]
    )

  const deletePageObject = useCallback(
    async (objectId: string) => {
      const success = await deletePageImageObject(objectId)
      if (success) {
        setCurrentPageObjects((prev) => prev.filter((obj) => obj.id !== objectId))
        const fabricObj = canvasObjects.get(objectId)
        if (fabricObj && canvas) {
          canvas.remove(fabricObj)
          canvas.renderAll()
        }
        setCanvasObjects((prev) => {
          const next = new Map(prev)
          next.delete(objectId)
          return next
        })
        if (selectedPageObjectId === objectId) {
          setSelectedPageObjectId(null)
        }
      }
    },
    [canvas, canvasObjects, selectedPageObjectId]
  )

  return {
    canvasRef,
    containerRef,
    fileInputRef,
    canvas,
    zoom,
    currentLayout,
    pages,
    currentPageIndex,
    applyLayout,
    handleUpload,
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
    currentBook,
    currentPageObjects,
    isLoadingData,
    isUploading,
    selectedPageObjectId,
    selectPageObject,
    deletePageObject,
  }
}