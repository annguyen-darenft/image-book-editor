"use client"

import { useState, useRef, useCallback } from "react"
import { Upload, Download, Loader2, ArrowLeft, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function RemoveBgPage() {
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setError(null)
    setProcessedImage(null)

    const reader = new FileReader()
    reader.onload = (event) => {
      setOriginalImage(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file || !file.type.startsWith("image/")) return

    setFileName(file.name)
    setError(null)
    setProcessedImage(null)

    const reader = new FileReader()
    reader.onload = (event) => {
      setOriginalImage(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const processImage = useCallback(async () => {
    if (!originalImage) return

    setIsProcessing(true)
    setError(null)

    try {
      const response = await fetch(originalImage)
      const blob = await response.blob()
      const file = new File([blob], fileName || "image.png", { type: blob.type })

      const formData = new FormData()
      formData.append("image", file)

      const apiResponse = await fetch("/api/remove-background", {
        method: "POST",
        body: formData,
      })

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json()
        throw new Error(errorData.error || "Failed to process image")
      }

      const resultBlob = await apiResponse.blob()
      const resultUrl = URL.createObjectURL(resultBlob)
      setProcessedImage(resultUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsProcessing(false)
    }
  }, [originalImage, fileName])

  const downloadImage = useCallback(() => {
    if (!processedImage) return

    const link = document.createElement("a")
    link.href = processedImage
    link.download = fileName.replace(/\.[^/.]+$/, "") + "-transparent.png"
    link.click()
  }, [processedImage, fileName])

  const reset = useCallback(() => {
    setOriginalImage(null)
    setProcessedImage(null)
    setError(null)
    setFileName("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      <header className="h-16 border-b border-[#2a2a4a] bg-[#16162a] flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-[#8b8bab] hover:text-white hover:bg-[#2a2a4a]">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Editor
            </Button>
          </Link>
          <h1 className="text-xl font-bold bg-gradient-to-r from-[#00d4ff] to-[#00ff88] bg-clip-text text-transparent">
            Remove Background
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-5xl">
        {!originalImage ? (
          <div
            className="border-2 border-dashed border-[#3a3a5a] rounded-2xl p-16 text-center hover:border-[#00d4ff]/50 transition-colors cursor-pointer bg-[#16162a]/50"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#00d4ff]/20 to-[#00ff88]/20 flex items-center justify-center">
              <Upload className="w-10 h-10 text-[#00d4ff]" />
            </div>
            <h2 className="text-2xl font-semibold text-white mb-3">
              Upload an Image
            </h2>
            <p className="text-[#6b6b8d] mb-6">
              Drag and drop or click to select
            </p>
            <p className="text-sm text-[#4a4a6a]">
              Supports PNG, JPG, WEBP
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-[#8b8bab] uppercase tracking-wider">Original</h3>
                <div className="relative aspect-square rounded-xl overflow-hidden bg-[#16162a] border border-[#2a2a4a]">
                  <img
                    src={originalImage}
                    alt="Original"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium text-[#8b8bab] uppercase tracking-wider">Result</h3>
                <div
                  className="relative aspect-square rounded-xl overflow-hidden border border-[#2a2a4a]"
                  style={{
                    backgroundImage: `
                      linear-gradient(45deg, #2a2a4a 25%, transparent 25%),
                      linear-gradient(-45deg, #2a2a4a 25%, transparent 25%),
                      linear-gradient(45deg, transparent 75%, #2a2a4a 75%),
                      linear-gradient(-45deg, transparent 75%, #2a2a4a 75%)
                    `,
                    backgroundSize: "20px 20px",
                    backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                    backgroundColor: "#16162a",
                  }}
                >
                  {processedImage ? (
                    <img
                      src={processedImage}
                      alt="Processed"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {isProcessing ? (
                        <Loader2 className="w-12 h-12 text-[#00d4ff] animate-spin" />
                      ) : (
                        <ImageIcon className="w-16 h-16 text-[#3a3a5a]" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-center">
                {error}
              </div>
            )}

            <div className="flex flex-wrap gap-4 justify-center">
              <Button
                onClick={reset}
                variant="outline"
                className="border-[#3a3a5a] text-[#8b8bab] hover:bg-[#2a2a4a] hover:text-white"
              >
                Upload New Image
              </Button>

              {!processedImage && (
                <Button
                  onClick={processImage}
                  disabled={isProcessing}
                  className="bg-gradient-to-r from-[#00d4ff] to-[#00ff88] text-black font-semibold hover:opacity-90 disabled:opacity-50"
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
              )}

              {processedImage && (
                <Button
                  onClick={downloadImage}
                  className="bg-[#00d4ff] text-black font-semibold hover:bg-[#00d4ff]/80"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PNG
                </Button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default RemoveBgPage