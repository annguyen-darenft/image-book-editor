import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";

interface ReplaceableObject {
  title: string;
  description: string | null;
  type: string;
}

interface BoundingBoxResult {
  label: string;
  type: "object" | "cover";
  box_2d: [number, number, number, number];
}

interface TransformedBoundingBox {
  title: string;
  type: string;
  size: {
    h: number;
    w: number;
  };
  position: {
    x: number;
    y: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const imageUrl = body.image_url as string | null;
    const objects = body.objects as ReplaceableObject[] | null;

    if (!imageUrl) {
      return NextResponse.json(
        { error: "No image_url provided" },
        { status: 400 }
      );
    }

    if (!objects || objects.length === 0) {
      return NextResponse.json(
        { error: "No objects provided" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Fetch image from URL
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch image from URL" },
        { status: 400 }
      );
    }

    const arrayBuffer = await imageResponse.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    // Get original image dimensions
    const metadata = await sharp(imageBuffer).metadata();
    const imageWidth = metadata.width || 1000;
    const imageHeight = metadata.height || 1000;

    // Resize image to max 1024px on longest side to reduce API payload
    const maxDimension = 1024;
    const shouldResize =
      imageWidth > maxDimension || imageHeight > maxDimension;

    let processedBuffer: any = imageBuffer;
    if (shouldResize) {
      processedBuffer = await sharp(imageBuffer)
        .resize(maxDimension, maxDimension, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: 90 })
        .toBuffer();
    }

    const base64Image = processedBuffer.toString("base64");

    // Detect mime type from response headers or default to jpeg
    const contentType = imageResponse.headers.get("content-type");
    const mimeType = shouldResize ? "image/jpeg" : contentType || "image/jpeg";

    const objectsList = objects
      .map(
        (obj, idx) =>
          `- ${idx + 1}: ${obj.title}. Mô tả: ${obj.description || "Không có"}`
      )
      .join("\n");

    const prompt = `Hãy phân tích tệp hình ảnh gốc.
Nhiệm vụ 1: xác định khung hình chữ nhật bao quanh (bounding box) cho các đối tượng chính:

${objectsList}

Yêu cầu về bounding box: phải bao bọc 'khít' nhất có thể, nhưng phải chứa toàn bộ các yếu tố sau:
- Toàn bộ cơ thể của nhân vật.
- Bóng đổ của nhân vật đó trên mặt đất.
- Các đối tượng vừa chắn lên nhân vật nhưng cũng vừa bị một phần nhân vật che lên (ví dụ đang ôm quả bóng, tay phải che lên quả bóng nhưng bóng che lên tay trái)

Nhiệm vụ 2: xác định bounding box của các vật thể tiền cảnh đang chắn lên bất kì bộ phận nào của các nhân vật trên.
Yêu cầu: bounding box phải chứa toàn bộ ảnh của vật thể tiền cảnh đó.

YÊU CẦU TỐI QUAN TRỌNG: Trả về kết quả là một mảng JSON theo cấu trúc sau:
[
 {
  "label": "Tên object đó (nếu object là đối tượng chính) hoặc tên của vật thể tiền cảnh",
  "type": "'object' nếu đó là đối tượng, 'cover' nếu là vật thể tiền cảnh",
  "box_2d": [y_min, x_min, y_max, x_max]
 }
]
Lưu ý:
- Tọa độ box_2d phải là số nguyên trong khoảng [0, 1000] (normalized coordinates).`;

    // console.log("prompt: ", prompt);
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: [
        prompt,
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Image,
          },
        },
      ],
      config: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "";

    let rawBoxes: BoundingBoxResult[];
    try {
      rawBoxes = JSON.parse(text);
      console.log("rawBoxes: ", rawBoxes);
    } catch {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        rawBoxes = JSON.parse(jsonMatch[0]);
      } else {
        return NextResponse.json(
          { error: "Failed to parse AI response", raw: text },
          { status: 500 }
        );
      }
    }

    const boundingBoxes: TransformedBoundingBox[] = rawBoxes.map((box) => {
      const [yMin, xMin, yMax, xMax] = box.box_2d;

      const x = Math.round((xMin / 1000) * imageWidth);
      const y = Math.round((yMin / 1000) * imageHeight);
      const w = Math.round(((xMax - xMin) / 1000) * imageWidth);
      const h = Math.round(((yMax - yMin) / 1000) * imageHeight);

      return {
        title: box.label,
        type: box.type,
        size: { h, w },
        position: { x, y },
      };
    });

    return NextResponse.json({ boundingBoxes });
  } catch (error) {
    console.error("Error detecting bounding boxes:", error);
    return NextResponse.json(
      { error: "Failed to detect bounding boxes", details: String(error) },
      { status: 500 }
    );
  }
}
