import { createBrowserClient } from "@supabase/ssr"
import { DbBook, DbPage, DbImageObject } from "@/components/ImageEditor/types"

function getSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function uploadPageImage(
  pageId: string,
  file: File
): Promise<{ imageUrl: string; imageObject: DbImageObject } | null> {
  const supabase = getSupabaseClient()
  
  const fileExt = file.name.split(".").pop()
  const fileName = `${pageId}/${Date.now()}.${fileExt}`
  
  const { error: uploadError } = await supabase.storage
    .from("book-images")
    .upload(fileName, file)
  
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
      title: file.name.replace(/\.[^/.]+$/, ""),
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
