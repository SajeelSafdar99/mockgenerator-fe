"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
  ArrowLeft,
  Maximize2,
  Layers,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  MoreHorizontal,
  Grid3X3,
  RotateCcw,
  Trash2,
} from "lucide-react"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import LoginModal from "@/components/login-modal"

// Enhanced element interface for logo designer
interface DesignElement {
  id: string
  type: "shape" | "text" | "image"
  position: { x: number; y: number }
  size: { width: number; height: number }
  rotation: number
  zIndex: number
  locked: boolean
  visible: boolean
  maintainAspectRatio: boolean
  // Shape-specific properties
  shapeType?: "rectangle" | "circle" | "triangle"
  fillColor?: string
  strokeColor?: string
  strokeWidth?: number
  // Text-specific properties
  text?: string
  fontSize?: number
  fontFamily?: string
  fontWeight?: string
  fontStyle?: string
  textAlign?: string
  textColor?: string
  // Image-specific properties
  imageUrl?: string
  imageFile?: File
}

// Canvas size presets for logo designer
const LOGO_CANVAS_PRESETS = {
  square: { width: 512, height: 512, name: "Square Logo (512×512)" },
  wide: { width: 800, height: 400, name: "Wide Logo (800×400)" },
  tall: { width: 400, height: 800, name: "Tall Logo (400×800)" },
  favicon: { width: 64, height: 64, name: "Favicon (64×64)" },
  social: { width: 1200, height: 630, name: "Social Media (1200×630)" },
  custom: { width: 500, height: 500, name: "Custom Size" },
}

