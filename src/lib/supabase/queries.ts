import { createBrowserClient } from "@supabase/ssr"
import { DbBook, DbPage, DbImageObject, DbReplaceableTemplate, DbBoundingBox, LayoutPreset, ReplaceableObjectType } from "@/components/ImageEditor/types"

function getSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

async function resizeImageToFitCanvas(
  file: File,
  canvasWidth: number,
  canvasHeight: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = canvasWidth
      canvas.height = canvasHeight
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Failed to get canvas context"))
        return
      }

      const imgRatio = img.width / img.height
      const canvasRatio = canvasWidth / canvasHeight

      let drawWidth: number
      let drawHeight: number
      let offsetX: number
      let offsetY: number

      if (imgRatio > canvasRatio) {
        drawWidth = canvasWidth
        drawHeight = canvasWidth / imgRatio
        offsetX = 0
        offsetY = (canvasHeight - drawHeight) / 2
      } else {
        drawHeight = canvasHeight
        drawWidth = canvasHeight * imgRatio
        offsetX = (canvasWidth - drawWidth) / 2
        offsetY = 0
      }

      ctx.fillStyle = "#FFFFFF"
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error("Failed to create blob"))
          }
        },
        "image/png",
        1
      )
    }
    img.onerror = () => reject(new Error("Failed to load image"))
    img.src = URL.createObjectURL(file)
  })
}

export async function uploadPageImage(
  pageId: string,
  file: File,
  layout?: LayoutPreset | null
): Promise<{ imageUrl: string; imageObject: DbImageObject } | null> {
  const supabase = getSupabaseClient()
  
  const canvasWidth = layout?.width || 2000
  const canvasHeight = layout?.height || 2000
  
  let uploadFile: Blob | File = file
  try {
    uploadFile = await resizeImageToFitCanvas(file, canvasWidth, canvasHeight)
  } catch (err) {
    console.error("Error resizing image:", err)
  }
  
  const fileName = `${pageId}/${Date.now()}.png`
  
  const { error: uploadError } = await supabase.storage
    .from("book-images")
    .upload(fileName, uploadFile, { contentType: "image/png" })
  
  if (uploadError) {
    console.error("Error uploading image:", uploadError)
    return null
  }
  
  const { data: { publicUrl } } = supabase.storage
    .from("book-images")
    .getPublicUrl(fileName)
  
  const { error: updatePageError } = await supabase
    .from("pages")
    .update({ original_image: publicUrl })
    .eq("id", pageId)
  
  if (updatePageError) {
    console.error("Error updating page:", updatePageError)
  }
  
  const { data: imageObject, error: insertError } = await supabase
    .from("image_objects")
    .insert({
      page_id: pageId,
      title: "background",
      type: "background",
      crop_result_path: publicUrl,
      z_index: 0,
      status: "pending",
    })
    .select()
    .single()
  
  if (insertError) {
    console.error("Error creating image object:", insertError)
    return null
  }
  
    return { imageUrl: publicUrl, imageObject }
}

export async function deletePageImageObject(objectId: string): Promise<boolean> {
  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from("image_objects")
    .delete()
    .eq("id", objectId)
  
  if (error) {
    console.error("Error deleting image object:", error)
    return false
  }
  return true
}

export async function getFirstBook(): Promise<DbBook | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .single()
  
  if (error) {
    console.error("Error fetching book:", error)
    return null
  }
  return data
}

export async function getBookPages(bookId: string): Promise<DbPage[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .eq("book_id", bookId)
    .order("page_number", { ascending: true })
  
  if (error) {
    console.error("Error fetching pages:", error)
    return []
  }
  return data || []
}

export async function getPageImageObjects(pageId: string): Promise<DbImageObject[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("image_objects")
    .select("*")
    .eq("page_id", pageId)
    .order("z_index", { ascending: true })
  
  if (error) {
    console.error("Error fetching image objects:", error)
    return []
  }
  return data || []
}

export async function getReplaceableTemplates(bookId: string): Promise<DbReplaceableTemplate[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("replaceable_object_templates")
    .select("*")
    .eq("book_id", bookId)
    .order("created_at", { ascending: true })
  
  if (error) {
    console.error("Error fetching replaceable templates:", error)
    return []
  }
  return data || []
}

export async function createReplaceableTemplate(
  bookId: string,
  title: string,
  description: string,
  type: ReplaceableObjectType
): Promise<DbReplaceableTemplate | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("replaceable_object_templates")
    .insert({
      book_id: bookId,
      title,
      description: description || null,
      type,
    })
    .select()
    .single()
  
  if (error) {
    console.error("Error creating replaceable template:", error)
    return null
  }
  return data
}

export async function deleteReplaceableTemplate(templateId: string): Promise<boolean> {
  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from("replaceable_object_templates")
    .delete()
    .eq("id", templateId)

  if (error) {
    console.error("Error deleting replaceable template:", error)
    return false
  }
  return true
}

export async function getPageBoundingBoxes(pageId: string): Promise<DbBoundingBox[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("page_bounding_boxes")
    .select("*")
    .eq("page_id", pageId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching page bounding boxes:", error)
    return []
  }
  return data || []
}

export async function saveBoundingBox(
  pageId: string,
  title: string,
  type: string,
  boundingInfo: { position: { x: number; y: number }; size: { w: number; h: number } }
): Promise<DbBoundingBox | null> {
  const supabase = getSupabaseClient()

  // Check if a bounding box with this title already exists for this page
  const { data: existing } = await supabase
    .from("page_bounding_boxes")
    .select("id")
    .eq("page_id", pageId)
    .eq("title", title)
    .single()

  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from("page_bounding_boxes")
      .update({
        type,
        bounding_info: boundingInfo,
      })
      .eq("id", existing.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating bounding box:", error)
      return null
    }
    return data
  } else {
    // Insert new
    const { data, error } = await supabase
      .from("page_bounding_boxes")
      .insert({
        page_id: pageId,
        title,
        type,
        bounding_info: boundingInfo,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating bounding box:", error)
      return null
    }
    return data
  }
}

export async function updatePageStatus(
  pageId: string,
  status: "pending" | "processing" | "complete"
): Promise<boolean> {
  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from("pages")
    .update({ status })
    .eq("id", pageId)

  if (error) {
    console.error("Error updating page status:", error)
    return false
  }
  return true
}
