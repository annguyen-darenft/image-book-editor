"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Download, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

export default function RemoveBackgroundPhotoRoom() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState("")
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
    if (!selectedFile || !apiKey.trim()) {
      setError("Please provide both an image and API key")
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("imageFile", selectedFile)
      formData.append("background.color", "transparent")
      formData.append("background.scaling", "fill")
      formData.append("outputSize", "originalImage")
      formData.append("padding", "0%")
      formData.append("referenceBox", "originalImage")

      const response = await fetch("https://image-api.photoroom.com/v2/edit", {
        method: "POST",
        headers: {
          "x-api-key": apiKey.trim(),
        },
        body: formData,
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Invalid API key")
        } else if (response.status === 429) {
          throw new Error("Rate limit exceeded")
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
  }, [selectedFile, apiKey])

  const downloadResult = useCallback(() => {
    if (!resultUrl) return

    const link = document.createElement("a")
    link.href = resultUrl
    link.download = `photoroom-bg-removed-${Date.now()}.png`
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
    <div className="min-h-screen bg-gradient-to-br from-[#0a0014] via-[#1a0033] to-[#0f0028] text-white">
      <div className="h-16 border-b border-purple-500/20 bg-black/40 backdrop-blur-md flex items-center px-6 gap-4">
        <Link href="/">
          <Button variant="ghost" size="sm" className="text-white hover:bg-purple-500/20">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 bg-clip-text text-transparent">
          PhotoRoom Background Removal
        </h1>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-6 p-5 bg-purple-950/30 border border-purple-500/30 rounded-xl backdrop-blur-sm">
          <Label htmlFor="api-key" className="text-purple-300 font-semibold mb-2 block">
            PhotoRoom API Key
          </Label>
          <Input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your PhotoRoom API key"
            className="bg-black/50 border-purple-500/40 text-white placeholder:text-gray-500 focus:border-purple-400"
          />
          <p className="text-xs text-purple-400/70 mt-2">
            Get your API key from{" "}
            <a
              href="https://www.photoroom.com/api"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-purple-300"
            >
              photoroom.com/api
            </a>
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-purple-300">Original Image</h2>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => !previewUrl && fileInputRef.current?.click()}
              className={`relative aspect-square rounded-2xl border-2 border-dashed transition-all overflow-hidden ${
                previewUrl
                  ? "border-purple-500/40"
                  : "border-purple-500/60 hover:border-pink-400 cursor-pointer"
              }`}
              style={{
                backgroundImage: previewUrl
                  ? "none"
                  : `
                  repeating-conic-gradient(from 0deg, 
                    rgba(139, 92, 246, 0.05) 0deg 90deg, 
                    rgba(236, 72, 153, 0.05) 90deg 180deg)
                `,
                backgroundSize: "30px 30px",
                backgroundColor: "rgba(0, 0, 0, 0.3)",
              }}
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-purple-400">
                  <Upload className="w-16 h-16 mb-4" />
                  <p className="text-xl font-semibold">Drop image here</p>
                  <p className="text-sm text-purple-400/70">or click to browse</p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              onChange={handleFileSelect}
              className="hidden"
            />

            {previewUrl && (
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full border-purple-500/40 text-purple-200 hover:text-white hover:bg-purple-500/20"
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose Different Image
              </Button>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-purple-300">Result</h2>
            <div
              className="relative aspect-square rounded-2xl border-2 border-purple-500/40 overflow-hidden"
              style={{
                backgroundImage: `
                  repeating-conic-gradient(from 0deg, 
                    rgba(139, 92, 246, 0.05) 0deg 90deg, 
                    rgba(236, 72, 153, 0.05) 90deg 180deg)
                `,
                backgroundSize: "30px 30px",
                backgroundColor: "rgba(0, 0, 0, 0.3)",
              }}
            >
              {isProcessing ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Loader2 className="w-16 h-16 animate-spin text-purple-400" />
                  <p className="mt-4 text-purple-300 font-medium">Processing with PhotoRoom AI...</p>
                </div>
              ) : resultUrl ? (
                <img
                  src={resultUrl}
                  alt="Result"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-purple-400/50">
                  <p className="text-lg">Result will appear here</p>
                </div>
              )}
            </div>

            {resultUrl && (
              <Button
                onClick={downloadResult}
                className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 text-white font-semibold hover:opacity-90 shadow-lg shadow-purple-500/30"
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

        <div className="flex gap-4 mt-8">
          <Button
            onClick={processImage}
            disabled={!selectedFile || !apiKey.trim() || isProcessing}
            className="bg-purple-600 text-white font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed px-8"
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
              className="border-purple-500/40 text-purple-200 hover:text-white hover:bg-purple-500/20"
            >
              Reset
            </Button>
          )}
        </div>

        <div className="mt-8 p-6 bg-purple-950/20 border border-purple-500/20 rounded-xl backdrop-blur-sm">
          <h3 className="text-lg font-semibold mb-3 text-purple-300">About PhotoRoom API</h3>
          <ul className="space-y-2 text-sm text-purple-200/80">
            <li>• Supports PNG, JPEG, WEBP, and HEIC formats</li>
            <li>• AI-powered background removal with high accuracy</li>
            <li>• Transparent background output</li>
            <li>• Free tier: 10 API calls for new accounts</li>
            <li>• Pricing: $0.02 per API call</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
