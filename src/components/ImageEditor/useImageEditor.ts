"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as fabric from "fabric";
import {
  LayoutPreset,
  PageData,
  EditorObject,
  ObjectSheet,
  LAYOUT_PRESETS,
  DbBook,
  DbImageObject,
  DbReplaceableTemplate,
  ReplaceableObjectType,
  DetectedBoundingBox,
} from "./types";
import {
  getFirstBook,
  getBookPages,
  getPageImageObjects,
  deletePageImageObject,
  getReplaceableTemplates,
  createReplaceableTemplate,
  deleteReplaceableTemplate,
  getPageBoundingBoxes,
  saveBoundingBox,
  updatePageStatus,
} from "@/lib/supabase/queries";

export function useImageEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [zoom, setZoom] = useState(1);
  const [currentLayout, setCurrentLayout] = useState<LayoutPreset | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pages, setPages] = useState<PageData[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  const [objects, setObjects] = useState<EditorObject[]>([]);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);

  const [currentBook, setCurrentBook] = useState<DbBook | null>(null);
  const [currentPageObjects, setCurrentPageObjects] = useState<DbImageObject[]>(
    []
  );
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedPageObjectId, setSelectedPageObjectId] = useState<
    string | null
  >(null);
  const [canvasObjects, setCanvasObjects] = useState<
    Map<string, fabric.FabricImage>
  >(new Map());
  const [isUploading, setIsUploading] = useState(false);
  const [replaceableTemplates, setReplaceableTemplates] = useState<
    DbReplaceableTemplate[]
  >([]);
  const [detectedBoundingBoxes, setDetectedBoundingBoxes] = useState<
    DetectedBoundingBox[]
  >([]);
  const [selectedBoundingBoxId, setSelectedBoundingBoxId] = useState<
    string | null
  >(null);
  const boundingBoxObjectsRef = useRef<Map<string, fabric.Rect>>(new Map());
  const boundingBoxTextRef = useRef<Map<string, fabric.Text>>(new Map());

  // Manual drawing mode states
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(
    null
  );
  const drawingRectRef = useRef<fabric.Rect | null>(null);

  // Helper function to generate unique colors for bounding boxes
  const generateBoundingBoxColor = (index: number): string => {
    const colors = [
      "#FF6B6B", // Red
      "#4ECDC4", // Turquoise
      "#45B7D1", // Blue
      "#FFA07A", // Light Salmon
      "#98D8C8", // Mint
      "#FFD93D", // Yellow
      "#C77DFF", // Purple
      "#FF9FF3", // Pink
      "#54A0FF", // Bright Blue
      "#48DBFB", // Cyan
      "#00D2D3", // Teal
      "#F368E0", // Hot Pink
      "#FFA502", // Orange
      "#5F27CD", // Deep Purple
      "#00D084", // Emerald
    ];
    return colors[index % colors.length];
  };

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const c = new fabric.Canvas(canvasRef.current, {
      width: container.clientWidth,
      height: container.clientHeight,
      backgroundColor: "#FFF",
      selection: true,
      preserveObjectStacking: true,
    });

    setCanvas(c);
    setIsInitialized(true);

    const handleResize = () => {
      c.setDimensions({
        width: container.clientWidth,
        height: container.clientHeight,
      });
      c.renderAll();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      c.dispose();
    };
  }, []);

  useEffect(() => {
    if (!canvas) return;

    canvas.off("selection:created");
    canvas.off("selection:updated");
    canvas.off("selection:cleared");
    canvas.off("object:modified");

    canvas.on("selection:created", (e) => {
      const obj = e.selected?.[0];
      if (obj) {
        // Check if it's a bounding box
        let foundBoundingBox = false;
        for (const [id, fabricObj] of boundingBoxObjectsRef.current.entries()) {
          if (fabricObj === obj) {
            setSelectedBoundingBoxId(id);
            setSelectedPageObjectId(null);
            foundBoundingBox = true;
            break;
          }
        }

        // If not a bounding box, check regular objects
        if (!foundBoundingBox) {
          for (const [id, fabricObj] of canvasObjects.entries()) {
            if (fabricObj === obj) {
              setSelectedPageObjectId(id);
              setSelectedBoundingBoxId(null);
              break;
            }
          }
        }
      }
    });

    canvas.on("selection:updated", (e) => {
      const obj = e.selected?.[0];
      if (obj) {
        // Check if it's a bounding box
        let foundBoundingBox = false;
        for (const [id, fabricObj] of boundingBoxObjectsRef.current.entries()) {
          if (fabricObj === obj) {
            setSelectedBoundingBoxId(id);
            setSelectedPageObjectId(null);
            foundBoundingBox = true;
            break;
          }
        }

        // If not a bounding box, check regular objects
        if (!foundBoundingBox) {
          for (const [id, fabricObj] of canvasObjects.entries()) {
            if (fabricObj === obj) {
              setSelectedPageObjectId(id);
              setSelectedBoundingBoxId(null);
              break;
            }
          }
        }
      }
    });

    canvas.on("selection:cleared", () => {
      setSelectedPageObjectId(null);
      setSelectedBoundingBoxId(null);
    });

    canvas.on("object:modified", (e) => {
      const obj = e.target;
      if (obj && obj instanceof fabric.Rect) {
        // Check if it's a bounding box
        for (const [id, fabricObj] of boundingBoxObjectsRef.current.entries()) {
          if (fabricObj === obj) {
            // Update bounding box state
            setDetectedBoundingBoxes((prev) =>
              prev.map((box) =>
                box.id === id
                  ? {
                      ...box,
                      position: { x: obj.left || 0, y: obj.top || 0 },
                      size: {
                        w: (obj.width || 0) * (obj.scaleX || 1),
                        h: (obj.height || 0) * (obj.scaleY || 1),
                      },
                    }
                  : box
              )
            );

            // Update text label position
            const textObj = boundingBoxTextRef.current.get(id);
            if (textObj) {
              textObj.set({
                left: obj.left || 0,
                top: (obj.top || 0) - 40,
              });
              canvas.renderAll();
            }

            break;
          }
        }
      }
    });
  }, [canvas, canvasObjects]);

  // Handle drawing mode toggle - disable/enable object selection
  useEffect(() => {
    if (!canvas) return;

    if (isDrawingMode) {
      // Disable selection for all objects
      canvas.selection = false;
      canvas.forEachObject((obj) => {
        obj.selectable = false;
      });
      canvas.defaultCursor = "crosshair";
      canvas.hoverCursor = "crosshair";
    } else {
      // Re-enable selection
      canvas.selection = true;
      canvas.forEachObject((obj) => {
        obj.selectable = true;
      });
      canvas.defaultCursor = "default";
      canvas.hoverCursor = "move";
    }
    canvas.renderAll();
  }, [canvas, isDrawingMode]);

  // Canvas mouse event handlers for manual box drawing
  useEffect(() => {
    if (!canvas || !isDrawingMode) return;

    const handleMouseDown = (
      e: fabric.TPointerEventInfo<fabric.TPointerEvent>
    ) => {
      const pointer = canvas.getPointer(e.e);
      setIsDrawing(true);
      setDrawStart({ x: pointer.x, y: pointer.y });

      // Create a temporary rectangle
      const rect = new fabric.Rect({
        left: pointer.x,
        top: pointer.y,
        width: 0,
        height: 0,
        fill: "transparent",
        stroke: "#00ff88",
        strokeWidth: 2,
        strokeUniform: true,
        selectable: false,
        evented: false,
      });

      canvas.add(rect);
      drawingRectRef.current = rect;
      canvas.renderAll();
    };

    const handleMouseMove = (
      e: fabric.TPointerEventInfo<fabric.TPointerEvent>
    ) => {
      if (!isDrawing || !drawStart || !drawingRectRef.current) return;

      const pointer = canvas.getPointer(e.e);
      const rect = drawingRectRef.current;

      const width = pointer.x - drawStart.x;
      const height = pointer.y - drawStart.y;

      if (width < 0) {
        rect.set({ left: pointer.x });
      }
      if (height < 0) {
        rect.set({ top: pointer.y });
      }

      rect.set({
        width: Math.abs(width),
        height: Math.abs(height),
      });

      canvas.renderAll();
    };

    const handleMouseUp = () => {
      if (!isDrawing || !drawStart || !drawingRectRef.current) return;

      const rect = drawingRectRef.current;

      // Remove temporary rectangle
      canvas.remove(rect);

      // Only create box if it's large enough (minimum 20x20)
      if ((rect.width || 0) >= 20 && (rect.height || 0) >= 20) {
        // Create permanent bounding box
        const boxId = `bbox-manual-${Date.now()}`;
        const boxIndex = detectedBoundingBoxes.length;
        const color = generateBoundingBoxColor(boxIndex);

        const permanentRect = new fabric.Rect({
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          fill: "transparent",
          stroke: color,
          strokeWidth: 2,
          strokeUniform: true,
          selectable: true,
          hasControls: true,
          hasBorders: true,
          lockRotation: true,
          borderColor: "#00ff88",
          cornerColor: "#00ff88",
          cornerSize: 8,
          transparentCorners: false,
          borderScaleFactor: 2,
        });

        permanentRect.set({
          data: { boxId, title: "Object", type: "human", color },
        } as any);

        canvas.add(permanentRect);
        boundingBoxObjectsRef.current.set(boxId, permanentRect);

        // Create text label
        const text = new fabric.Text("Object", {
          left: rect.left || 0,
          top: (rect.top || 0) - 80,
          fontSize: 64,
          fill: color,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          padding: 4,
          selectable: false,
          evented: false,
        });

        canvas.add(text);
        boundingBoxTextRef.current.set(boxId, text);

        // Add to state
        const newBox: DetectedBoundingBox = {
          id: boxId,
          title: "object",
          type: "human",
          position: { x: rect.left || 0, y: rect.top || 0 },
          size: { w: rect.width || 0, h: rect.height || 0 },
          color,
        };

        setDetectedBoundingBoxes((prev) => [...prev, newBox]);

        // Auto-select the newly created box
        setSelectedBoundingBoxId(boxId);
        canvas.setActiveObject(permanentRect);
      }

      // Reset drawing state
      setIsDrawing(false);
      setDrawStart(null);
      drawingRectRef.current = null;
      canvas.renderAll();
    };

    canvas.on("mouse:down", handleMouseDown);
    canvas.on("mouse:move", handleMouseMove);
    canvas.on("mouse:up", handleMouseUp);

    return () => {
      canvas.off("mouse:down", handleMouseDown);
      canvas.off("mouse:move", handleMouseMove);
      canvas.off("mouse:up", handleMouseUp);
    };
  }, [canvas, isDrawingMode, isDrawing, drawStart]);

  const applyLayout = useCallback(
    (preset: LayoutPreset) => {
      if (!canvas || !containerRef.current) return;

      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      const scale = Math.min(
        (containerWidth - 40) / preset.width,
        (containerHeight - 40) / preset.height,
        1
      );

      canvas.setDimensions({
        width: containerWidth,
        height: containerHeight,
      });

      canvas.setZoom(scale);

      const offsetX = (containerWidth - preset.width * scale) / 2;
      const offsetY = (containerHeight - preset.height * scale) / 2;

      canvas.setViewportTransform([scale, 0, 0, scale, offsetX, offsetY]);

      canvas.clipPath = new fabric.Rect({
        left: 0,
        top: 0,
        width: preset.width,
        height: preset.height,
        absolutePositioned: true,
      });

      canvas.backgroundColor = "#FFF";
      canvas.renderAll();

      setCurrentLayout(preset);
      setZoom(scale);
    },
    [canvas]
  );

  const renderPageObjects = useCallback(
    async (pageObjects: DbImageObject[]) => {
      if (!canvas || !currentLayout) return;

      canvas.getObjects().forEach((obj) => canvas.remove(obj));
      const newCanvasObjects = new Map<string, fabric.FabricImage>();

      const sortedObjects = [...pageObjects].sort(
        (a, b) => a.z_index - b.z_index
      );

      for (const obj of sortedObjects) {
        const imageUrl = obj.generate_result_path || obj.crop_result_path;
        if (!imageUrl) continue;

        try {
          const img = await fabric.FabricImage.fromURL(imageUrl, {
            crossOrigin: "anonymous",
          });

          if (obj.type === "background") {
            const scaleX = currentLayout.width / (img.width || 1);
            const scaleY = currentLayout.height / (img.height || 1);
            img.set({
              left: 0,
              top: 0,
              scaleX,
              scaleY,
              selectable: false,
              evented: false,
            });
          } else {
            const boundingInfo = obj.generate_result_path
              ? obj.real_bounding_info
              : obj.crop_bounding_info;

            if (boundingInfo && typeof boundingInfo === "object") {
              const { x, y, width, height } = boundingInfo as {
                x: number;
                y: number;
                width: number;
                height: number;
              };
              const scaleX = width / (img.width || 1);
              const scaleY = height / (img.height || 1);
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
              });
            }
          }

          canvas.add(img);
          newCanvasObjects.set(obj.id, img);
        } catch (error) {
          console.error("Failed to load image:", imageUrl, error);
        }
      }

      canvas.renderAll();
      setCanvasObjects(newCanvasObjects);
    },
    [canvas, currentLayout]
  );

  useEffect(() => {
    if (!canvas || !isInitialized) return;

    const loadBookData = async () => {
      setIsLoadingData(true);
      const book = await getFirstBook();

      if (book) {
        setCurrentBook(book);

        const templates = await getReplaceableTemplates(book.id);
        setReplaceableTemplates(templates);

        const dbPages = await getBookPages(book.id);

        if (dbPages.length > 0) {
          const loadedPages: PageData[] = dbPages.map((p) => ({
            id: `page-${p.id}`,
            name: `Page ${p.page_number}`,
            canvasJSON: "",
            thumbnail: "",
            layers: [],
            dbId: p.id,
            pageNumber: p.page_number,
            originalImage: p.original_image,
          }));
          setPages(loadedPages);

          const [firstPageObjects, boundingBoxes] = await Promise.all([
            getPageImageObjects(dbPages[0].id),
            getPageBoundingBoxes(dbPages[0].id),
          ]);
          setCurrentPageObjects(firstPageObjects);

          // Load bounding boxes for the first page
          if (boundingBoxes.length > 0 && canvas) {
            const boxesForCanvas = boundingBoxes.map((box) => ({
              title: box.title,
              type: box.type,
              position: box.bounding_info.position,
              size: box.bounding_info.size,
            }));
            // Store in state to be rendered later
            setTimeout(() => {
              // This will be handled by a useEffect
              setDetectedBoundingBoxes(
                boxesForCanvas.map((box, index) => ({
                  id: `bbox-db-${index}`,
                  title: box.title,
                  type: box.type,
                  position: box.position,
                  size: box.size,
                  color: generateBoundingBoxColor(index),
                }))
              );
            }, 200);
          }
        } else {
          const initialPage: PageData = {
            id: `page-${Date.now()}`,
            name: "Page 1",
            canvasJSON: "",
            thumbnail: "",
            layers: [],
          };
          setPages([initialPage]);
        }
      } else {
        const initialPage: PageData = {
          id: `page-${Date.now()}`,
          name: "Page 1",
          canvasJSON: "",
          thumbnail: "",
          layers: [],
        };
        setPages([initialPage]);
      }

      applyLayout(LAYOUT_PRESETS[0]);
      setIsLoadingData(false);
    };

    if (pages.length === 0) {
      loadBookData();
    }
  }, [canvas, isInitialized, pages.length, applyLayout]);

  useEffect(() => {
    if (currentPageObjects.length > 0 && currentLayout) {
      renderPageObjects(currentPageObjects);
    }
  }, [currentPageObjects, currentLayout, renderPageObjects]);

  // Render bounding boxes when detectedBoundingBoxes changes
  useEffect(() => {
    if (!canvas) return;

    // Clear existing bounding boxes
    boundingBoxObjectsRef.current.forEach((rect) => {
      canvas.remove(rect);
    });
    boundingBoxObjectsRef.current.clear();

    boundingBoxTextRef.current.forEach((text) => {
      canvas.remove(text);
    });
    boundingBoxTextRef.current.clear();

    // Render new bounding boxes
    detectedBoundingBoxes.forEach((box) => {
      // Create FabricJS rectangle
      const rect = new fabric.Rect({
        left: box.position.x,
        top: box.position.y,
        width: box.size.w,
        height: box.size.h,
        fill: "transparent",
        stroke: box.color,
        strokeWidth: 2,
        strokeUniform: true,
        selectable: true,
        hasControls: true,
        hasBorders: true,
        lockRotation: true,
        borderColor: "#00ff88",
        cornerColor: "#00ff88",
        cornerSize: 8,
        transparentCorners: false,
        borderScaleFactor: 2,
      });

      rect.set({
        data: {
          boxId: box.id,
          title: box.title,
          type: box.type,
          color: box.color,
        },
      } as any);
      canvas.add(rect);
      boundingBoxObjectsRef.current.set(box.id, rect);

      // Create text label
      const text = new fabric.Text(box.title, {
        left: box.position.x,
        top: box.position.y - 80,
        fontSize: 64,
        fill: box.color,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        padding: 4,
        selectable: false,
        evented: false,
      });

      canvas.add(text);
      boundingBoxTextRef.current.set(box.id, text);
    });

    canvas.renderAll();
  }, [canvas, detectedBoundingBoxes]);

  const saveCurrentPage = useCallback(() => {
    if (!canvas || pages.length === 0) return;

    const json = JSON.stringify(canvas.toJSON());
    const thumbnail = canvas.toDataURL({
      format: "png",
      quality: 0.5,
      multiplier: 0.2,
    });

    setPages((prev) =>
      prev.map((page, idx) =>
        idx === currentPageIndex
          ? { ...page, canvasJSON: json, thumbnail, layers: [] }
          : page
      )
    );
  }, [canvas, currentPageIndex, pages.length]);

  const loadPage = useCallback(
    async (pageIndex: number) => {
      if (!canvas || pageIndex < 0 || pageIndex >= pages.length) return;

      const page = pages[pageIndex];

      canvas.clear();
      canvas.backgroundColor = "#FFF";

      if (page.canvasJSON) {
        await canvas.loadFromJSON(page.canvasJSON);
      }

      canvas.renderAll();
      setSelectedPageObjectId(null);
      setCurrentPageIndex(pageIndex);
    },
    [canvas, pages]
  );

  const addPage = useCallback(() => {
    if (!canvas) return;

    saveCurrentPage();

    const newPage: PageData = {
      id: `page-${Date.now()}`,
      name: `Page ${pages.length + 1}`,
      canvasJSON: "",
      thumbnail: "",
      layers: [],
    };

    setPages((prev) => [...prev, newPage]);

    setTimeout(() => {
      canvas.clear();
      canvas.backgroundColor = "#FFF";
      canvas.renderAll();
      setSelectedPageObjectId(null);
      setCurrentPageIndex(pages.length);
    }, 50);
  }, [canvas, pages.length, saveCurrentPage]);

  const deletePage = useCallback(
    (pageIndex: number) => {
      if (pages.length <= 1) return;

      saveCurrentPage();

      setPages((prev) => prev.filter((_, idx) => idx !== pageIndex));

      if (pageIndex === currentPageIndex) {
        const newIndex = pageIndex > 0 ? pageIndex - 1 : 0;
        setTimeout(() => loadPage(newIndex), 50);
      } else if (pageIndex < currentPageIndex) {
        setCurrentPageIndex((prev) => prev - 1);
      }
    },
    [pages.length, currentPageIndex, saveCurrentPage, loadPage]
  );

  const switchPage = useCallback(
    async (pageIndex: number) => {
      if (pageIndex === currentPageIndex || !canvas) return;

      saveCurrentPage();
      setTimeout(() => loadPage(pageIndex), 50);

      const targetPage = pages[pageIndex];
      if (targetPage?.dbId) {
        const [pageObjects, boundingBoxes] = await Promise.all([
          getPageImageObjects(targetPage.dbId),
          getPageBoundingBoxes(targetPage.dbId),
        ]);
        setCurrentPageObjects(pageObjects);

        // Convert DbBoundingBox and set to state
        if (boundingBoxes.length > 0) {
          setTimeout(() => {
            setDetectedBoundingBoxes(
              boundingBoxes.map((box, index) => ({
                id: `bbox-db-${box.id}`,
                title: box.title,
                type: box.type,
                position: box.bounding_info.position,
                size: box.bounding_info.size,
                color: generateBoundingBoxColor(index),
              }))
            );
          }, 100);
        } else {
          // Clear existing bounding boxes if no boxes found
          setDetectedBoundingBoxes([]);
        }
      } else {
        setCurrentPageObjects([]);
        setDetectedBoundingBoxes([]);
      }
    },
    [currentPageIndex, canvas, saveCurrentPage, loadPage, pages]
  );

  const goToPreviousPage = useCallback(() => {
    if (currentPageIndex > 0) {
      switchPage(currentPageIndex - 1);
    }
  }, [currentPageIndex, switchPage]);

  const goToNextPage = useCallback(() => {
    if (currentPageIndex < pages.length - 1) {
      switchPage(currentPageIndex + 1);
    }
  }, [currentPageIndex, pages.length, switchPage]);

  const exportAllPages = useCallback(async () => {
    if (!canvas || pages.length === 0) return;

    saveCurrentPage();

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];

      if (i !== currentPageIndex && page.canvasJSON) {
        await canvas.loadFromJSON(page.canvasJSON);
        canvas.renderAll();
      }

      const dataURL = currentLayout
        ? canvas.toDataURL({
            format: "png",
            quality: 1,
            multiplier: 1,
            left: 0,
            top: 0,
            width: currentLayout.width,
            height: currentLayout.height,
          })
        : canvas.toDataURL({
            format: "png",
            quality: 1,
            multiplier: 2,
          });

      const link = document.createElement("a");
      link.download = `image-book-page-${i + 1}.png`;
      link.href = dataURL;
      link.click();

      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    if (pages[currentPageIndex].canvasJSON) {
      await canvas.loadFromJSON(pages[currentPageIndex].canvasJSON);
      canvas.renderAll();
    }
  }, [canvas, pages, currentPageIndex, currentLayout, saveCurrentPage]);

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!canvas || !e.target.files) return;

      const files = Array.from(e.target.files);
      const currentPage = pages[currentPageIndex];
      const pageDbId = currentPage?.dbId;

      setIsUploading(true);
      try {
        for (let index = 0; index < files.length; index++) {
          const file = files[index];

          if (pageDbId) {
            // Convert file to base64
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve, reject) => {
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });

            const imageData = await base64Promise;

            // Call API endpoint
            const response = await fetch("/api/upload-page-image", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                page_id: pageDbId,
                image_data: imageData,
                layout: {
                  width: currentLayout?.width || 2000,
                  height: currentLayout?.height || 2000,
                },
              }),
            });

            if (!response.ok) {
              console.error("Failed to upload image");
              continue;
            }

            const result = await response.json();
            if (result.success && result.image_object) {
              // Refresh page objects from database
              const refreshedObjects = await getPageImageObjects(pageDbId);
              setCurrentPageObjects(refreshedObjects);

              // Update current page's original_image URL
              setPages((prevPages) =>
                prevPages.map((p, idx) =>
                  idx === currentPageIndex
                    ? { ...p, originalImage: result.image_url }
                    : p
                )
              );
            }
          }
        }
      } finally {
        setIsUploading(false);
        e.target.value = "";
      }
    },
    [canvas, pages, currentPageIndex, currentLayout]
  );

  const handleZoom = useCallback(
    (delta: number) => {
      if (!canvas) return;

      const newZoom = Math.max(0.1, Math.min(3, zoom + delta));
      canvas.setZoom(newZoom);
      canvas.renderAll();
      setZoom(newZoom);
    },
    [canvas, zoom]
  );

  const resetView = useCallback(() => {
    if (!canvas) return;

    canvas.setZoom(1);
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    canvas.renderAll();
    setZoom(1);
  }, [canvas]);

  const exportCanvas = useCallback(() => {
    if (!canvas) return;

    if (currentLayout) {
      const currentVPT = canvas.viewportTransform;
      canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

      const dataURL = canvas.toDataURL({
        format: "png",
        quality: 1,
        multiplier: 1,
        left: 0,
        top: 0,
        width: currentLayout.width,
        height: currentLayout.height,
      });

      canvas.setViewportTransform(currentVPT || [1, 0, 0, 1, 0, 0]);

      const link = document.createElement("a");
      link.download = `canvas-${currentLayout.name
        .toLowerCase()
        .replace(" ", "-")}.png`;
      link.href = dataURL;
      link.click();
    } else {
      const dataURL = canvas.toDataURL({
        format: "png",
        quality: 1,
        multiplier: 2,
      });

      const link = document.createElement("a");
      link.download = "canvas-export.png";
      link.href = dataURL;
      link.click();
    }
  }, [canvas, currentLayout]);

  const addObject = useCallback((name: string) => {
    const newObject: EditorObject = {
      id: `obj-${Date.now()}`,
      name,
      sheets: [],
      activeSheetIndex: 0,
    };
    setObjects((prev) => [...prev, newObject]);
    setSelectedObjectId(newObject.id);
  }, []);

  const deleteObject = useCallback(
    (objectId: string) => {
      setObjects((prev) => prev.filter((o) => o.id !== objectId));
      if (selectedObjectId === objectId) {
        setSelectedObjectId(null);
      }
    },
    [selectedObjectId]
  );

  const selectObject = useCallback((objectId: string) => {
    setSelectedObjectId(objectId);
  }, []);

  const renameObject = useCallback((objectId: string, newName: string) => {
    setObjects((prev) =>
      prev.map((o) => (o.id === objectId ? { ...o, name: newName } : o))
    );
  }, []);

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
          };
          return {
            ...o,
            sheets: [...o.sheets, newSheet],
            activeSheetIndex: o.sheets.length,
          };
        }
        return o;
      })
    );
  }, []);

  const deleteSheet = useCallback((objectId: string, sheetId: string) => {
    setObjects((prev) =>
      prev.map((o) => {
        if (o.id === objectId) {
          const newSheets = o.sheets.filter((s) => s.id !== sheetId);
          const newActiveIndex = Math.min(
            o.activeSheetIndex,
            Math.max(0, newSheets.length - 1)
          );
          return { ...o, sheets: newSheets, activeSheetIndex: newActiveIndex };
        }
        return o;
      })
    );
  }, []);

  const setActiveSheet = useCallback((objectId: string, sheetIndex: number) => {
    setObjects((prev) =>
      prev.map((o) =>
        o.id === objectId ? { ...o, activeSheetIndex: sheetIndex } : o
      )
    );
  }, []);

  const updateSheetImage = useCallback(
    (objectId: string, sheetId: string, imageUrl: string) => {
      setObjects((prev) =>
        prev.map((o) => {
          if (o.id === objectId) {
            return {
              ...o,
              sheets: o.sheets.map((s) =>
                s.id === sheetId ? { ...s, imageUrl } : s
              ),
            };
          }
          return o;
        })
      );
    },
    []
  );

  const updateSheetTransform = useCallback(
    (
      objectId: string,
      sheetId: string,
      transform: { x?: number; y?: number; width?: number; height?: number }
    ) => {
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
            };
          }
          return o;
        })
      );
    },
    []
  );

  const selectPageObject = useCallback(
    (objectId: string) => {
      setSelectedPageObjectId(objectId);
      const fabricObj = canvasObjects.get(objectId);
      if (fabricObj && canvas) {
        canvas.setActiveObject(fabricObj);
        canvas.renderAll();
      }
    },
    [canvas, canvasObjects]
  );

  const deletePageObject = useCallback(
    async (objectId: string) => {
      const success = await deletePageImageObject(objectId);
      if (success) {
        setCurrentPageObjects((prev) =>
          prev.filter((obj) => obj.id !== objectId)
        );
        const fabricObj = canvasObjects.get(objectId);
        if (fabricObj && canvas) {
          canvas.remove(fabricObj);
          canvas.renderAll();
        }
        setCanvasObjects((prev) => {
          const next = new Map(prev);
          next.delete(objectId);
          return next;
        });
        if (selectedPageObjectId === objectId) {
          setSelectedPageObjectId(null);
        }
      }
    },
    [canvas, canvasObjects, selectedPageObjectId]
  );

  const addReplaceableTemplate = useCallback(
    async (title: string, description: string, type: ReplaceableObjectType) => {
      if (!currentBook) return;
      const template = await createReplaceableTemplate(
        currentBook.id,
        title,
        description,
        type
      );
      if (template) {
        setReplaceableTemplates((prev) => [...prev, template]);
      }
    },
    [currentBook]
  );

  const removeReplaceableTemplate = useCallback(async (templateId: string) => {
    const success = await deleteReplaceableTemplate(templateId);
    if (success) {
      setReplaceableTemplates((prev) =>
        prev.filter((t) => t.id !== templateId)
      );
    }
  }, []);

  const selectBoundingBox = useCallback(
    (boxId: string) => {
      setSelectedBoundingBoxId(boxId);
      const fabricObj = boundingBoxObjectsRef.current.get(boxId);
      if (fabricObj && canvas) {
        canvas.setActiveObject(fabricObj);
        canvas.renderAll();
      }
    },
    [canvas]
  );

  const deleteBoundingBox = useCallback(
    (boxId: string) => {
      const fabricObj = boundingBoxObjectsRef.current.get(boxId);
      if (fabricObj && canvas) {
        canvas.remove(fabricObj);
      }

      const textObj = boundingBoxTextRef.current.get(boxId);
      if (textObj && canvas) {
        canvas.remove(textObj);
      }

      boundingBoxObjectsRef.current.delete(boxId);
      boundingBoxTextRef.current.delete(boxId);

      if (canvas) {
        canvas.renderAll();
      }

      setDetectedBoundingBoxes((prev) =>
        prev.filter((box) => box.id !== boxId)
      );
      if (selectedBoundingBoxId === boxId) {
        setSelectedBoundingBoxId(null);
      }
    },
    [canvas, selectedBoundingBoxId]
  );

  const clearAllBoundingBoxes = useCallback(() => {
    if (!canvas) return;
    boundingBoxObjectsRef.current.forEach((rect) => {
      canvas.remove(rect);
    });
    boundingBoxObjectsRef.current.clear();

    boundingBoxTextRef.current.forEach((text) => {
      canvas.remove(text);
    });
    boundingBoxTextRef.current.clear();

    setDetectedBoundingBoxes([]);
    setSelectedBoundingBoxId(null);
    canvas.renderAll();
  }, [canvas]);

  const toggleDrawingMode = useCallback(() => {
    setIsDrawingMode((prev) => !prev);
    // If exiting drawing mode while drawing, cleanup
    if (isDrawingMode && drawingRectRef.current && canvas) {
      canvas.remove(drawingRectRef.current);
      drawingRectRef.current = null;
      setIsDrawing(false);
      setDrawStart(null);
      canvas.renderAll();
    }
  }, [canvas, isDrawingMode]);

  const updateBoundingBox = useCallback(
    (boxId: string, title: string, type: string) => {
      setDetectedBoundingBoxes((prev) =>
        prev.map((box) => (box.id === boxId ? { ...box, title, type } : box))
      );

      // Update the canvas object data
      const fabricObj = boundingBoxObjectsRef.current.get(boxId);
      if (fabricObj) {
        const currentData = (fabricObj as any).data || {};
        fabricObj.set({ data: { ...currentData, boxId, title, type } } as any);
      }

      // Update the text label
      const textObj = boundingBoxTextRef.current.get(boxId);
      if (textObj && canvas) {
        textObj.set({ text: title });
        canvas.renderAll();
      }
    },
    [canvas]
  );

  const handleDetectBoundingBoxes = useCallback(
    (
      apiBoxes: {
        title: string;
        type: string;
        position: { x: number; y: number };
        size: { w: number; h: number };
      }[]
    ) => {
      if (!canvas) return;

      // Clear existing bounding boxes and text labels
      boundingBoxObjectsRef.current.forEach((rect) => {
        canvas.remove(rect);
      });
      boundingBoxObjectsRef.current.clear();

      boundingBoxTextRef.current.forEach((text) => {
        canvas.remove(text);
      });
      boundingBoxTextRef.current.clear();

      // Convert API response to DetectedBoundingBox format and create FabricJS rectangles
      const newBoxes: DetectedBoundingBox[] = apiBoxes.map((box, index) => {
        const boxId = `bbox-${Date.now()}-${index}`;
        const color = generateBoundingBoxColor(index);

        // Create FabricJS rectangle
        const rect = new fabric.Rect({
          left: box.position.x,
          top: box.position.y,
          width: box.size.w,
          height: box.size.h,
          fill: "transparent",
          stroke: color,
          strokeWidth: 2,
          strokeUniform: true,
          selectable: true,
          hasControls: true,
          hasBorders: true,
          lockRotation: true,
          borderColor: "#00ff88",
          cornerColor: "#00ff88",
          cornerSize: 8,
          transparentCorners: false,
          borderScaleFactor: 2,
        });

        // Store custom data
        rect.set({
          data: { boxId, title: box.title, type: box.type, color },
        } as any);

        // Add to canvas
        canvas.add(rect);

        // Create text label
        const text = new fabric.Text(box.title, {
          left: box.position.x,
          top: box.position.y - 80,
          fontSize: 64,
          fill: color,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          padding: 4,
          selectable: false,
          evented: false,
        });

        canvas.add(text);

        // Store references
        boundingBoxObjectsRef.current.set(boxId, rect);
        boundingBoxTextRef.current.set(boxId, text);

        return {
          id: boxId,
          title: box.title,
          type: box.type,
          position: { x: box.position.x, y: box.position.y },
          size: { w: box.size.w, h: box.size.h },
          color,
        };
      });

      setDetectedBoundingBoxes(newBoxes);
      canvas.renderAll();
    },
    [canvas]
  );

  const saveAllBoundingBoxesAndProcess = useCallback(async () => {
    const currentPage = pages[currentPageIndex];
    if (!currentPage?.dbId) {
      console.error("No page ID available");
      return false;
    }

    try {
      // Save all bounding boxes
      const savePromises = detectedBoundingBoxes.map((box) =>
        saveBoundingBox(currentPage.dbId!, box.title, box.type, {
          position: {
            x: Math.round(box.position.x),
            y: Math.round(box.position.y),
          },
          size: {
            w: Math.round(box.size.w),
            h: Math.round(box.size.h),
          },
        })
      );

      await Promise.all(savePromises);

      // Update page status to processing
      await updatePageStatus(currentPage.dbId, "processing");

      return true;
    } catch (error) {
      console.error("Error saving bounding boxes:", error);
      return false;
    }
  }, [pages, currentPageIndex, detectedBoundingBoxes]);

  const currentPage = pages[currentPageIndex];
  const currentPageOriginalImage = currentPage?.originalImage || null;

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
    replaceableTemplates,
    addReplaceableTemplate,
    removeReplaceableTemplate,
    currentPageOriginalImage,
    handleDetectBoundingBoxes,
    detectedBoundingBoxes,
    selectedBoundingBoxId,
    selectBoundingBox,
    deleteBoundingBox,
    clearAllBoundingBoxes,
    isDrawingMode,
    toggleDrawingMode,
    updateBoundingBox,
    saveAllBoundingBoxesAndProcess,
  };
}
