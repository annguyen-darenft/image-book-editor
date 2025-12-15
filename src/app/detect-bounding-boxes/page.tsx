"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Upload, ImageIcon, Box } from "lucide-react"
import Link from "next/link"

interface BoundingBox {
  object: string
  position: { x: number; y: number }
  size: { w: number; h: number }
}

interface DetectionResponse {
  boundingBoxes: BoundingBox[]
  totalDetected: number
  timestamp: string
}

export default function DetectBoundingBoxes() {
  const [file, setFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [objects, setObjects] = useState(
    '[{"name":"cậu bé","description":"cậu bé quấn khăn trên đầu"},{"name":"bà cụ","description":"bà cụ tóc trắng"}]'
  )
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DetectionResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
      setResult(null)
      setError(null)
    }
  }

  const handleDetect = async () => {
    if (!file) {
      setError("Please select an image file")
      return
    }

    try {
      JSON.parse(objects)
    } catch (e) {
      setError("Invalid JSON format for objects")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    const formData = new FormData()
    formData.append("file", file)
    formData.append("objects", objects)

    try {
      const response = await fetch("https://image-edit-api.nft2scan.com/api/image/detect-bounding-boxes", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to detect bounding boxes")
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#1a0a2e] to-[#16162a]">
      <header className="h-14 border-b border-[#2a2a4a] bg-[#16162a]/80 backdrop-blur-sm flex items-center justify-between px-6">
        <Link href="/">
          <h1 className="text-xl font-bold bg-gradient-to-r from-[#00d4ff] to-[#00ff88] bg-clip-text text-transparent cursor-pointer hover:opacity-80">
            ← Image Editor
          </h1>
        </Link>
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Box className="w-5 h-5" />
          Bounding Box Detection
        </h2>
      </header>

      <div className="container mx-auto p-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="p-6 bg-[#16162a]/60 border-[#2a2a4a] backdrop-blur-sm">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Upload className="w-6 h-6 text-[#00d4ff]" />
              Upload & Configure
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Image File
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-input"
                  />
                  <label
                    htmlFor="file-input"
                    className="flex items-center justify-center w-full h-40 border-2 border-dashed border-[#2a2a4a] rounded-lg cursor-pointer hover:border-[#00d4ff] transition-colors"
                  >
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <div className="text-center">
                        <ImageIcon className="w-12 h-12 mx-auto text-[#2a2a4a] mb-2" />
                        <p className="text-sm text-gray-400">
                          Click to upload image
                        </p>
                      </div>
                    )}
                  </label>
                </div>
                {file && (
                  <p className="text-xs text-gray-400 mt-2">
                    Selected: {file.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Objects to Detect (JSON)
                </label>
                <Textarea
                  value={objects}
                  onChange={(e) => setObjects(e.target.value)}
                  placeholder='[{"name":"object name","description":"description"}]'
                  className="min-h-[200px] bg-[#2a2a4a] border-[#3a3a5a] text-white font-mono text-sm"
                />
                <p className="text-xs text-gray-400 mt-2">
                  Format: Array of objects with "name" and "description" fields
                </p>
              </div>

              <Button
                onClick={handleDetect}
                disabled={loading || !file}
                className="w-full bg-gradient-to-r from-[#00d4ff] to-[#00ff88] text-black font-semibold hover:opacity-80 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Detecting...
                  </>
                ) : (
                  <>
                    <Box className="w-4 h-4 mr-2" />
                    Detect Bounding Boxes
                  </>
                )}
              </Button>
            </div>
          </Card>

          <Card className="p-6 bg-[#16162a]/60 border-[#2a2a4a] backdrop-blur-sm">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Box className="w-6 h-6 text-[#00ff88]" />
              Detection Results
            </h3>

            <div className="space-y-4">
              {error && (
                <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}

              {result && (
                <>
                  <div className="p-4 bg-[#2a2a4a] rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm text-gray-400">
                        Total Detected:
                      </span>
                      <span className="text-xl font-bold text-[#00d4ff]">
                        {result.totalDetected}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      Timestamp: {new Date(result.timestamp).toLocaleString()}
                    </div>
                  </div>

                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {result.boundingBoxes.map((box, index) => (
                      <div
                        key={index}
                        className="p-4 bg-gradient-to-r from-[#2a2a4a] to-[#1a1a3a] rounded-lg border border-[#3a3a5a] hover:border-[#00d4ff] transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-white">
                            {box.object}
                          </span>
                          <span className="text-xs text-[#00ff88]">
                            #{index + 1}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-400">Position:</span>
                            <div className="text-white font-mono text-xs">
                              x: {box.position.x}, y: {box.position.y}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-400">Size:</span>
                            <div className="text-white font-mono text-xs">
                              w: {box.size.w}, h: {box.size.h}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {!result && !error && !loading && (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Box className="w-16 h-16 text-[#2a2a4a] mb-4" />
                  <p className="text-gray-400">
                    Upload an image and click detect to see results
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
