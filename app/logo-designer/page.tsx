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
  Grid3X3,
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  MoreHorizontal,
  ChevronUp,
  Trash2,
  ChevronDown,
  RotateCcw,
  Clock,
  Save,
  Trash,
  Calendar,
  FileText,
  Loader2,
  Triangle,
  Star,
  Heart,
  Hexagon,
} from "lucide-react"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import LoginModal from "@/components/login-modal"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Image from "next/image"

import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { Package, Archive } from 'lucide-react'
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
  shapeType?: "rectangle" | "circle" | "triangle" | "star" | "heart" | "hexagon"
  fillColor?: string
  strokeColor?: string
  strokeWidth?: number
  text?: string
  fontSize?: number
  fontFamily?: string
  fontWeight?: string
  fontStyle?: string
  textAlign?: string
  textColor?: string
  imageUrl?: string
  imageFile?: File
}
interface LogoDesignData {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  thumbnail?: string
  data: {
    elements: DesignElement[]
    canvasSize: { width: number; height: number }
    backgroundColor: string
  }
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
  const { user, loading, getAuthToken } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)

  // Add this near the top of the component with other refs
  const userRef = useRef(user)

  // Add this useEffect to keep the ref updated
  useEffect(() => {
    userRef.current = user
  }, [user])

  // Debug logging for auth state changes
  useEffect(() => {
    console.log("🎨 LogoDesigner - Auth state changed:", { user, loading })
  }, [user, loading])

  // Check if user should see auth modal (but don't change layout)
  useEffect(() => {
    console.log("🎨 LogoDesigner - Checking if should show modal:", { loading, user })
    if (!loading) {
      if (!user) {
        console.log("🎨 LogoDesigner - No user, showing modal")
        setShowAuthModal(true)
      } else {
        console.log("🎨 LogoDesigner - User found, hiding modal")
        setShowAuthModal(false)
      }
    }
  }, [user, loading])

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
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
  const [showCanvasHandles, setShowCanvasHandles] = useState(false)

  // Canvas resizing states
  const [isResizingCanvas, setIsResizingCanvas] = useState(false)
  const [resizeDirection, setResizeDirection] = useState<string | null>(null)
  const [initialCanvasSize, setInitialCanvasSize] = useState({ width: 500, height: 500 })
  const [initialMousePos, setInitialMousePos] = useState({ x: 0, y: 0 })

  // Design History & Recent Projects
  const [designHistory, setDesignHistory] = useState<LogoDesignData[]>([])
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [currentDesignName, setCurrentDesignName] = useState("")
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentDesignId, setCurrentDesignId] = useState<string | null>(null)
  const [designThumbnails, setDesignThumbnails] = useState<Record<string, string>>({})
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

// Add this state near your other state declarations
  const [isGeneratingZip, setIsGeneratingZip] = useState(false)
// Add this function to collect all assets and generate zip
  const downloadAssetsAsZip = async () => {
    if (!canvasRef.current) return

    setIsGeneratingZip(true)

    try {
      const zip = new JSZip()

      // Create folders
      const assetsFolder = zip.folder("assets")
      const exportFolder = zip.folder("exports")

      // Get clean canvas without selections
      const cleanCanvas = exportCleanCanvas()
      if (cleanCanvas) {
        const canvasDataUrl = cleanCanvas.toDataURL('image/png')
        const canvasBlob = await fetch(canvasDataUrl).then(r => r.blob())
        exportFolder?.file("design.png", canvasBlob)
      }

      // Rest of your existing code for assets...
      const imageAssets = new Set<string>()
      elements.forEach(element => {
        if (element.type === 'image' && element.imageUrl) {
          imageAssets.add(element.imageUrl)
        }
      })

      // Add image assets to zip with proper extensions
      let imageCounter = 1
      for (const imageUrl of imageAssets) {
        try {
          const response = await fetch(imageUrl)
          const blob = await response.blob()

          let filename = imageUrl.split('/').pop() || `image_${imageCounter}`

          if (!filename.includes('.')) {
            const mimeType = blob.type
            if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
              filename += '.jpg'
            } else if (mimeType.includes('svg')) {
              filename += '.svg'
            } else if (mimeType.includes('gif')) {
              filename += '.gif'
            } else if (mimeType.includes('webp')) {
              filename += '.webp'
            } else {
              filename += '.png'
            }
          }

          assetsFolder?.file(filename, blob)
          imageCounter++
        } catch (error) {
          console.warn('Failed to fetch image:', imageUrl, error)
        }
      }

      // Add design data as JSON
      const designData = {
        elements,
        canvasSize,
        metadata: {
          name: currentDesignName || 'Untitled Design',
          createdAt: new Date().toISOString(),
          version: '1.0'
        }
      }

      zip.file("design_data.json", JSON.stringify(designData, null, 2))

      // Generate and download zip
      const content = await zip.generateAsync({ type: "blob" })
      const fileName = `${currentDesignName || 'logo_design'}_assets.zip`
      saveAs(content, fileName)

      toast({
        title: "Assets Downloaded",
        description: `All design assets have been packaged and downloaded as ${fileName}`,
      })

    } catch (error) {
      console.error('Error generating zip:', error)
      toast({
        title: "Download Error",
        description: "Failed to generate assets package. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingZip(false)
    }
  }

  const exportCleanCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const ctx = canvas.getContext("2d")
    if (!ctx) return null
    // Create a temporary canvas for clean export
    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d')
    if (!tempCtx) return null
    tempCanvas.width = canvas.width
    tempCanvas.height = canvas.height
    // Clear with white background
    tempCtx.fillStyle = "white"
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
    // Draw only the elements without any selection indicators
    const sortedElements = elements
        .map((el, index) => ({ el, index }))
        .filter(({ el }) => el.visible)
        .sort((a, b) => a.el.zIndex - b.el.zIndex)
    // Draw elements without selection
    sortedElements.forEach(({ el }) => {
      drawElementClean(tempCtx, el)
    })
    return tempCanvas
  }
