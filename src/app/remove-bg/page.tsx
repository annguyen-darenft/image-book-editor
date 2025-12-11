"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Upload, Download, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

export default function RemoveBackgroundPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF")
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setResultUrl(null)
      setError(null)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setResultUrl(null)
      setError(null)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }, [])

  const processImage = useCallback(async () => {
    if (!selectedFile) return

    setIsProcessing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("backgroundColor", backgroundColor)

      const response = await fetch("https://image-edit-api.nft2scan.com/api/image/remove-background", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        if (response.status === 400) {
          throw new Error("Invalid file or color format")
        } else if (response.status === 500) {
          throw new Error("Image processing failed")
        }
        throw new Error(`Error: ${response.status}`)
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setResultUrl(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process image")
    } finally {
      setIsProcessing(false)
    }
  }, [selectedFile, backgroundColor])

  const downloadResult = useCallback(() => {
    if (!resultUrl) return

    const link = document.createElement("a")
    link.href = resultUrl
    link.download = `removed-bg-${Date.now()}.png`
    link.click()
  }, [resultUrl])

  const resetAll = useCallback(() => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setResultUrl(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white">
      <div className="h-14 border-b border-[#2a2a4a] bg-[#16162a] flex items-center px-4 gap-4">
        <Link href="/">
          <Button variant="ghost" size="sm" className="text-white hover:bg-[#3a3a5a]">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Editor
          </Button>
        </Link>
        <h1 className="text-xl font-bold bg-gradient-to-r from-[#00d4ff] to-[#00ff88] bg-clip-text text-transparent">
          Remove Background
        </h1>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[#8b8bab]">Original Image</h2>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => !previewUrl && fileInputRef.current?.click()}
              className={`relative aspect-square rounded-xl border-2 border-dashed transition-all overflow-hidden ${
                previewUrl
                  ? "border-[#2a2a4a]"
                  : "border-[#4a4a6a] hover:border-[#00d4ff] cursor-pointer"
              }`}
              style={{
                backgroundImage: previewUrl ? "none" : `
                  linear-gradient(45deg, #1a1a2e 25%, transparent 25%),
                  linear-gradient(-45deg, #1a1a2e 25%, transparent 25%),
                  linear-gradient(45deg, transparent 75%, #1a1a2e 75%),
                  linear-gradient(-45deg, transparent 75%, #1a1a2e 75%)
                `,
                backgroundSize: "20px 20px",
                backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                backgroundColor: "#0a0a14"
              }}
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-[#6b6b8d]">
                  <Upload className="w-12 h-12 mb-4" />
                  <p className="text-lg font-medium">Drop image here</p>
                  <p className="text-sm">or click to browse</p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />

            {previewUrl && (
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full border-[#2a2a4a] text-white hover:bg-[#2a2a4a]"
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose Different Image
              </Button>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[#8b8bab]">Result</h2>
            <div
              className="relative aspect-square rounded-xl border-2 border-[#2a2a4a] overflow-hidden"
              style={{
                backgroundImage: `
                  linear-gradient(45deg, #1a1a2e 25%, transparent 25%),
                  linear-gradient(-45deg, #1a1a2e 25%, transparent 25%),
                  linear-gradient(45deg, transparent 75%, #1a1a2e 75%),
                  linear-gradient(-45deg, transparent 75%, #1a1a2e 75%)
                `,
                backgroundSize: "20px 20px",
                backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                backgroundColor: "#0a0a14"
              }}
            >
              {isProcessing ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Loader2 className="w-12 h-12 animate-spin text-[#00d4ff]" />
                  <p className="mt-4 text-[#8b8bab]">Processing...</p>
                </div>
              ) : resultUrl ? (
                <img
                  src={resultUrl}
                  alt="Result"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-[#4a4a6a]">
                  <p className="text-lg">Result will appear here</p>
                </div>
              )}
            </div>

            {resultUrl && (
              <Button
                onClick={downloadResult}
                className="w-full bg-gradient-to-r from-[#00d4ff] to-[#00ff88] text-black font-semibold hover:opacity-90"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PNG
              </Button>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
            {error}
          </div>
        )}

        <div className="mt-8 p-6 bg-[#16162a] rounded-xl border border-[#2a2a4a]">
          <h3 className="text-lg font-semibold mb-4">Settings</h3>

          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <label className="text-[#8b8bab]">Background Color to Remove:</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border border-[#2a2a4a]"
                />
                <input
                  type="text"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  placeholder="#FFFFFF"
                  className="w-24 px-3 py-2 bg-[#0a0a14] border border-[#2a2a4a] rounded text-white text-sm"
                />
              </div>
            </div>

            <div className="flex gap-2">
              {["#FFFFFF", "#000000", "#FF0000", "#00FF00", "#0000FF"].map((color) => (
                <button
                  key={color}
                  onClick={() => setBackgroundColor(color)}
                  className={`w-8 h-8 rounded border-2 transition-all ${
                    backgroundColor === color ? "border-[#00d4ff]" : "border-[#2a2a4a]"
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <Button
              onClick={processImage}
              disabled={!selectedFile || isProcessing}
              className="bg-[#00d4ff] text-black font-semibold hover:bg-[#00d4ff]/80 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Remove Background"
              )}
            </Button>

            {(previewUrl || resultUrl) && (
              <Button
                onClick={resetAll}
                variant="outline"
                className="border-[#2a2a4a] text-white hover:bg-[#2a2a4a]"
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
