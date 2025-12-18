import { createBrowserClient } from "@supabase/ssr"
import { DbBook, DbPage, DbImageObject } from "@/components/ImageEditor/types"

function getSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
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