// Add this helper function to draw elements without selection indicators:
  const drawElementClean = (ctx: CanvasRenderingContext2D, element: DesignElement) => {
    ctx.save()
    // Apply transformations
    ctx.translate(element.position.x + element.size.width / 2, element.position.y + element.size.height / 2)
    ctx.rotate((element.rotation * Math.PI) / 180)
    ctx.translate(-element.size.width / 2, -element.size.height / 2)
    // Draw based on element type (same as your existing drawElement but without selection)
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

  // Load design history on component mount
  useEffect(() => {
    if (user) {
      loadDesignHistory()
    }
  }, [user])

  // Auto-save current design state every 5 seconds
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (elements.length > 0 && user && currentDesignId && hasUnsavedChanges) {
        // Only auto-save if we have an existing design and unsaved changes
        saveCurrentDesign(currentDesignName || "Auto-save", false)
      }
    }, 5000) // Changed from 30000 to 5000 (5 seconds)

    return () => clearInterval(autoSaveInterval)
  }, [elements, canvasSize, user, currentDesignId, currentDesignName, hasUnsavedChanges])

  // Add auto-save trigger for any design changes (faster response)
  useEffect(() => {
    if (elements.length > 0 || canvasSize.width !== 500 || canvasSize.height !== 500) {
      setHasUnsavedChanges(true)

      // Auto-save after 1 second of inactivity
      const autoSaveTimeout = setTimeout(() => {
        if (user && hasUnsavedChanges && currentDesignId) {
          // Only auto-save if we already have a design ID (user has named it)
          saveCurrentDesign(currentDesignName || "Auto-save", false)
        }
      }, 1000)

      return () => clearTimeout(autoSaveTimeout)
    }
  }, [elements, canvasSize, user, hasUnsavedChanges, currentDesignId, currentDesignName])

  // Track changes for auto-save
  useEffect(() => {
    if (elements.length > 0 || canvasSize.width !== 500 || canvasSize.height !== 500) {
      setHasUnsavedChanges(true)
    }
  }, [elements, canvasSize])

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

  // Add this useEffect after the existing useEffects (around line 200):
  useEffect(() => {
    // Load images for elements that don't have them loaded yet
    elements.forEach((element) => {
      if (element.type === "image" && element.imageUrl && !loadedImages.has(element.imageUrl)) {
        const img = new window.Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
          console.log("🎨 Loaded image:", element.imageUrl)
          setLoadedImages((prev) => new Map(prev).set(element.imageUrl!, img))
          // Trigger a redraw after image loads
          setTimeout(() => redrawCanvas(), 50)
        }
        img.onerror = (error) => {
          console.error("🎨 Failed to load image:", element.imageUrl, error)
        }
        img.src = element.imageUrl
      }
    })
  }, [elements, loadedImages])

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

    // Draw canvas resize handles
    drawCanvasResizeHandles(ctx)
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
      case "triangle":
        ctx.beginPath()
        ctx.moveTo(element.size.width / 2, 0)
        ctx.lineTo(0, element.size.height)
        ctx.lineTo(element.size.width, element.size.height)
        ctx.closePath()
        ctx.fill()
        if (element.strokeWidth && element.strokeWidth > 0) {
          ctx.stroke()
        }
        break
      case "star":
        drawStar(
            ctx,
            element.size.width / 2,
            element.size.height / 2,
            5,
            Math.min(element.size.width, element.size.height) / 4,
            Math.min(element.size.width, element.size.height) / 8,
        )
        ctx.fill()
        if (element.strokeWidth && element.strokeWidth > 0) {
          ctx.stroke()
        }
        break
      case "heart":
        drawHeart(
            ctx,
            element.size.width / 2,
            element.size.height / 2,
            Math.min(element.size.width, element.size.height) / 2,
        )
        ctx.fill()
        if (element.strokeWidth && element.strokeWidth > 0) {
          ctx.stroke()
        }
        break
      case "hexagon":
        drawHexagon(
            ctx,
            element.size.width / 2,
            element.size.height / 2,
            Math.min(element.size.width, element.size.height) / 2,
        )
        ctx.fill()
        if (element.strokeWidth && element.strokeWidth > 0) {
          ctx.stroke()
        }
        break
    }
  }

  // Helper functions for drawing complex shapes
  const drawStar = (
      ctx: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      spikes: number,
      outerRadius: number,
      innerRadius: number,
  ) => {
    let rot = (Math.PI / 2) * 3
    let x = cx
    let y = cy
    const step = Math.PI / spikes

    ctx.beginPath()
    ctx.moveTo(cx, cy - outerRadius)
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius
      y = cy + Math.sin(rot) * outerRadius
      ctx.lineTo(x, y)
      rot += step

      x = cx + Math.cos(rot) * innerRadius
      y = cy + Math.sin(rot) * innerRadius
      ctx.lineTo(x, y)
      rot += step
    }
    ctx.lineTo(cx, cy - outerRadius)
    ctx.closePath()
  }

  const drawHeart = (ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) => {
    ctx.beginPath()
    const topCurveHeight = size * 0.3
    ctx.moveTo(cx, cy + topCurveHeight)
    // Left curve
    ctx.bezierCurveTo(cx, cy, cx - size / 2, cy, cx - size / 2, cy + topCurveHeight)
    ctx.bezierCurveTo(
        cx - size / 2,
        cy + (size + topCurveHeight) / 2,
        cx,
        cy + (size + topCurveHeight) / 2,
        cx,
        cy + size,
    )
    // Right curve
    ctx.bezierCurveTo(
        cx,
        cy + (size + topCurveHeight) / 2,
        cx + size / 2,
        cy + (size + topCurveHeight) / 2,
        cx + size / 2,
        cy + topCurveHeight,
    )
    ctx.bezierCurveTo(cx + size / 2, cy, cx, cy, cx, cy + topCurveHeight)
    ctx.closePath()
  }

  const drawHexagon = (ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) => {
    ctx.beginPath()
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i
      const x = cx + size * Math.cos(angle)
      const y = cy + size * Math.sin(angle)
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.closePath()
  }

  const drawText = (ctx: CanvasRenderingContext2D, element: DesignElement) => {
    ctx.fillStyle = element.textColor || "#000000"
    ctx.font = `${element.fontStyle || "normal"} ${element.fontWeight || "normal"} ${element.fontSize || 24}px ${element.fontFamily || "Arial"}`

    // Set text alignment and baseline
    ctx.textAlign = (element.textAlign as CanvasTextAlign) || "center"
    ctx.textBaseline = "middle"

    let x = 0
    if (element.textAlign === "center") {
      x = element.size.width / 2
    } else if (element.textAlign === "right") {
      x = element.size.width
    } else {
      x = 0
    }

    const y = element.size.height / 2 // Center vertically

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

  const drawCanvasResizeHandles = (ctx: CanvasRenderingContext2D) => {
    // Only draw resize handles when canvas is being resized or hovered
    if (!isResizingCanvas && !showCanvasHandles) return

    const handleSize = 12
    const canvas = canvasRef.current
    if (!canvas) return

    // Draw resize handles at canvas corners and edges
    const handles = [
      { x: canvas.width - handleSize, y: canvas.height - handleSize, cursor: "nw-resize", direction: "se" }, // bottom-right
      { x: canvas.width - handleSize, y: canvas.height / 2 - handleSize / 2, cursor: "ew-resize", direction: "e" }, // right-center
      { x: canvas.width / 2 - handleSize / 2, y: canvas.height - handleSize, cursor: "ns-resize", direction: "s" }, // bottom-center
    ]

    handles.forEach((handle) => {
      ctx.fillStyle = "#3b82f6"
      ctx.fillRect(handle.x, handle.y, handleSize, handleSize)
      ctx.strokeStyle = "#ffffff"
      ctx.lineWidth = 2
      ctx.strokeRect(handle.x, handle.y, handleSize, handleSize)
    })
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

  const addShape = (shapeType: "rectangle" | "circle" | "triangle" | "star" | "heart" | "hexagon") => {
    // If this is the first element and no current design, ask user to save with a name
    if (elements.length === 0 && !currentDesignId && user) {
      const newElement = createElement("shape", {
        shapeType,
        fillColor: shapeStyle.fillColor,
        strokeColor: shapeStyle.strokeColor,
        strokeWidth: shapeStyle.strokeWidth,
      })

      setElements([newElement])
      setSelectedElementIndex(0)
      saveCanvasState()

      setTimeout(() => {
        setShowSaveDialog(true)
      }, 500)

      toast({
        title: "Shape Added",
        description: `${shapeType} has been added. Please save your design to continue.`,
      })
      return
    }

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

    // If this is the first element and no current design, ask user to save with a name
    if (elements.length === 0 && !currentDesignId && user) {
      setElements([newElement])
      setSelectedElementIndex(0)
      setTextInput("")
      saveCanvasState()

      setTimeout(() => {
        setShowSaveDialog(true)
      }, 500)

      toast({
        title: "Text Added",
        description: "Text has been added. Please save your design to continue.",
      })
      return
    }

    setElements([...elements, newElement])
    setSelectedElementIndex(elements.length)
    setTextInput("")
    saveCanvasState()

    toast({
      title: "Text Added",
      description: "Text has been added to your design.",
    })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return

    const file = e.target.files[0]
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"]

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Unsupported File",
        description: "Only SVG, PNG, and JPG images are allowed.",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 10MB.",
        variant: "destructive",
      })
      return
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to upload images.",
        variant: "destructive",
      })
      setShowAuthModal(true)
      return
    }

    try {
      // Create form data
      const formData = new FormData()
      formData.append("image", file)

      // Upload to backend directly
      const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://mockupgenerator-be.vercel.app"
      const uploadUrl = `${BACKEND_URL}/api/uploads/upload`

      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Upload failed")
      }

      const uploadData = await response.json()

      // Extract the correct URL from the response
      let imageUrl = null
      if (uploadData.data && uploadData.data.url) {
        imageUrl = uploadData.data.url
      } else if (uploadData.data && uploadData.data.fileUrl) {
        imageUrl = uploadData.data.fileUrl
      } else if (uploadData.url) {
        imageUrl = uploadData.url
      } else if (uploadData.fileUrl) {
        imageUrl = uploadData.fileUrl
      }

      // Transform localhost URLs to use the correct backend URL
      if (imageUrl && imageUrl.includes("localhost:3001")) {
        imageUrl = imageUrl.replace("http://localhost:3001", BACKEND_URL)
      }

      if (!imageUrl) {
        throw new Error("No image URL returned from server")
      }

      // Load the image to get dimensions
      const img = new window.Image()
      img.crossOrigin = "anonymous"

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
          imageFile: undefined, // Don't store file, use URL
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

        // If this is the first element and no current design, ask user to save with a name
        if (elements.length === 0 && !currentDesignId && user) {
          setTimeout(() => {
            setShowSaveDialog(true)
          }, 500)
        }

        toast({
          title: "Image Uploaded!",
          description: "Image has been uploaded and added to your design.",
        })
      }

      img.onerror = () => {
        throw new Error("Failed to load uploaded image")
      }

      img.src = imageUrl
    } catch (error) {
      console.error("🎨 Upload error:", error)

      // Fallback: create blob URL for immediate use
      const reader = new FileReader()
      reader.onload = (event) => {
        if (!event.target?.result) return

        const imageUrl = event.target.result as string
        const img = new window.Image()

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
            position: {
              x: canvasSize.width / 2 - width / 2,
              y: canvasSize.height / 2 - height / 2,
            },
          })

          setElements([...elements, newElement])
          setSelectedElementIndex(elements.length)
          saveCanvasState()

          if (elements.length === 0 && !currentDesignId && user) {
            setTimeout(() => {
              setShowSaveDialog(true)
            }, 500)
          }

          toast({
            title: "Upload Failed - Using Local Copy",
            description: "Image added locally. Save your design to try uploading again.",
            variant: "default",
          })
        }

        img.src = imageUrl
      }

      reader.readAsDataURL(file)
    }

    // Reset the input value
    e.target.value = ""
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
    // Check if user is logged in - if not, show modal
    if (!user) {
      setShowAuthModal(true)
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
    // exportCtx.fillStyle = "white"
    // exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height)

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

  const findElementResizeHandle = (x: number, y: number, elementIndex: number) => {
    if (elementIndex === -1) return null

    const element = elements[elementIndex]
    const handleSize = 8
    const padding = 4

    const handles = [
      { x: element.position.x - handleSize / 2, y: element.position.y - handleSize / 2, direction: "nw" },
      {
        x: element.position.x + element.size.width - handleSize / 2,
        y: element.position.y - handleSize / 2,
        direction: "ne",
      },
      {
        x: element.position.x - handleSize / 2,
        y: element.position.y + element.size.height - handleSize / 2,
        direction: "sw",
      },
      {
        x: element.position.x + element.size.width - handleSize / 2,
        y: element.position.y + element.size.height - handleSize / 2,
        direction: "se",
      },
      {
        x: element.position.x + element.size.width / 2 - handleSize / 2,
        y: element.position.y - handleSize / 2,
        direction: "n",
      },
      {
        x: element.position.x + element.size.width / 2 - handleSize / 2,
        y: element.position.y + element.size.height - handleSize / 2,
        direction: "s",
      },
      {
        x: element.position.x - handleSize / 2,
        y: element.position.y + element.size.height / 2 - handleSize / 2,
        direction: "w",
      },
      {
        x: element.position.x + element.size.width - handleSize / 2,
        y: element.position.y + element.size.height / 2 - handleSize / 2,
        direction: "e",
      },
    ]

    for (const handle of handles) {
      if (
          x >= handle.x - padding &&
          x <= handle.x + handleSize + padding &&
          y >= handle.y - padding &&
          y <= handle.y + handleSize + padding
      ) {
        return handle.direction
      }
    }
    return null
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
        // Use the full element bounds for text selection with generous padding
        const padding = 10
        if (
            x >= el.position.x - padding &&
            x <= el.position.x + el.size.width + padding &&
            y >= el.position.y - padding &&
            y <= el.position.y + el.size.height + padding
        ) {
          return index
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

  const findCanvasResizeHandle = (x: number, y: number) => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const handleSize = 12
    const handles = [
      { x: canvas.width - handleSize, y: canvas.height - handleSize, direction: "se" },
      { x: canvas.width - handleSize, y: canvas.height / 2 - handleSize / 2, direction: "e" },
      { x: canvas.width / 2 - handleSize / 2, y: canvas.height - handleSize, direction: "s" },
    ]

    for (const handle of handles) {
      if (x >= handle.x && x <= handle.x + handleSize && y >= handle.y && y <= handle.y + handleSize) {
        return handle.direction
      }
    }
    return null
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    const coords = getCanvasCoordinates(e)

    // Check if clicking on canvas resize handle first
    const canvasResizeDirection = findCanvasResizeHandle(coords.x, coords.y)
    if (canvasResizeDirection) {
      setIsResizingCanvas(true)
      setResizeDirection(canvasResizeDirection)
      setInitialCanvasSize({ ...canvasSize })
      setInitialMousePos(coords)
      return
    }

    const clickedIndex = findElementAtPosition(coords.x, coords.y)

    // Check for element resize handles if an element is selected
    if (selectedElementIndex !== null && clickedIndex === selectedElementIndex) {
      const elementResizeDirection = findElementResizeHandle(coords.x, coords.y, selectedElementIndex)
      if (elementResizeDirection) {
        setIsResizing(true)
        setResizeHandle(elementResizeDirection)
        setInitialMousePos(coords)
        const element = elements[selectedElementIndex]
        setDragOffset({
          x: element.position.x,
          y: element.position.y,
        })
        return
      }
    }

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
    const coords = getCanvasCoordinates(e)

    if (isResizingCanvas && resizeDirection) {
      const deltaX = coords.x - initialMousePos.x
      const deltaY = coords.y - initialMousePos.y

      let newWidth = initialCanvasSize.width
      let newHeight = initialCanvasSize.height

      if (resizeDirection.includes("e")) {
        newWidth = Math.max(200, initialCanvasSize.width + deltaX)
      }
      if (resizeDirection.includes("s")) {
        newHeight = Math.max(200, initialCanvasSize.height + deltaY)
      }

      setCanvasSize({ width: newWidth, height: newHeight })
      return
    }

    if (isResizing && resizeHandle && selectedElementIndex !== null) {
      const element = elements[selectedElementIndex]
      const deltaX = coords.x - initialMousePos.x
      const deltaY = coords.y - initialMousePos.y

      const newElements = [...elements]
      let newWidth = element.size.width
      let newHeight = element.size.height
      let newX = element.position.x
      let newY = element.position.y

      // Handle different resize directions
      if (resizeHandle.includes("e")) {
        newWidth = Math.max(20, element.size.width + deltaX)
      }
      if (resizeHandle.includes("w")) {
        const widthChange = element.size.width - Math.max(20, element.size.width - deltaX)
        newWidth = Math.max(20, element.size.width - deltaX)
        newX = element.position.x + widthChange
      }
      if (resizeHandle.includes("s")) {
        newHeight = Math.max(20, element.size.height + deltaY)
      }
      if (resizeHandle.includes("n")) {
        const heightChange = element.size.height - Math.max(20, element.size.height - deltaY)
        newHeight = Math.max(20, element.size.height - deltaY)
        newY = element.position.y + heightChange
      }

      // Maintain aspect ratio if enabled
      if (element.maintainAspectRatio) {
        const aspectRatio = element.size.width / element.size.height

        // For corner handles, maintain aspect ratio
        if (resizeHandle === "se" || resizeHandle === "nw" || resizeHandle === "ne" || resizeHandle === "sw") {
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            newHeight = newWidth / aspectRatio
            if (resizeHandle.includes("n")) {
              newY = element.position.y + element.size.height - newHeight
            }
          } else {
            newWidth = newHeight * aspectRatio
            if (resizeHandle.includes("w")) {
              newX = element.position.x + element.size.width - newWidth
            }
          }
        }
      }

      newElements[selectedElementIndex] = {
        ...element,
        position: { x: newX, y: newY },
        size: { width: newWidth, height: newHeight },
      }
      setElements(newElements)
      return
    }

    // Handle dragging elements
    if (!mouseDown || !isDragging || selectedElementIndex === null) return

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
    if (isDragging || isResizing || isResizingCanvas) {
      saveCanvasState()
    }

    setMouseDown(false)
    setIsDragging(false)
    setIsResizing(false)
    setIsResizingCanvas(false)
    setResizeHandle(null)
    setResizeDirection(null)
    setDragOffset({ x: 0, y: 0 })
  }

  const handleAuthModalClose = (open: boolean) => {
    console.log("🎨 LogoDesigner - Modal close handler:", { open, user, loading })

    // Only redirect if modal is being closed and we're sure it wasn't a successful login
    if (!open && !loading) {
      // Use setTimeout to allow React state updates to complete
      setTimeout(() => {
        // Get the current user state from the ref (not closure)
        const currentUser = userRef.current
        console.log("🎨 LogoDesigner - Delayed check for redirect:", { currentUser })

        if (!currentUser) {
          console.log("🎨 LogoDesigner - Redirecting to home")
          window.location.href = "/"
        } else {
          console.log("🎨 LogoDesigner - User found, staying on page")
        }
      }, 200)
    }
    setShowAuthModal(open)
  }

  const handleAuthSuccess = () => {
    console.log("🎨 LogoDesigner - Auth success handler")
    // User successfully logged in - close modal and stay on page
    setShowAuthModal(false)
    toast({
      title: "Welcome!",
      description: "You can now use all features of the Logo Designer.",
    })
  }

  // Design History Functions - Using same API as mockup editor
  const saveCurrentDesign = async (name?: string, showToast = true) => {
    if (!user) {
      if (showToast) {
        toast({
          title: "Authentication Required",
          description: "Please log in to save your design.",
          variant: "destructive",
        })
      }
      return
    }

    const designName = name || currentDesignName || `Logo Design ${Date.now()}`
    setIsSaving(true)

    try {
      // Prepare elements data for saving - keep permanent URLs
      const elementsToSave = elements.map((element) => ({
        ...element,
        imageFile: undefined, // Don't save file objects
        imageUrl: element.imageUrl && element.imageUrl.startsWith("blob:") ? undefined : element.imageUrl, // Only save permanent URLs, skip blob URLs
      }))

      console.log("🎨 Saving logo design with elements:", elementsToSave)

      const designData = {
        name: designName,
        data: {
          elements: elementsToSave,
          canvasSize,
          backgroundColor: "white",
        },
      }

      // Add ID for updates
      if (currentDesignId) {
        ;(designData as any).id = currentDesignId
      }

      // Try to save to backend first
      try {
        const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://mockupgenerator-be.vercel.app"
        const endpoint = currentDesignId
            ? `${BACKEND_URL}/api/designs/update?designId=${currentDesignId}`
            : `${BACKEND_URL}/api/designs/create`

        console.log("🎨 Saving logo design to:", endpoint, "with ID:", currentDesignId)

        const response = await fetch(endpoint, {
          method: currentDesignId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify(designData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Failed to save to server")
        }

        const savedDesign = await response.json()
        console.log("🎨 Logo design saved successfully:", savedDesign)

        // Update current design ID if this was a new design
        if (!currentDesignId) {
          const newId = savedDesign.id || savedDesign.data?.id || Date.now().toString()
          setCurrentDesignId(newId)
          console.log("🎨 Set new design ID:", newId)
        }

        // Reload design history
        await loadDesignHistory()
        setHasUnsavedChanges(false)

        if (showToast) {
          toast({
            title: "Design Saved!",
            description: `"${designName}" has been saved successfully.`,
          })
        }
      } catch (apiError) {
        console.error("🎨 API save failed, using local storage:", apiError)

        // Fallback to local storage
        const fallbackDesign: LogoDesignData = {
          id: currentDesignId || Date.now().toString(),
          name: designName,
          createdAt: currentDesignId
              ? designHistory.find((d) => d.id === currentDesignId)?.createdAt || new Date().toISOString()
              : new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          data: {
            elements: elementsToSave,
            canvasSize,
            backgroundColor: "white",
          },
        }

        const existingDesigns = JSON.parse(localStorage.getItem("logo-designs") || "[]")
        const updatedDesigns = [
          fallbackDesign,
          ...existingDesigns.filter((d: LogoDesignData) => d.id !== fallbackDesign.id).slice(0, 9),
        ]
        localStorage.setItem("logo-designs", JSON.stringify(updatedDesigns))
        setDesignHistory(updatedDesigns)

        if (!currentDesignId) {
          setCurrentDesignId(fallbackDesign.id)
        }

        setHasUnsavedChanges(false)

        if (showToast) {
          toast({
            title: "Design Saved Locally!",
            description: `"${designName}" has been saved to local storage.`,
            variant: "default",
          })
        }
      }

      setCurrentDesignName(designName)
      setShowSaveDialog(false)
    } catch (error) {
      console.error("🎨 Save failed:", error)
      if (showToast) {
        toast({
          title: "Save Failed",
          description: "There was an error saving your design.",
          variant: "destructive",
        })
      }
    } finally {
      setIsSaving(false)
    }
  }

  const loadDesign = async (design: LogoDesignData) => {
    console.log("🎨 Loading logo design:", design)
    setIsLoading(true)

    try {
      // Restore the design state
      setCanvasSize(design.data.canvasSize)
      setCurrentDesignName(design.name)
      setCurrentDesignId(design.id)

      // Restore elements - filter out any with blob URLs or missing data
      const restoredElements = (design.data.elements || [])
          .filter((element) => {
            // Keep all elements except images with blob URLs
            if (element.type === "image" && element.imageUrl && element.imageUrl.startsWith("data:")) {
              return false
            }
            return true
          })
          .map((element) => ({
            ...element,
            imageFile: undefined, // Files can't be restored
          }))

      console.log("🎨 Restored elements:", restoredElements)
      setElements(restoredElements)

      // Force immediate redraw
      setTimeout(() => {
        redrawCanvas()
      }, 50)

      // Load images for restored elements
      restoredElements.forEach((element) => {
        if (element.type === "image" && element.imageUrl && !element.imageUrl.startsWith("blob:")) {
          const img = new window.Image()
          img.crossOrigin = "anonymous"
          img.onload = () => {
            console.log("🎨 Loaded image for restored element:", element.imageUrl)
            setLoadedImages((prev) => new Map(prev).set(element.imageUrl!, img))
            // Trigger a redraw
            setTimeout(() => redrawCanvas(), 100)
          }
          img.onerror = (error) => {
            console.error("🎨 Failed to load image for restored element:", element.imageUrl, error)
          }
          img.src = element.imageUrl
        }
      })

      setShowHistoryModal(false)
      setHasUnsavedChanges(false)

      toast({
        title: "Design Loaded!",
        description: `"${design.name}" has been loaded successfully.`,
      })

      if (restoredElements.length < (design.data.elements?.length || 0)) {
        toast({
          title: "Some Images Skipped",
          description: "Local images couldn't be restored. Only shapes and text were loaded.",
          variant: "default",
        })
      }
    } catch (error) {
      console.error("🎨 Load failed:", error)
      toast({
        title: "Load Failed",
        description: "There was an error loading the design.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const deleteDesign = async (designId: string) => {
    if (!user) return

    try {
      const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://mockupgenerator-be.vercel.app"
      const response = await fetch(`${BACKEND_URL}/api/designs/delete?designId=${designId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to delete from server")
      }

      // Reload design history
      await loadDesignHistory()

      toast({
        title: "Design Deleted",
        description: "The design has been removed from your history.",
      })
    } catch (error) {
      console.error("🎨 Delete failed:", error)

      // Fallback to local storage
      const existingDesigns = JSON.parse(localStorage.getItem("logo-designs") || "[]")
      const updatedDesigns = existingDesigns.filter((d: LogoDesignData) => d.id !== designId)
      localStorage.setItem("logo-designs", JSON.stringify(updatedDesigns))
      setDesignHistory(updatedDesigns)

      toast({
        title: "Design Deleted Locally",
        description: "The design has been removed from local storage.",
      })
    }
  }

  // Generate thumbnail for design preview
  const generateDesignThumbnail = async (design: LogoDesignData): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        resolve("/placeholder.svg?height=200&width=200")
        return
      }

      // Set thumbnail size
      canvas.width = 200
      canvas.height = 200

      // Draw white background
      ctx.fillStyle = "white"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Calculate scale to fit design in thumbnail
      const scaleX = canvas.width / design.data.canvasSize.width
      const scaleY = canvas.height / design.data.canvasSize.height
      const scale = Math.min(scaleX, scaleY)

      // Center the design in thumbnail
      const offsetX = (canvas.width - design.data.canvasSize.width * scale) / 2
      const offsetY = (canvas.height - design.data.canvasSize.height * scale) / 2

      ctx.save()
      ctx.translate(offsetX, offsetY)
      ctx.scale(scale, scale)

      // Draw elements
      const visibleElements = (design.data.elements || [])
          .filter((element) => element.visible)
          .sort((a, b) => a.zIndex - b.zIndex)

      if (visibleElements.length === 0) {
        ctx.restore()
        resolve(canvas.toDataURL("image/jpeg", 0.8))
        return
      }

      let processedElements = 0
      const totalElements = visibleElements.length

      const checkComplete = () => {
        processedElements++
        if (processedElements === totalElements) {
          ctx.restore()
          resolve(canvas.toDataURL("image/jpeg", 0.8))
        }
      }

      visibleElements.forEach((element) => {
        ctx.save()

        // Apply transformations
        ctx.translate(element.position.x + element.size.width / 2, element.position.y + element.size.height / 2)
        ctx.rotate((element.rotation * Math.PI) / 180)
        ctx.translate(-element.size.width / 2, -element.size.height / 2)

        // Draw based on element type
        switch (element.type) {
          case "shape":
            ctx.fillStyle = element.fillColor || "#3b82f6"
            ctx.strokeStyle = element.strokeColor || "#000000"
            ctx.lineWidth = element.strokeWidth || 2

            if (element.shapeType === "rectangle") {
              ctx.fillRect(0, 0, element.size.width, element.size.height)
              if (element.strokeWidth && element.strokeWidth > 0) {
                ctx.strokeRect(0, 0, element.size.width, element.size.height)
              }
            } else if (element.shapeType === "circle") {
              const radius = Math.min(element.size.width, element.size.height) / 2
              ctx.beginPath()
              ctx.arc(element.size.width / 2, element.size.height / 2, radius, 0, Math.PI * 2)
              ctx.fill()
              if (element.strokeWidth && element.strokeWidth > 0) {
                ctx.stroke()
              }
            } else if (element.shapeType === "triangle") {
              ctx.beginPath()
              ctx.moveTo(element.size.width / 2, 0)
              ctx.lineTo(0, element.size.height)
              ctx.lineTo(element.size.width, element.size.height)
              ctx.closePath()
              ctx.fill()
              if (element.strokeWidth && element.strokeWidth > 0) {
                ctx.stroke()
              }
            }
            ctx.restore()
            checkComplete()
            break
          case "text":
            ctx.fillStyle = element.textColor || "#000000"
            ctx.font = `${element.fontStyle || "normal"} ${element.fontWeight || "normal"} ${element.fontSize || 24}px ${element.fontFamily || "Arial"}`
            ctx.textAlign = (element.textAlign as CanvasTextAlign) || "center"
            ctx.textBaseline = "middle"

            let x = 0
            if (element.textAlign === "center") {
              x = element.size.width / 2
            } else if (element.textAlign === "right") {
              x = element.size.width
            }

            ctx.fillText(element.text || "", x, element.size.height / 2)
            ctx.restore()
            checkComplete()
            break
          case "image":
            // Try to load and draw the actual image for thumbnails
            if (element.imageUrl && !element.imageUrl.startsWith("blob:") && !element.imageUrl.startsWith("data:")) {
              const img = new window.Image()
              img.crossOrigin = "anonymous"
              img.onload = () => {
                ctx.drawImage(img, 0, 0, element.size.width, element.size.height)
                ctx.restore()
                checkComplete()
              }
              img.onerror = () => {
                // Fallback to placeholder
                ctx.fillStyle = "#f3f4f6"
                ctx.fillRect(0, 0, element.size.width, element.size.height)
                ctx.strokeStyle = "#d1d5db"
                ctx.lineWidth = 2
                ctx.strokeRect(0, 0, element.size.width, element.size.height)
                ctx.restore()
                checkComplete()
              }
              img.src = element.imageUrl
            } else {
              // Draw placeholder for local/blob images
              ctx.fillStyle = "#f3f4f6"
              ctx.fillRect(0, 0, element.size.width, element.size.height)
              ctx.strokeStyle = "#d1d5db"
              ctx.lineWidth = 2
              ctx.strokeRect(0, 0, element.size.width, element.size.height)
              ctx.restore()
              checkComplete()
            }
            break
          default:
            ctx.restore()
            checkComplete()
            break
        }
      })
    })
  }

  const loadDesignHistory = async () => {
    if (!user) {
      setDesignHistory([])
      return
    }

    try {
      const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://mockupgenerator-be.vercel.app"
      const response = await fetch(`${BACKEND_URL}/api/designs/list`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log("🎨 API Response:", data)

        // Handle the nested response structure
        let serverDesigns: LogoDesignData[] = []
        if (data.success && data.data && data.data.designs && Array.isArray(data.data.designs)) {
          serverDesigns = data.data.designs
        } else if (Array.isArray(data)) {
          serverDesigns = data
        } else {
          console.warn("🎨 Unexpected API response format:", data)
          serverDesigns = []
        }

        setDesignHistory(serverDesigns)

        // Generate thumbnails for designs
        const thumbnails: Record<string, string> = {}
        for (const design of serverDesigns) {
          try {
            const thumbnail = await generateDesignThumbnail(design)
            thumbnails[design.id] = thumbnail
          } catch (error) {
            console.error("Failed to generate thumbnail for design:", design.id, error)
            thumbnails[design.id] = "/placeholder.svg?height=200&width=200"
          }
        }
        setDesignThumbnails(thumbnails)

        // Sync with local storage
        localStorage.setItem("logo-designs", JSON.stringify(serverDesigns))
        return
      }

      // Fallback to local storage
      const savedDesigns = JSON.parse(localStorage.getItem("logo-designs") || "[]")
      const validDesigns = Array.isArray(savedDesigns) ? savedDesigns : []
      setDesignHistory(validDesigns)

      // Generate thumbnails for local designs
      const thumbnails: Record<string, string> = {}
      for (const design of validDesigns) {
        try {
          const thumbnail = await generateDesignThumbnail(design)
          thumbnails[design.id] = thumbnail
        } catch (error) {
          console.error("Failed to generate thumbnail for design:", design.id, error)
          thumbnails[design.id] = "/placeholder.svg?height=200&width=200"
        }
      }
      setDesignThumbnails(thumbnails)
    } catch (error) {
      console.error("🎨 Load history failed:", error)
      // Fallback to local storage
      const savedDesigns = JSON.parse(localStorage.getItem("logo-designs") || "[]")
      const validDesigns = Array.isArray(savedDesigns) ? savedDesigns : []
      setDesignHistory(validDesigns)

      // Generate thumbnails for local designs
      const thumbnails: Record<string, string> = {}
      for (const design of validDesigns) {
        try {
          const thumbnail = await generateDesignThumbnail(design)
          thumbnails[design.id] = thumbnail
        } catch (error) {
          console.error("Failed to generate thumbnail for design:", design.id, error)
          thumbnails[design.id] = "/placeholder.svg?height=200&width=200"
        }
      }
      setDesignThumbnails(thumbnails)
    }
  }

  // Set up event listeners
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging || isResizing || isResizingCanvas) {
        // Convert global mouse event to canvas coordinates
        const canvas = canvasRef.current
        if (!canvas) return

        const rect = canvas.getBoundingClientRect()
        const coords = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        }

        // Handle canvas resizing
        if (isResizingCanvas && resizeDirection) {
          const deltaX = coords.x - initialMousePos.x
          const deltaY = coords.y - initialMousePos.y

          let newWidth = initialCanvasSize.width
          let newHeight = initialCanvasSize.height

          if (resizeDirection.includes("e")) {
            newWidth = Math.max(200, initialCanvasSize.width + deltaX)
          }
          if (resizeDirection.includes("s")) {
            newHeight = Math.max(200, initialCanvasSize.height + deltaY)
          }

          setCanvasSize({ width: newWidth, height: newHeight })
          return
        }

        if (isResizing && resizeHandle && selectedElementIndex !== null) {
          const element = elements[selectedElementIndex]
          const deltaX = coords.x - initialMousePos.x
          const deltaY = coords.y - initialMousePos.y

          const newElements = [...elements]
          let newWidth = element.size.width
          let newHeight = element.size.height
          let newX = element.position.x
          let newY = element.position.y

          if (resizeHandle.includes("e")) {
            newWidth = Math.max(20, element.size.width + deltaX)
          }
          if (resizeHandle.includes("w")) {
            const widthChange = element.size.width - Math.max(20, element.size.width - deltaX)
            newWidth = Math.max(20, element.size.width - deltaX)
            newX = element.position.x + widthChange
          }
          if (resizeHandle.includes("s")) {
            newHeight = Math.max(20, element.size.height + deltaY)
          }
          if (resizeHandle.includes("n")) {
            const heightChange = element.size.height - Math.max(20, element.size.height - deltaY)
            newHeight = Math.max(20, element.size.height - deltaY)
            newY = element.position.y + heightChange
          }

          if (element.maintainAspectRatio) {
            const aspectRatio = element.size.width / element.size.height

            if (resizeHandle === "se" || resizeHandle === "nw" || resizeHandle === "ne" || resizeHandle === "sw") {
              if (Math.abs(deltaX) > Math.abs(deltaY)) {
                newHeight = newWidth / aspectRatio
                if (resizeHandle.includes("n")) {
                  newY = element.position.y + element.size.height - newHeight
                }
              } else {
                newWidth = newHeight * aspectRatio
                if (resizeHandle.includes("w")) {
                  newX = element.position.x + element.size.width - newWidth
                }
              }
            }
          }

          newElements[selectedElementIndex] = {
            ...element,
            position: { x: newX, y: newY },
            size: { width: newWidth, height: newHeight },
          }
          setElements(newElements)
          return
        }

        if (isDragging && selectedElementIndex !== null) {
          const element = elements[selectedElementIndex]

          if (element && !element.locked) {
            const newElements = [...elements]
            let newX = coords.x - dragOffset.x
            let newY = coords.y - dragOffset.y

            if (snapToGrid) {
              newX = Math.round(newX / gridSize) * gridSize
              newY = Math.round(newY / gridSize) * gridSize
            }

            newX = Math.max(0, Math.min(newX, canvasSize.width - element.size.width))
            newY = Math.max(0, Math.min(newY, canvasSize.height - element.size.height))

            newElements[selectedElementIndex].position = { x: newX, y: newY }
            setElements(newElements)
          }
        }
      }
    }

    const handleGlobalMouseUp = () => {
      if (isDragging || isResizing || isResizingCanvas) {
        saveCanvasState()
      }

      setMouseDown(false)
      setIsDragging(false)
      setIsResizing(false)
      setIsResizingCanvas(false)
      setResizeHandle(null)
      setResizeDirection(null)
      setDragOffset({ x: 0, y: 0 })
    }

    window.addEventListener("mousemove", handleGlobalMouseMove)
    window.addEventListener("mouseup", handleGlobalMouseUp)

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove)
      window.removeEventListener("mouseup", handleGlobalMouseUp)
    }
  }, [
    isDragging,
    isResizing,
    isResizingCanvas,
    selectedElementIndex,
    elements,
    dragOffset,
    resizeHandle,
    resizeDirection,
    initialMousePos,
    initialCanvasSize,
    snapToGrid,
    gridSize,
    canvasSize,
  ])

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
                <h1 className="text-xl font-bold">Vector Logo Designer</h1>
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

              <Button variant="outline" className="gap-2" onClick={() => setShowHistoryModal(true)} disabled={isLoading}>
                {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                    </>
                ) : (
                    <>
                      <Clock className="h-4 w-4" /> Recent
                    </>
                )}
              </Button>

              <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => setShowSaveDialog(true)}
                  disabled={elements.length === 0 || isSaving || !user}
              >
                {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                    </>
                ) : (
                    <>
                      <Save className="h-4 w-4" /> Save
                    </>
                )}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    Download
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => {
                    const cleanCanvas = exportCleanCanvas()
                    if (!cleanCanvas) return
                    const link = document.createElement('a')
                    link.download = `${currentDesignName || 'logo'}.png`
                    link.href = cleanCanvas.toDataURL()
                    link.click()
                  }}>
                    <Download className="w-4 h-4 mr-2" />
                    Download PNG
                  </DropdownMenuItem>
                  <DropdownMenuItem
                      onClick={downloadAssetsAsZip}
                      disabled={isGeneratingZip}
                  >
                    {isGeneratingZip ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <Archive className="w-4 h-4 mr-2" />
                    )}
                    Download Bandkit
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
                        <Button variant="outline" onClick={() => addShape("triangle")} className="h-16 flex-col gap-1">
                          <Triangle className="h-6 w-6" />
                          <span className="text-xs">Triangle</span>
                        </Button>
                        <Button variant="outline" onClick={() => addShape("star")} className="h-16 flex-col gap-1">
                          <Star className="h-6 w-6" />
                          <span className="text-xs">Star</span>
                        </Button>
                        <Button variant="outline" onClick={() => addShape("heart")} className="h-16 flex-col gap-1">
                          <Heart className="h-6 w-6" />
                          <span className="text-xs">Heart</span>
                        </Button>
                        <Button variant="outline" onClick={() => addShape("hexagon")} className="h-16 flex-col gap-1">
                          <Hexagon className="h-6 w-6" />
                          <span className="text-xs">Hexagon</span>
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
                    <div
                        ref={containerRef}
                        className="relative border-2 border-gray-200 rounded-lg overflow-hidden"
                        style={{
                          cursor: isResizingCanvas
                              ? resizeDirection === "se"
                                  ? "nw-resize"
                                  : resizeDirection === "e"
                                      ? "ew-resize"
                                      : "ns-resize"
                              : "default",
                        }}
                    >
                      <canvas
                          ref={canvasRef}
                          onMouseDown={handleMouseDown}
                          onMouseMove={handleMouseMove}
                          onMouseUp={handleMouseUp}
                          onMouseLeave={handleMouseUp}
                          onMouseEnter={() => setShowCanvasHandles(true)}
                          className="cursor-crosshair"
                          style={{ maxWidth: "100%", height: "auto" }}
                      />
                    </div>
                  </div>
                  <div className="mt-4 text-center text-sm text-gray-500">
                    Canvas: {canvasSize.width} × {canvasSize.height}px | Elements: {elements.length}
                    {hasUnsavedChanges && <span className="text-orange-500 ml-2">• Unsaved changes</span>}
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

        <LoginModal open={showAuthModal} onOpenChange={handleAuthModalClose} onSuccess={handleAuthSuccess} />

        {/* Save Design Dialog */}
        <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Save Logo Design</DialogTitle>
              <DialogDescription>Give your logo design a name to save it to your recent projects.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="design-name">Design Name</Label>
                <Input
                    id="design-name"
                    value={currentDesignName}
                    onChange={(e) => setCurrentDesignName(e.target.value)}
                    placeholder="My Awesome Logo"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => saveCurrentDesign()} className="flex-1" disabled={isSaving}>
                  {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Saving...
                      </>
                  ) : (
                      "Save Design"
                  )}
                </Button>
                <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Design History Modal */}
        <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
          <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Logo Designs
              </DialogTitle>
              <DialogDescription>Continue where you left off or start fresh with a previous design.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {!Array.isArray(designHistory) || designHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold mb-2">No Recent Designs</h3>
                    <p className="text-gray-600">Start creating your first logo design to see it here!</p>
                  </div>
              ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {designHistory
                        .filter(
                            (design: LogoDesignData) => Array.isArray(design.data?.elements) && !design.data?.selectedTemplate,
                        )
                        .map((design: LogoDesignData) => (
                            <Card key={design.id} className="cursor-pointer hover:shadow-md transition-shadow">
                              <CardContent className="p-4">
                                <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden relative">
                                  {designThumbnails[design.id] ? (
                                      <Image
                                          src={designThumbnails[design.id] || "/placeholder.svg"}
                                          alt={`Preview of ${design.name}`}
                                          fill
                                          className="object-cover"
                                      />
                                  ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                                      </div>
                                  )}

                                  {/* Canvas size badge */}
                                  <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                    {design.data.canvasSize.width}×{design.data.canvasSize.height}
                                  </div>

                                  {/* Element count badge */}
                                  {design.data.elements && design.data.elements.length > 0 && (
                                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                                        {design.data.elements.length} element{design.data.elements.length !== 1 ? "s" : ""}
                                      </div>
                                  )}
                                </div>

                                <div className="space-y-2">
                                  <h4 className="font-semibold truncate">{design.name}</h4>
                                  <div className="text-xs text-gray-500 space-y-1">
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      Created: {new Date(design.createdAt).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      Updated: {new Date(design.updatedAt).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Maximize2 className="h-3 w-3" />
                                      {design.data.canvasSize?.width || 500} × {design.data.canvasSize?.height || 500}px
                                    </div>
                                  </div>

                                  <div className="flex gap-2 pt-2">
                                    <Button size="sm" onClick={() => loadDesign(design)} className="flex-1">
                                      <FileText className="h-3 w-3 mr-1" />
                                      Load
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          deleteDesign(design.id)
                                        }}
                                    >
                                      <Trash className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                        ))}
                  </div>
              )}

              <div className="flex justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => setShowHistoryModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
  )
}
