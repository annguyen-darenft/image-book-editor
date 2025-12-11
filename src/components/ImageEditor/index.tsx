"use client"

import { useImageEditor } from "./useImageEditor"
import { Header } from "./Header"
import { PagesSidebar } from "./PagesSidebar"
import { LayersSidebar } from "./LayersSidebar"
import { CanvasArea } from "./CanvasArea"
import { ObjectsPanel } from "./ObjectsPanel"

export function ImageEditor() {
  const {
    canvasRef,
    containerRef,
    fileInputRef,
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
  } = useImageEditor()

  return (
    <div className="flex h-screen bg-[#0f0f1a]">
      <div className="flex-1 flex flex-col">
        <Header
          currentLayout={currentLayout}
          zoom={zoom}
          onApplyLayout={applyLayout}
          onZoom={handleZoom}
          onResetView={resetView}
          onExportCanvas={exportCanvas}
          onExportAllPages={exportAllPages}
        />

        <div className="flex-1 flex">
          <PagesSidebar
            pages={pages}
            currentPageIndex={currentPageIndex}
            onAddPage={addPage}
            onDeletePage={deletePage}
            onSwitchPage={switchPage}
            onPreviousPage={goToPreviousPage}
            onNextPage={goToNextPage}
          />

          <div className="flex-1 flex flex-col">
            <CanvasArea containerRef={containerRef} canvasRef={canvasRef} />
          </div>

          <LayersSidebar
            layers={layers}
            selectedLayerId={selectedLayerId}
            fileInputRef={fileInputRef}
            onUpload={handleUpload}
            onSelectLayer={selectLayer}
            onDeleteLayer={deleteLayer}
            onMoveLayer={moveLayer}
            onToggleVisibility={toggleVisibility}
          />
        </div>

        <ObjectsPanel
              objects={objects}
              selectedObjectId={selectedObjectId}
              onAddObject={addObject}
              onDeleteObject={deleteObject}
              onSelectObject={selectObject}
              onRenameObject={renameObject}
              onAddSheet={addSheetToObject}
              onDeleteSheet={deleteSheet}
              onSetActiveSheet={setActiveSheet}
              onUpdateSheetImage={updateSheetImage}
              onUpdateSheetTransform={updateSheetTransform}
            />
      </div>
    </div>
  )
}