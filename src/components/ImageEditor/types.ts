import * as fabric from "fabric"

export interface Layer {
  id: string
  name: string
  object: fabric.FabricImage
  visible: boolean
}

export type LayoutPreset = {
  name: string
  width: number
  height: number
}

export interface PageData {
  id: string
  name: string
  canvasJSON: string
  thumbnail: string
  layers: Layer[]
}

export interface ObjectSheet {
  id: string
  name: string
  imageUrl: string
  imageX: number
  imageY: number
  imageWidth: number
  imageHeight: number
}

export interface EditorObject {
  id: string
  name: string
  sheets: ObjectSheet[]
  activeSheetIndex: number
}

export const LAYOUT_PRESETS: LayoutPreset[] = [
  { name: "Square", width: 2000, height: 2000 },
  { name: "Landscape", width: 4000, height: 2000 },
]