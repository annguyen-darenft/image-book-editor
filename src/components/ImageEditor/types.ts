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
  dbId?: string
  pageNumber?: number
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

export interface DbBook {
  id: string
  title: string
  description: string | null
  created_at: string
  updated_at: string
  created_by: string
}

export interface DbPage {
  id: string
  book_id: string
  page_number: number
  created_at: string
}

export interface DbImageObject {
  id: string
  page_id: string
  title: string | null
  description: string | null
  type: string
  status: string
  z_index: number
  crop_bounding_info: Record<string, unknown> | null
  real_bounding_info: Record<string, unknown> | null
  crop_result_path: string | null
  generate_result_path: string | null
  replaceable_object_id: string | null
  created_at: string
  updated_at: string
}

export type ReplaceableObjectType = "human" | "animal" | "item"

export interface DbReplaceableTemplate {
  id: string
  book_id: string
  title: string
  description: string | null
  type: ReplaceableObjectType
  created_at: string
}

export const LAYOUT_PRESETS: LayoutPreset[] = [
  { name: "Square", width: 2600, height: 2600 },
  { name: "Landscape", width: 5200, height: 2600 },
]