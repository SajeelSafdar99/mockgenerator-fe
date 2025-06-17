"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  Square,
  Circle,
  Type,
  ImageIcon,
  Download,
  Undo,
  Redo,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react"

export default function LogoEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [activeTab, setActiveTab] = useState("shapes")
  const [canvasHistory, setCanvasHistory] = useState<ImageData[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [selectedShape, setSelectedShape] = useState<string | null>(null)
  const [textInput, setTextInput] = useState("")
  const [textStyle, setTextStyle] = useState({
    bold: false,
    italic: false,
    align: "center",
    fontSize: 24,
    color: "#000000",
  })

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = 500
    canvas.height = 500

    // Fill with white background
    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Save initial state
    saveCanvasState()
  }, [])

  const saveCanvasState = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

    // If we're not at the end of the history, remove future states
    if (historyIndex < canvasHistory.length - 1) {
      setCanvasHistory((prev) => prev.slice(0, historyIndex + 1))
    }

    setCanvasHistory((prev) => [...prev, imageData])
    setHistoryIndex((prev) => prev + 1)
  }

  const undo = () => {
    if (historyIndex <= 0) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const newIndex = historyIndex - 1
    ctx.putImageData(canvasHistory[newIndex], 0, 0)
    setHistoryIndex(newIndex)
  }

  const redo = () => {
    if (historyIndex >= canvasHistory.length - 1) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const newIndex = historyIndex + 1
    ctx.putImageData(canvasHistory[newIndex], 0, 0)
    setHistoryIndex(newIndex)
  }

  const addShape = (shape: string) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const size = 100

    ctx.fillStyle = "#3b82f6" // Blue color

    if (shape === "square") {
      ctx.fillRect(centerX - size / 2, centerY - size / 2, size, size)
    } else if (shape === "circle") {
      ctx.beginPath()
      ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2)
      ctx.fill()
    }

    saveCanvasState()
  }

  const addText = () => {
    if (!textInput.trim()) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2

    // Set text style
    ctx.fillStyle = textStyle.color
    let fontStyle = ""
    if (textStyle.bold) fontStyle += "bold "
    if (textStyle.italic) fontStyle += "italic "
    ctx.font = `${fontStyle}${textStyle.fontSize}px sans-serif`
    ctx.textAlign = textStyle.align as CanvasTextAlign

    // Draw text
    ctx.fillText(textInput, centerX, centerY)

    saveCanvasState()
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return

    const file = e.target.files[0]
    const reader = new FileReader()

    reader.onload = (event) => {
      if (!event.target?.result) return

      const img = new Image()
      img.onload = () => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        // Calculate dimensions to fit the image while maintaining aspect ratio
        const maxWidth = canvas.width * 0.8
        const maxHeight = canvas.height * 0.8

        let width = img.width
        let height = img.height

        if (width > maxWidth) {
          height = (maxWidth / width) * height
          width = maxWidth
        }

        if (height > maxHeight) {
          width = (maxHeight / height) * width
          height = maxHeight
        }

        // Center the image
        const x = (canvas.width - width) / 2
        const y = (canvas.height - height) / 2

        // Draw the image
        ctx.drawImage(img, x, y, width, height)

        saveCanvasState()
      }

      img.crossOrigin = "anonymous"
      img.src = event.target.result as string
    }

    reader.readAsDataURL(file)
  }

  const downloadLogo = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Convert canvas to data URL
    const dataUrl = canvas.toDataURL("image/png")

    // Create a download link
    const link = document.createElement("a")
    link.download = "my-logo.png"
    link.href = dataUrl
    link.click()
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="p-4 border-b bg-gray-50">
        <h2 className="font-bold text-lg">Logo Designer</h2>
      </div>

      <div className="p-4">
        <div className="flex justify-center mb-4">
          <canvas
            ref={canvasRef}
            className="border rounded-lg shadow-sm"
            style={{ maxWidth: "100%", height: "auto" }}
          />
        </div>

        <div className="flex justify-between mb-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex <= 0}>
              <Undo className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={redo} disabled={historyIndex >= canvasHistory.length - 1}>
              <Redo className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={downloadLogo} size="sm" className="gap-1">
            <Download className="h-4 w-4" /> Download Logo
          </Button>
        </div>

        <Tabs defaultValue="shapes" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="shapes">Shapes</TabsTrigger>
            <TabsTrigger value="text">Text</TabsTrigger>
            <TabsTrigger value="image">Image</TabsTrigger>
          </TabsList>

          <TabsContent value="shapes" className="p-4 border rounded-lg mt-2">
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 gap-2" onClick={() => addShape("square")}>
                <Square className="h-4 w-4" /> Square
              </Button>
              <Button variant="outline" className="flex-1 gap-2" onClick={() => addShape("circle")}>
                <Circle className="h-4 w-4" /> Circle
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="text" className="p-4 border rounded-lg mt-2 space-y-4">
            <div className="space-y-2">
              <Input placeholder="Enter text" value={textInput} onChange={(e) => setTextInput(e.target.value)} />

              <div className="flex gap-2">
                <Button
                  variant={textStyle.bold ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTextStyle((prev) => ({ ...prev, bold: !prev.bold }))}
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  variant={textStyle.italic ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTextStyle((prev) => ({ ...prev, italic: !prev.italic }))}
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button
                  variant={textStyle.align === "left" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTextStyle((prev) => ({ ...prev, align: "left" }))}
                >
                  <AlignLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant={textStyle.align === "center" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTextStyle((prev) => ({ ...prev, align: "center" }))}
                >
                  <AlignCenter className="h-4 w-4" />
                </Button>
                <Button
                  variant={textStyle.align === "right" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTextStyle((prev) => ({ ...prev, align: "right" }))}
                >
                  <AlignRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex gap-2 items-center">
                <label className="text-sm">Color:</label>
                <input
                  type="color"
                  value={textStyle.color}
                  onChange={(e) => setTextStyle((prev) => ({ ...prev, color: e.target.value }))}
                  className="w-8 h-8 p-0 border-0"
                />
              </div>
            </div>

            <Button onClick={addText} className="w-full gap-2">
              <Type className="h-4 w-4" /> Add Text
            </Button>
          </TabsContent>

          <TabsContent value="image" className="p-4 border rounded-lg mt-2">
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <input type="file" id="image-upload" accept="image/*" onChange={handleImageUpload} className="hidden" />
                <label htmlFor="image-upload">
                  <Button variant="outline" className="w-full gap-2" asChild>
                    <span>
                      <ImageIcon className="h-4 w-4" /> Upload Image
                    </span>
                  </Button>
                </label>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
