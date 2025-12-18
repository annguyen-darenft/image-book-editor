"use client"

import { Header } from "./Header"
import { PagesSidebar } from "./PagesSidebar"
import { LayersSidebar } from "./LayersSidebar"
import { ObjectsPanel } from "./ObjectsPanel"
import { CanvasArea } from "./CanvasArea"
import { useImageEditor } from "./useImageEditor"

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
    currentPageObjects,
  } = useImageEditor()

  const triggerUpload = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="flex flex-col h-screen bg-[#0a0a14]">
      <Header
        currentLayout={currentLayout}
        zoom={zoom}
        onApplyLayout={applyLayout}
        onZoom={handleZoom}
        onResetView={resetView}
        onExportCanvas={exportCanvas}
        onExportAllPages={exportAllPages}
      />
      <div className="flex flex-1 overflow-hidden">
        <PagesSidebar
          pages={pages}
          currentPageIndex={currentPageIndex}
          onAddPage={addPage}
          onDeletePage={deletePage}
          onSwitchPage={switchPage}
          onPreviousPage={goToPreviousPage}
          onNextPage={goToNextPage}
        />
        <div className="flex flex-col flex-1 min-w-0">
          <CanvasArea 
            containerRef={containerRef} 
            canvasRef={canvasRef}
            currentPageObjects={currentPageObjects}
            onUploadClick={triggerUpload}
          />
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
    </div>
  )
}
