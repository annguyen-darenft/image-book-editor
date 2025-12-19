import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

interface UploadPageImageRequest {
  page_id: string;
  image_data: string; // base64 encoded image
  layout?: {
    width?: number;
    height?: number;
  };
}

function getSupabaseServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
}

async function resizeImageToFitCanvas(
  imageBuffer: Buffer,
  canvasWidth: number,
  canvasHeight: number
): Promise<Buffer> {
  const metadata = await sharp(imageBuffer).metadata();
  const imgWidth = metadata.width || 1000;
  const imgHeight = metadata.height || 1000;

  const imgRatio = imgWidth / imgHeight;
  const canvasRatio = canvasWidth / canvasHeight;

  let drawWidth: number;
  let drawHeight: number;
  let offsetX: number;
  let offsetY: number;

  if (imgRatio > canvasRatio) {
    drawWidth = canvasWidth;
    drawHeight = canvasWidth / imgRatio;
    offsetX = 0;
    offsetY = (canvasHeight - drawHeight) / 2;
  } else {
    drawHeight = canvasHeight;
    drawWidth = canvasHeight * imgRatio;
    offsetX = (canvasWidth - drawWidth) / 2;
    offsetY = 0;
  }

  // Create a white canvas
  const canvas = await sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .png()
    .toBuffer();

  // Resize the image and composite onto the canvas
  const resizedImage = await sharp(imageBuffer)
    .resize(Math.round(drawWidth), Math.round(drawHeight), {
      fit: "contain",
    })
    .toBuffer();

  const result = await sharp(canvas)
    .composite([
      {
        input: resizedImage,
        top: Math.round(offsetY),
        left: Math.round(offsetX),
      },
    ])
    .png()
    .toBuffer();

  return result;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as UploadPageImageRequest;
    const { page_id, image_data, layout } = body;

    if (!page_id) {
      return NextResponse.json(
        { error: "page_id is required" },
        { status: 400 }
      );
    }

    if (!image_data) {
      return NextResponse.json(
        { error: "image_data is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();

    // Decode base64 image
    const base64Data = image_data.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");

    // Get canvas dimensions from layout or use defaults
    const canvasWidth = layout?.width || 2000;
    const canvasHeight = layout?.height || 2000;

    // Resize image to fit canvas
    const resizedImageBuffer = await resizeImageToFitCanvas(
      imageBuffer,
      canvasWidth,
      canvasHeight
    );

    // Upload to Supabase storage
    const fileName = `${page_id}/${Date.now()}.png`;
    const { error: uploadError } = await supabase.storage
      .from("book-images")
      .upload(fileName, resizedImageBuffer, { contentType: "image/png" });

    if (uploadError) {
      console.error("Error uploading image:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload image to storage", details: uploadError },
        { status: 500 }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("book-images").getPublicUrl(fileName);

    // Update pages table
    const { error: updatePageError } = await supabase
      .from("pages")
      .update({ original_image: publicUrl })
      .eq("id", page_id);

    if (updatePageError) {
      console.error("Error updating page:", updatePageError);
      return NextResponse.json(
        { error: "Failed to update page", details: updatePageError },
        { status: 500 }
      );
    }

    // Create image_object record
    const { data: imageObject, error: insertError } = await supabase
      .from("image_objects")
      .insert({
        page_id: page_id,
        title: "background",
        type: "background",
        crop_result_path: publicUrl,
        z_index: 0,
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating image object:", insertError);
      return NextResponse.json(
        { error: "Failed to create image object", details: insertError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      image_url: publicUrl,
      image_object: imageObject,
    });
  } catch (error) {
    console.error("Error in upload-page-image API:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