export default function LogoDesignerPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [elements, setElements] = useState<DesignElement[]>([])
  const [selectedElementIndex, setSelectedElementIndex] = useState<number | null>(null)
  const [selectedElements, setSelectedElements] = useState<number[]>([])
  const [canvasHistory, setCanvasHistory] = useState<ImageData[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [activeTab, setActiveTab] = useState("shapes")
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [showResizeDialog, setShowResizeDialog] = useState(false)
  const [canvasSize, setCanvasSize] = useState({ width: 500, height: 500 })
  const [selectedPreset, setSelectedPreset] = useState("square")
  const [customSize, setCustomSize] = useState({ width: 500, height: 500 })
  const [scaleElements, setScaleElements] = useState(true)
  const [showGrid, setShowGrid] = useState(false)
  const [snapToGrid, setSnapToGrid] = useState(false)
  const [gridSize, setGridSize] = useState(20)
  const [mouseDown, setMouseDown] = useState(false)
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 })
  const [loadedImages, setLoadedImages] = useState<Map<string, HTMLImageElement>>(new Map())
  const { user } = useAuth()
  const [showLoginModal, setShowLoginModal] = useState(false)

  // Text input state
  const [textInput, setTextInput] = useState("")
  const [textStyle, setTextStyle] = useState({
    fontSize: 24,
    fontFamily: "Arial",
    fontWeight: "normal",
    fontStyle: "normal",
    textAlign: "center",
    color: "#000000",
  })

  // Shape input state
  const [shapeStyle, setShapeStyle] = useState({
    fillColor: "#3b82f6",
    strokeColor: "#000000",
    strokeWidth: 2,
  })

  const selectedElement = selectedElementIndex !== null ? elements[selectedElementIndex] : null

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = canvasSize.width
    canvas.height = canvasSize.height

    // Fill with white background
    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    saveCanvasState()
  }, [canvasSize])

  // Redraw canvas when elements change
  useEffect(() => {
    redrawCanvas()
  }, [elements, selectedElementIndex, selectedElements, showGrid])

  const redrawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas with white background
    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw grid if enabled
    if (showGrid) {
      ctx.strokeStyle = "rgba(0,0,0,0.1)"
      ctx.lineWidth = 1
      for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }
      for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }
    }

    // Sort elements by z-index and draw visible ones
    const sortedElements = elements
        .map((el, index) => ({ el, index }))
        .filter(({ el }) => el.visible)
        .sort((a, b) => a.el.zIndex - b.el.zIndex)

    // Draw elements
    sortedElements.forEach(({ el, index }) => {
      drawElement(ctx, el, index)
    })

    // Draw selection indicators on top
    sortedElements.forEach(({ el, index }) => {
      if (selectedElementIndex === index || selectedElements.includes(index)) {
        drawSelectionIndicator(ctx, el, index)
      }
    })
  }

  const drawElement = (ctx: CanvasRenderingContext2D, element: DesignElement, originalIndex: number) => {
    ctx.save()

    // Apply transformations
    ctx.translate(element.position.x + element.size.width / 2, element.position.y + element.size.height / 2)
    ctx.rotate((element.rotation * Math.PI) / 180)
    ctx.translate(-element.size.width / 2, -element.size.height / 2)

    // Draw based on element type
    switch (element.type) {
      case "shape":
        drawShape(ctx, element)
        break
      case "text":
        drawText(ctx, element)
        break
      case "image":
        drawImage(ctx, element)
        break
    }

    ctx.restore()
  }

  const drawShape = (ctx: CanvasRenderingContext2D, element: DesignElement) => {
    ctx.fillStyle = element.fillColor || "#3b82f6"
    ctx.strokeStyle = element.strokeColor || "#000000"
    ctx.lineWidth = element.strokeWidth || 2

    switch (element.shapeType) {
      case "rectangle":
        ctx.fillRect(0, 0, element.size.width, element.size.height)
        if (element.strokeWidth && element.strokeWidth > 0) {
          ctx.strokeRect(0, 0, element.size.width, element.size.height)
        }
        break
      case "circle":
        const radius = Math.min(element.size.width, element.size.height) / 2
        ctx.beginPath()
        ctx.arc(element.size.width / 2, element.size.height / 2, radius, 0, Math.PI * 2)
        ctx.fill()
        if (element.strokeWidth && element.strokeWidth > 0) {
          ctx.stroke()
        }
        break
    }
  }

  const drawText = (ctx: CanvasRenderingContext2D, element: DesignElement) => {
    ctx.fillStyle = element.textColor || "#000000"
    ctx.font = `${element.fontStyle || "normal"} ${element.fontWeight || "normal"} ${element.fontSize || 24}px ${element.fontFamily || "Arial"}`

    // Set text alignment and baseline
    ctx.textAlign = (element.textAlign as CanvasTextAlign) || "left"
    ctx.textBaseline = "top"

    let x = 0
    if (element.textAlign === "center") {
      x = element.size.width / 2
    } else if (element.textAlign === "right") {
      x = element.size.width
    }

    const y = 0 // Start from top of the element bounds

    ctx.fillText(element.text || "", x, y)
  }

  const drawImage = (ctx: CanvasRenderingContext2D, element: DesignElement) => {
    if (element.imageUrl) {
      const loadedImg = loadedImages.get(element.imageUrl)

      if (loadedImg) {
        // Image is already loaded, draw it immediately
        ctx.drawImage(loadedImg, 0, 0, element.size.width, element.size.height)
      } else {
        // Draw placeholder while loading
        ctx.fillStyle = "#f3f4f6"
        ctx.fillRect(0, 0, element.size.width, element.size.height)
        ctx.strokeStyle = "#d1d5db"
        ctx.lineWidth = 2
        ctx.strokeRect(0, 0, element.size.width, element.size.height)

        // Draw "Loading..." text
        ctx.fillStyle = "#6b7280"
        ctx.font = "14px Arial"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText("Loading...", element.size.width / 2, element.size.height / 2)
      }
    }
  }

  const drawSelectionIndicator = (ctx: CanvasRenderingContext2D, element: DesignElement, originalIndex: number) => {
    const isSelected = selectedElementIndex === originalIndex
    const isMultiSelected = selectedElements.includes(originalIndex)

    if (!isSelected && !isMultiSelected) return

    ctx.save()

    // Don't apply rotation for selection indicators - draw them in screen space
    const x = element.position.x
    const y = element.position.y
    const width = element.size.width
    const height = element.size.height

    // Draw selection border
    ctx.strokeStyle = isSelected ? "#3b82f6" : "#60a5fa"
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.strokeRect(x - 2, y - 2, width + 4, height + 4)
    ctx.setLineDash([])

    // Draw resize handles for single selection
    if (isSelected && !element.locked) {
      const handleSize = 8
      const handles = [
        { x: x - handleSize / 2, y: y - handleSize / 2 }, // top-left
        { x: x + width - handleSize / 2, y: y - handleSize / 2 }, // top-right
        { x: x - handleSize / 2, y: y + height - handleSize / 2 }, // bottom-left
        { x: x + width - handleSize / 2, y: y + height - handleSize / 2 }, // bottom-right
        { x: x + width / 2 - handleSize / 2, y: y - handleSize / 2 }, // top-center
        { x: x + width / 2 - handleSize / 2, y: y + height - handleSize / 2 }, // bottom-center
        { x: x - handleSize / 2, y: y + height / 2 - handleSize / 2 }, // left-center
        { x: x + width - handleSize / 2, y: y + height / 2 - handleSize / 2 }, // right-center
      ]

      handles.forEach((handle) => {
        ctx.fillStyle = "#3b82f6"
        ctx.fillRect(handle.x, handle.y, handleSize, handleSize)
        ctx.strokeStyle = "#ffffff"
        ctx.lineWidth = 1
        ctx.strokeRect(handle.x, handle.y, handleSize, handleSize)
      })
    }

    ctx.restore()
  }

  const saveCanvasState = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

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

  const createElement = (type: DesignElement["type"], additionalProps: Partial<DesignElement> = {}): DesignElement => {
    const newZIndex = Math.max(...elements.map((el) => el.zIndex), 0) + 1
    const defaultPosition = { x: canvasSize.width / 2 - 50, y: canvasSize.height / 2 - 50 }

    return {
      id: Date.now().toString(),
      type,
      position: defaultPosition,
      size: { width: 100, height: 100 },
      rotation: 0,
      zIndex: newZIndex,
      locked: false,
      visible: true,
      maintainAspectRatio: true,
      ...additionalProps, // This will override position if provided
    }
  }

  const addShape = (shapeType: "rectangle" | "circle") => {
    const newElement = createElement("shape", {
      shapeType,
      fillColor: shapeStyle.fillColor,
      strokeColor: shapeStyle.strokeColor,
      strokeWidth: shapeStyle.strokeWidth,
    })

    setElements([...elements, newElement])
    setSelectedElementIndex(elements.length)
    saveCanvasState()

    toast({
      title: "Shape Added",
      description: `${shapeType} has been added to your design.`,
    })
  }

  const addText = () => {
    if (!textInput.trim()) {
      toast({
        title: "Enter Text",
        description: "Please enter some text before adding it to the canvas.",
        variant: "destructive",
      })
      return
    }

    // Create a temporary canvas to measure text dimensions
    const tempCanvas = document.createElement("canvas")
    const tempCtx = tempCanvas.getContext("2d")
    let textWidth = 200 // default width
    let textHeight = textStyle.fontSize + 10 // default height

    if (tempCtx) {
      tempCtx.font = `${textStyle.fontStyle} ${textStyle.fontWeight} ${textStyle.fontSize}px ${textStyle.fontFamily}`
      const metrics = tempCtx.measureText(textInput)
      textWidth = Math.max(metrics.width + 20, 100) // Add some padding
      textHeight = textStyle.fontSize + 10
    }

    const newElement = createElement("text", {
      text: textInput,
      fontSize: textStyle.fontSize,
      fontFamily: textStyle.fontFamily,
      fontWeight: textStyle.fontWeight,
      fontStyle: textStyle.fontStyle,
      textAlign: textStyle.textAlign,
      textColor: textStyle.color,
      size: { width: textWidth, height: textHeight },
    })

    setElements([...elements, newElement])
    setSelectedElementIndex(elements.length)
    setTextInput("")
    saveCanvasState()

    toast({
      title: "Text Added",
      description: "Text has been added to your design.",
    })
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return

    const file = e.target.files[0]
    const reader = new FileReader()

    reader.onload = (event) => {
      if (!event.target?.result) return

      const imageUrl = event.target.result as string
      const img = new Image()

      img.onload = () => {
        const maxSize = 200
        let width = img.width
        let height = img.height

        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height)
          width *= ratio
          height *= ratio
        }

        // Store the loaded image
        setLoadedImages((prev) => new Map(prev).set(imageUrl, img))

        const newElement = createElement("image", {
          imageUrl: imageUrl,
          imageFile: file,
          size: { width, height },
          // Center the image on canvas
          position: {
            x: canvasSize.width / 2 - width / 2,
            y: canvasSize.height / 2 - height / 2,
          },
        })

        setElements([...elements, newElement])
        setSelectedElementIndex(elements.length)
        saveCanvasState()

        toast({
          title: "Image Added",
          description: "Image has been added to your design.",
        })
      }

      img.src = imageUrl
    }

    reader.readAsDataURL(file)
  }

  // Layer management functions
  const moveLayerUp = (index: number) => {
    const newElements = [...elements]
    const currentZIndex = newElements[index].zIndex
    const higherLayers = newElements.filter((el) => el.zIndex > currentZIndex)

    if (higherLayers.length > 0) {
      const nextZIndex = Math.min(...higherLayers.map((el) => el.zIndex))
      const swapIndex = newElements.findIndex((el) => el.zIndex === nextZIndex)

      newElements[index].zIndex = nextZIndex
      newElements[swapIndex].zIndex = currentZIndex
      setElements(newElements)
    }
  }

  const moveLayerDown = (index: number) => {
    const newElements = [...elements]
    const currentZIndex = newElements[index].zIndex
    const lowerLayers = newElements.filter((el) => el.zIndex < currentZIndex)

    if (lowerLayers.length > 0) {
      const nextZIndex = Math.max(...lowerLayers.map((el) => el.zIndex))
      const swapIndex = newElements.findIndex((el) => el.zIndex === nextZIndex)

      newElements[index].zIndex = nextZIndex
      newElements[swapIndex].zIndex = currentZIndex
      setElements(newElements)
    }
  }

  const bringToFront = (index: number) => {
    const newElements = [...elements]
    const maxZIndex = Math.max(...newElements.map((el) => el.zIndex))
    newElements[index].zIndex = maxZIndex + 1
    setElements(newElements)
  }

  const sendToBack = (index: number) => {
    const newElements = [...elements]
    const minZIndex = Math.min(...newElements.map((el) => el.zIndex))
    newElements[index].zIndex = minZIndex - 1
    setElements(newElements)
  }

  const toggleLayerVisibility = (index: number) => {
    const newElements = [...elements]
    newElements[index].visible = !newElements[index].visible
    setElements(newElements)
  }

  const toggleLayerLock = (index: number) => {
    const newElements = [...elements]
    newElements[index].locked = !newElements[index].locked
    setElements(newElements)
  }

  const removeElement = (index: number) => {
    const newElements = [...elements]
    newElements.splice(index, 1)
    setElements(newElements)
    setSelectedElementIndex(null)
    setSelectedElements([])
    saveCanvasState()

    toast({
      title: "Element Removed",
      description: "The element has been removed from your design.",
    })
  }

  // Alignment functions
  const alignElements = (alignment: string) => {
    if (selectedElements.length < 2) {
      toast({
        title: "Select Multiple Elements",
        description: "Please select at least 2 elements to align them.",
        variant: "destructive",
      })
      return
    }

    const newElements = [...elements]
    const selectedEls = selectedElements.map((i) => newElements[i])

    switch (alignment) {
      case "left":
        const leftMost = Math.min(...selectedEls.map((el) => el.position.x))
        selectedElements.forEach((i) => {
          newElements[i].position.x = leftMost
        })
        break
      case "right":
        const rightMost = Math.max(...selectedEls.map((el) => el.position.x + el.size.width))
        selectedElements.forEach((i) => {
          newElements[i].position.x = rightMost - newElements[i].size.width
        })
        break
      case "center":
        const centerX = selectedEls.reduce((sum, el) => sum + el.position.x + el.size.width / 2, 0) / selectedEls.length
        selectedElements.forEach((i) => {
          newElements[i].position.x = centerX - newElements[i].size.width / 2
        })
        break
      case "top":
        const topMost = Math.min(...selectedEls.map((el) => el.position.y))
        selectedElements.forEach((i) => {
          newElements[i].position.y = topMost
        })
        break
      case "bottom":
        const bottomMost = Math.max(...selectedEls.map((el) => el.position.y + el.size.height))
        selectedElements.forEach((i) => {
          newElements[i].position.y = bottomMost - newElements[i].size.height
        })
        break
      case "middle":
        const centerY =
            selectedEls.reduce((sum, el) => sum + el.position.y + el.size.height / 2, 0) / selectedEls.length
        selectedElements.forEach((i) => {
          newElements[i].position.y = centerY - newElements[i].size.height / 2
        })
        break
    }

    setElements(newElements)
    saveCanvasState()

    toast({
      title: "Elements Aligned",
      description: `Successfully aligned ${selectedElements.length} elements.`,
    })
  }

  // Canvas resize function
  const resizeCanvas = () => {
    const preset = LOGO_CANVAS_PRESETS[selectedPreset as keyof typeof LOGO_CANVAS_PRESETS]
    const newSize = selectedPreset === "custom" ? customSize : { width: preset.width, height: preset.height }

    if (scaleElements && elements.length > 0) {
      const scaleX = newSize.width / canvasSize.width
      const scaleY = newSize.height / canvasSize.height

      const newElements = elements.map((element) => ({
        ...element,
        position: {
          x: element.position.x * scaleX,
          y: element.position.y * scaleY,
        },
        size: {
          width: element.size.width * scaleX,
          height: element.size.height * scaleY,
        },
      }))
      setElements(newElements)
    }

    setCanvasSize(newSize)
    setShowResizeDialog(false)

    toast({
      title: "Canvas Resized",
      description: `Canvas size changed to ${newSize.width}×${newSize.height}px`,
    })
  }

  const downloadLogo = () => {
    // Check if user is logged in
    if (!user) {
      setShowLoginModal(true)
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    // Create a new canvas for export
    const exportCanvas = document.createElement("canvas")
    const exportCtx = exportCanvas.getContext("2d")
    if (!exportCtx) return

    exportCanvas.width = canvasSize.width
    exportCanvas.height = canvasSize.height

    // Fill with white background
    exportCtx.fillStyle = "white"
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height)

    // Draw all visible elements
    const sortedElements = elements.filter((el) => el.visible).sort((a, b) => a.zIndex - b.zIndex)

    sortedElements.forEach((element) => {
      drawElement(exportCtx, element, -1) // -1 to avoid selection indicators
    })

    // Convert to data URL and download
    const dataUrl = exportCanvas.toDataURL("image/png")
    const link = document.createElement("a")
    link.download = `logo-design-${Date.now()}.png`
    link.href = dataUrl
    link.click()

    toast({
      title: "Logo Downloaded",
      description: "Your logo has been downloaded successfully.",
    })
  }
  // Handle canvas interactions
  const getCanvasCoordinates = (e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const findElementAtPosition = (x: number, y: number) => {
    // Find clicked element (topmost first)
    const sortedElements = elements
        .map((el, index) => ({ el, index }))
        .filter(({ el }) => el.visible && !el.locked)
        .sort((a, b) => b.el.zIndex - a.el.zIndex)

    for (const { el, index } of sortedElements) {
      // For text elements, we need to account for the actual text bounds
      if (el.type === "text") {
        // Create a temporary canvas to measure text
        const tempCanvas = document.createElement("canvas")
        const tempCtx = tempCanvas.getContext("2d")
        if (tempCtx) {
          tempCtx.font = `${el.fontStyle || "normal"} ${el.fontWeight || "normal"} ${el.fontSize || 24}px ${el.fontFamily || "Arial"}`
          const textMetrics = tempCtx.measureText(el.text || "")
          const textWidth = textMetrics.width
          const textHeight = el.fontSize || 24

          // Adjust hit area based on text alignment
          let hitX = el.position.x
          const hitWidth = textWidth

          if (el.textAlign === "center") {
            hitX = el.position.x + el.size.width / 2 - textWidth / 2
          } else if (el.textAlign === "right") {
            hitX = el.position.x + el.size.width - textWidth
          }

          // Use a slightly larger hit area for easier selection
          const padding = 5
          if (
              x >= hitX - padding &&
              x <= hitX + textWidth + padding &&
              y >= el.position.y - padding &&
              y <= el.position.y + el.size.height + padding
          ) {
            return index
          }
        }
      } else {
        // For shapes and images, use the normal bounding box
        if (
            x >= el.position.x &&
            x <= el.position.x + el.size.width &&
            y >= el.position.y &&
            y <= el.position.y + el.size.height
        ) {
          return index
        }
      }
    }
    return -1
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    const coords = getCanvasCoordinates(e)
    const clickedIndex = findElementAtPosition(coords.x, coords.y)

    setMouseDown(true)
    setLastMousePos(coords)

    // Handle selection
    if (e.ctrlKey || e.metaKey) {
      if (clickedIndex !== -1) {
        setSelectedElements((prev) =>
            prev.includes(clickedIndex) ? prev.filter((i) => i !== clickedIndex) : [...prev, clickedIndex],
        )
      }
    } else {
      if (clickedIndex !== -1) {
        setSelectedElementIndex(clickedIndex)
        setSelectedElements([clickedIndex])
        setIsDragging(true)

        // Calculate drag offset
        const element = elements[clickedIndex]
        setDragOffset({
          x: coords.x - element.position.x,
          y: coords.y - element.position.y,
        })
      } else {
        setSelectedElementIndex(null)
        setSelectedElements([])
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!mouseDown || !isDragging || selectedElementIndex === null) return

    const coords = getCanvasCoordinates(e)
    const element = elements[selectedElementIndex]

    if (element && !element.locked) {
      const newElements = [...elements]
      let newX = coords.x - dragOffset.x
      let newY = coords.y - dragOffset.y

      // Snap to grid if enabled
      if (snapToGrid) {
        newX = Math.round(newX / gridSize) * gridSize
        newY = Math.round(newY / gridSize) * gridSize
      }

      // Keep within canvas bounds
      newX = Math.max(0, Math.min(newX, canvasSize.width - element.size.width))
      newY = Math.max(0, Math.min(newY, canvasSize.height - element.size.height))

      newElements[selectedElementIndex].position = { x: newX, y: newY }
      setElements(newElements)
    }
  }

  const handleMouseUp = () => {
    if (isDragging) {
      saveCanvasState()
    }
    setMouseDown(false)
    setIsDragging(false)
    setDragOffset({ x: 0, y: 0 })
  }

  return (
      <div className="flex flex-col min-h-screen">
        <header className="border-b p-4 bg-white">
          <div className="container flex items-center justify-between mx-auto">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="outline" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold">Logo Designer</h1>
                <p className="text-sm text-gray-500">Create custom logos with shapes, text, and images</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={showResizeDialog} onOpenChange={setShowResizeDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Maximize2 className="h-4 w-4" /> Resize Canvas
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Resize Canvas</DialogTitle>
                    <DialogDescription>Change the canvas size for your logo design.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Canvas Preset</Label>
                      <Select value={selectedPreset} onValueChange={setSelectedPreset}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(LOGO_CANVAS_PRESETS).map(([key, preset]) => (
                              <SelectItem key={key} value={key}>
                                {preset.name}
                              </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedPreset === "custom" && (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label>Width (px)</Label>
                            <Input
                                type="number"
                                value={customSize.width}
                                onChange={(e) => setCustomSize((prev) => ({ ...prev, width: Number(e.target.value) }))}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>Height (px)</Label>
                            <Input
                                type="number"
                                value={customSize.height}
                                onChange={(e) => setCustomSize((prev) => ({ ...prev, height: Number(e.target.value) }))}
                            />
                          </div>
                        </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Switch id="scale-elements" checked={scaleElements} onCheckedChange={setScaleElements} />
                      <Label htmlFor="scale-elements">Scale existing elements proportionally</Label>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={resizeCanvas} className="flex-1">
                        Apply Changes
                      </Button>
                      <Button variant="outline" onClick={() => setShowResizeDialog(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                  variant="outline"
                  onClick={() => setShowGrid(!showGrid)}
                  className={showGrid ? "bg-primary text-primary-foreground" : ""}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>

              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex <= 0}>
                  <Undo className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={redo} disabled={historyIndex >= canvasHistory.length - 1}>
                  <Redo className="h-4 w-4" />
                </Button>
              </div>

              <Button onClick={downloadLogo} className="gap-2">
                <Download className="h-4 w-4" /> Download Logo
              </Button>
              <LoginModal
                  open={showLoginModal}
                  onOpenChange={setShowLoginModal}
                  onSuccess={() => {
                    toast({
                      title: "Welcome!",
                      description: "You can now download your logo design.",
                    })
                    // Automatically trigger download after successful login
                    setTimeout(() => {
                      if (user) {
                        downloadLogo()
                      }
                    }, 300)
                  }}
              />
            </div>
          </div>
        </header>

        <main className="flex-1 container py-6 mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Panel - Tools */}
            <div className="lg:col-span-1 space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="shapes">Shapes</TabsTrigger>
                  <TabsTrigger value="text">Text</TabsTrigger>
                  <TabsTrigger value="image">Image</TabsTrigger>
                </TabsList>

                <TabsContent value="shapes" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Add Shapes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" onClick={() => addShape("rectangle")} className="h-16 flex-col gap-1">
                          <Square className="h-6 w-6" />
                          <span className="text-xs">Rectangle</span>
                        </Button>
                        <Button variant="outline" onClick={() => addShape("circle")} className="h-16 flex-col gap-1">
                          <Circle className="h-6 w-6" />
                          <span className="text-xs">Circle</span>
                        </Button>
                      </div>

                      <Separator />

                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label>Fill Color</Label>
                          <div className="flex gap-2">
                            <input
                                type="color"
                                value={shapeStyle.fillColor}
                                onChange={(e) => setShapeStyle((prev) => ({ ...prev, fillColor: e.target.value }))}
                                className="w-12 h-8 rounded border"
                            />
                            <Input
                                value={shapeStyle.fillColor}
                                onChange={(e) => setShapeStyle((prev) => ({ ...prev, fillColor: e.target.value }))}
                                placeholder="#3b82f6"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Stroke Color</Label>
                          <div className="flex gap-2">
                            <input
                                type="color"
                                value={shapeStyle.strokeColor}
                                onChange={(e) => setShapeStyle((prev) => ({ ...prev, strokeColor: e.target.value }))}
                                className="w-12 h-8 rounded border"
                            />
                            <Input
                                value={shapeStyle.strokeColor}
                                onChange={(e) => setShapeStyle((prev) => ({ ...prev, strokeColor: e.target.value }))}
                                placeholder="#000000"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Stroke Width: {shapeStyle.strokeWidth}px</Label>
                          <Slider
                              value={[shapeStyle.strokeWidth]}
                              min={0}
                              max={10}
                              step={1}
                              onValueChange={(value) => setShapeStyle((prev) => ({ ...prev, strokeWidth: value[0] }))}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="text" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Add Text</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Text Content</Label>
                        <Input
                            placeholder="Enter text"
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Font Size: {textStyle.fontSize}px</Label>
                        <Slider
                            value={[textStyle.fontSize]}
                            min={8}
                            max={72}
                            step={1}
                            onValueChange={(value) => setTextStyle((prev) => ({ ...prev, fontSize: value[0] }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Font Family</Label>
                        <Select
                            value={textStyle.fontFamily}
                            onValueChange={(value) => setTextStyle((prev) => ({ ...prev, fontFamily: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Arial">Arial</SelectItem>
                            <SelectItem value="Helvetica">Helvetica</SelectItem>
                            <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                            <SelectItem value="Georgia">Georgia</SelectItem>
                            <SelectItem value="Verdana">Verdana</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex gap-2">
                        <Button
                            variant={textStyle.fontWeight === "bold" ? "default" : "outline"}
                            size="sm"
                            onClick={() =>
                                setTextStyle((prev) => ({
                                  ...prev,
                                  fontWeight: prev.fontWeight === "bold" ? "normal" : "bold",
                                }))
                            }
                        >
                          <Bold className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={textStyle.fontStyle === "italic" ? "default" : "outline"}
                            size="sm"
                            onClick={() =>
                                setTextStyle((prev) => ({
                                  ...prev,
                                  fontStyle: prev.fontStyle === "italic" ? "normal" : "italic",
                                }))
                            }
                        >
                          <Italic className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex gap-1">
                        <Button
                            variant={textStyle.textAlign === "left" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setTextStyle((prev) => ({ ...prev, textAlign: "left" }))}
                        >
                          <AlignLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={textStyle.textAlign === "center" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setTextStyle((prev) => ({ ...prev, textAlign: "center" }))}
                        >
                          <AlignCenter className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={textStyle.textAlign === "right" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setTextStyle((prev) => ({ ...prev, textAlign: "right" }))}
                        >
                          <AlignRight className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label>Text Color</Label>
                        <div className="flex gap-2">
                          <input
                              type="color"
                              value={textStyle.color}
                              onChange={(e) => setTextStyle((prev) => ({ ...prev, color: e.target.value }))}
                              className="w-12 h-8 rounded border"
                          />
                          <Input
                              value={textStyle.color}
                              onChange={(e) => setTextStyle((prev) => ({ ...prev, color: e.target.value }))}
                              placeholder="#000000"
                          />
                        </div>
                      </div>

                      <Button onClick={addText} className="w-full gap-2">
                        <Type className="h-4 w-4" /> Add Text
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="image" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Add Image</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <input
                            type="file"
                            id="image-upload"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                        <label htmlFor="image-upload">
                          <Button variant="outline" className="w-full gap-2" asChild>
                          <span>
                            <ImageIcon className="h-4 w-4" /> Upload Image
                          </span>
                          </Button>
                        </label>
                      </div>
                      <p className="text-xs text-gray-500">Supported formats: PNG, JPG, GIF, SVG</p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Alignment Tools */}
              {selectedElements.length > 1 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Alignment Tools</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-1">
                        <Button variant="outline" size="sm" onClick={() => alignElements("left")}>
                          <AlignLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => alignElements("center")}>
                          <AlignCenter className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => alignElements("right")}>
                          <AlignRight className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => alignElements("top")}>
                          Top
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => alignElements("middle")}>
                          Middle
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => alignElements("bottom")}>
                          Bottom
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
              )}
            </div>

            {/* Center - Canvas */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-center">
                    <div className="relative border-2 border-gray-200 rounded-lg overflow-hidden">
                      <canvas
                          ref={canvasRef}
                          onMouseDown={handleMouseDown}
                          onMouseMove={handleMouseMove}
                          onMouseUp={handleMouseUp}
                          onMouseLeave={handleMouseUp}
                          className="cursor-crosshair"
                          style={{ maxWidth: "100%", height: "auto" }}
                      />
                    </div>
                  </div>
                  <div className="mt-4 text-center text-sm text-gray-500">
                    Canvas: {canvasSize.width} × {canvasSize.height}px | Elements: {elements.length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Panel - Layers & Properties */}
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5" /> Layers
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {elements
                      .map((element, index) => ({ element, index }))
                      .sort((a, b) => b.element.zIndex - a.element.zIndex)
                      .map(({ element, index }) => (
                          <div
                              key={element.id}
                              className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer ${
                                  selectedElementIndex === index ? "border-primary bg-primary/5" : ""
                              }`}
                              onClick={() => setSelectedElementIndex(index)}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {element.type === "text"
                                    ? element.text || "Text"
                                    : element.type === "shape"
                                        ? element.shapeType || "Shape"
                                        : "Image"}
                              </p>
                              <p className="text-xs text-gray-500">Z: {element.zIndex}</p>
                            </div>

                            <div className="flex items-center gap-1">
                              <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleLayerVisibility(index)
                                  }}
                              >
                                {element.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                              </Button>

                              <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleLayerLock(index)
                                  }}
                              >
                                {element.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                              </Button>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => moveLayerUp(index)}>
                                    <ChevronUp className="h-4 w-4 mr-2" />
                                    Bring Forward
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => moveLayerDown(index)}>
                                    <ChevronDown className="h-4 w-4 mr-2" />
                                    Send Backward
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => bringToFront(index)}>Bring to Front</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => sendToBack(index)}>Send to Back</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => removeElement(index)} className="text-red-600">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                      ))}

                  {elements.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Layers className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No elements yet</p>
                        <p className="text-xs">Add shapes, text, or images to get started</p>
                      </div>
                  )}
                </CardContent>
              </Card>

              {/* Element Properties */}
              {selectedElement && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Properties</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label>X Position</Label>
                          <Input
                              type="number"
                              value={Math.round(selectedElement.position.x)}
                              onChange={(e) => {
                                const newElements = [...elements]
                                newElements[selectedElementIndex!].position.x = Number(e.target.value)
                                setElements(newElements)
                              }}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Y Position</Label>
                          <Input
                              type="number"
                              value={Math.round(selectedElement.position.y)}
                              onChange={(e) => {
                                const newElements = [...elements]
                                newElements[selectedElementIndex!].position.y = Number(e.target.value)
                                setElements(newElements)
                              }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label>Width</Label>
                          <Input
                              type="number"
                              value={Math.round(selectedElement.size.width)}
                              onChange={(e) => {
                                const newElements = [...elements]
                                newElements[selectedElementIndex!].size.width = Number(e.target.value)
                                setElements(newElements)
                              }}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Height</Label>
                          <Input
                              type="number"
                              value={Math.round(selectedElement.size.height)}
                              onChange={(e) => {
                                const newElements = [...elements]
                                newElements[selectedElementIndex!].size.height = Number(e.target.value)
                                setElements(newElements)
                              }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Rotation: {selectedElement.rotation}°</Label>
                        <Slider
                            value={[selectedElement.rotation]}
                            min={0}
                            max={360}
                            step={1}
                            onValueChange={(value) => {
                              const newElements = [...elements]
                              newElements[selectedElementIndex!].rotation = value[0]
                              setElements(newElements)
                            }}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                            id="maintain-aspect"
                            checked={selectedElement.maintainAspectRatio}
                            onCheckedChange={(checked) => {
                              const newElements = [...elements]
                              newElements[selectedElementIndex!].maintainAspectRatio = checked
                              setElements(newElements)
                            }}
                        />
                        <Label htmlFor="maintain-aspect">Maintain aspect ratio</Label>
                      </div>

                      {selectedElement.type === "text" && (
                          <div className="space-y-3">
                            <Separator />
                            <div className="space-y-2">
                              <Label>Text Content</Label>
                              <Input
                                  value={selectedElement.text || ""}
                                  onChange={(e) => {
                                    const newElements = [...elements]
                                    newElements[selectedElementIndex!].text = e.target.value
                                    setElements(newElements)
                                  }}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Font Size: {selectedElement.fontSize}px</Label>
                              <Slider
                                  value={[selectedElement.fontSize || 24]}
                                  min={8}
                                  max={72}
                                  step={1}
                                  onValueChange={(value) => {
                                    const newElements = [...elements]
                                    newElements[selectedElementIndex!].fontSize = value[0]
                                    setElements(newElements)
                                  }}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Text Color</Label>
                              <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={selectedElement.textColor || "#000000"}
                                    onChange={(e) => {
                                      const newElements = [...elements]
                                      newElements[selectedElementIndex!].textColor = e.target.value
                                      setElements(newElements)
                                    }}
                                    className="w-12 h-8 rounded border"
                                />
                                <Input
                                    value={selectedElement.textColor || "#000000"}
                                    onChange={(e) => {
                                      const newElements = [...elements]
                                      newElements[selectedElementIndex!].textColor = e.target.value
                                      setElements(newElements)
                                    }}
                                />
                              </div>
                            </div>
                          </div>
                      )}

                      {selectedElement.type === "shape" && (
                          <div className="space-y-3">
                            <Separator />
                            <div className="space-y-2">
                              <Label>Fill Color</Label>
                              <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={selectedElement.fillColor || "#3b82f6"}
                                    onChange={(e) => {
                                      const newElements = [...elements]
                                      newElements[selectedElementIndex!].fillColor = e.target.value
                                      setElements(newElements)
                                    }}
                                    className="w-12 h-8 rounded border"
                                />
                                <Input
                                    value={selectedElement.fillColor || "#3b82f6"}
                                    onChange={(e) => {
                                      const newElements = [...elements]
                                      newElements[selectedElementIndex!].fillColor = e.target.value
                                      setElements(newElements)
                                    }}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Stroke Color</Label>
                              <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={selectedElement.strokeColor || "#000000"}
                                    onChange={(e) => {
                                      const newElements = [...elements]
                                      newElements[selectedElementIndex!].strokeColor = e.target.value
                                      setElements(newElements)
                                    }}
                                    className="w-12 h-8 rounded border"
                                />
                                <Input
                                    value={selectedElement.strokeColor || "#000000"}
                                    onChange={(e) => {
                                      const newElements = [...elements]
                                      newElements[selectedElementIndex!].strokeColor = e.target.value
                                      setElements(newElements)
                                    }}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Stroke Width: {selectedElement.strokeWidth || 0}px</Label>
                              <Slider
                                  value={[selectedElement.strokeWidth || 0]}
                                  min={0}
                                  max={10}
                                  step={1}
                                  onValueChange={(value) => {
                                    const newElements = [...elements]
                                    newElements[selectedElementIndex!].strokeWidth = value[0]
                                    setElements(newElements)
                                  }}
                              />
                            </div>
                          </div>
                      )}

                      <div className="flex gap-2 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => {
                              const newElements = [...elements]
                              newElements[selectedElementIndex!] = {
                                ...newElements[selectedElementIndex!],
                                position: {
                                  x: canvasSize.width / 2 - newElements[selectedElementIndex!].size.width / 2,
                                  y: canvasSize.height / 2 - newElements[selectedElementIndex!].size.height / 2,
                                },
                                rotation: 0,
                              }
                              setElements(newElements)
                              saveCanvasState()
                            }}
                            className="gap-2"
                        >
                          <RotateCcw className="h-4 w-4" /> Reset
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => removeElement(selectedElementIndex!)}
                            className="gap-2 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
              )}
            </div>
          </div>
        </main>
      </div>
  )
}
