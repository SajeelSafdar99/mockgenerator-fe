"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Download,
  Upload,
  Move,
  RotateCcw,
  ZoomIn,
  Layers,
  PanelLeft,
  PanelRight,
  ImageIcon,
  Trash2,
  SunMedium,
  Contrast,
  Palette,
  Sparkles,
  Loader2,
  HelpCircle,
  ArrowLeft,
  Maximize2,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Grid3X3,
  MoreHorizontal,
} from "lucide-react"
import { useIsMobile as useMobile } from "@/hooks/use-mobile"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {useAuth} from "@/lib/auth-context";
import LoginModal from "@/components/login-modal";

// Define logo data structure with enhanced properties
interface LogoData {
  id: string
  file: File | null
  url: string | null
  position: { x: number; y: number }
  size: number
  rotation: number
  zIndex: number
  locked: boolean
  visible: boolean
  aspectRatio: number
  maintainAspectRatio: boolean
  filters: {
    brightness: number
    contrast: number
    hue: number
    saturation: number
  }
}

// Canvas size presets
const CANVAS_PRESETS = {
  square: { width: 1080, height: 1080, name: "Square (1:1)" },
  landscape: { width: 1920, height: 1080, name: "Landscape (16:9)" },
  portrait: { width: 1080, height: 1920, name: "Portrait (9:16)" },
  a4: { width: 2480, height: 3508, name: "A4 Print" },
  instagram: { width: 1080, height: 1080, name: "Instagram Post" },
  story: { width: 1080, height: 1920, name: "Instagram Story" },
  facebook: { width: 1200, height: 630, name: "Facebook Cover" },
  custom: { width: 800, height: 600, name: "Custom Size" },
}

// Define template data structure
export interface TemplateData {
  id: string
  name: string
  image: string
}

export default function EditorPage() {
  const searchParams = useSearchParams()
  const initialTemplate = searchParams.get("template") || "box"
  const [selectedTemplate, setSelectedTemplate] = useState(initialTemplate)
  const [logos, setLogos] = useState<LogoData[]>([])
  const [selectedLogoIndex, setSelectedLogoIndex] = useState<number | null>(null)
  const [selectedLogos, setSelectedLogos] = useState<number[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [templateColor, setTemplateColor] = useState("#FFFFFF")
  const [showLeftPanel, setShowLeftPanel] = useState(true)
  const [showRightPanel, setShowRightPanel] = useState(true)
  const [activeTab, setActiveTab] = useState("logo")
  const [aiPrompt, setAiPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedLogos, setGeneratedLogos] = useState<string[]>([])
  const [isDownloading, setIsDownloading] = useState(false)
  const [showWelcome, setShowWelcome] = useState(true)
  const [showResizeDialog, setShowResizeDialog] = useState(false)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })
  const [selectedPreset, setSelectedPreset] = useState("custom")
  const [customSize, setCustomSize] = useState({ width: 800, height: 600 })
  const [scaleElements, setScaleElements] = useState(true)
  const [showGrid, setShowGrid] = useState(false)
  const [snapToGrid, setSnapToGrid] = useState(false)
  const [waxEffect, setWaxEffect] = useState({
    enabled: false,
    opacity: 0.1,
    rotation: 45,
    spacing: 100,
    pattern: "logo",
    size: 50, // Add size control
  })
  const containerRef = useRef<HTMLDivElement>(null)
  const isMobile = useMobile()
  const { user } = useAuth()
  const [showLoginModal, setShowLoginModal] = useState(false)
  // Template data mapping
  const templateImages: Record<string, string> = {
    box: "/product-box.png??key=lkdoe",
    cup: "/cup.png?key=7tclj",
    bag: "/bag.jpg?key=yfvyb",
    container: "/food-container.webp?key=pbzx5",
  }

  const templateNames: Record<string, string> = {
    box: "Product Box",
    cup: "Coffee Cup",
    bag: "Shopping Bag",
    container: "Food Container",
  }

  // Get the currently selected logo
  const selectedLogo = selectedLogoIndex !== null ? logos[selectedLogoIndex] : null

  // Create a new logo with enhanced properties
  const createNewLogo = (file: File | null = null, url: string | null = null): LogoData => {
    const newZIndex = Math.max(...logos.map((l) => l.zIndex), 0) + 1
    return {
      id: Date.now().toString(),
      file,
      url,
      position: { x: 50, y: 50 },
      size: 30,
      rotation: 0,
      zIndex: newZIndex,
      locked: false,
      visible: true,
      aspectRatio: 1,
      maintainAspectRatio: true,
      filters: {
        brightness: 100,
        contrast: 100,
        hue: 0,
        saturation: 100,
      },
    }
  }

  // Add a new logo
  const addLogo = (file: File | null = null, url: string | null = null) => {
    const newLogo = createNewLogo(file, url)
    setLogos([...logos, newLogo])
    setSelectedLogoIndex(logos.length)
    setShowWelcome(false)
    toast({
      title: "Logo Added!",
      description: "Your logo has been added to the canvas. Drag it to position it perfectly.",
    })
  }

  // Remove the selected logo
  const removeLogo = () => {
    if (selectedLogoIndex === null) return

    const newLogos = [...logos]
    newLogos.splice(selectedLogoIndex, 1)
    setLogos(newLogos)
    setSelectedLogoIndex(newLogos.length > 0 ? 0 : null)

    if (newLogos.length === 0) {
      setShowWelcome(true)
    }

    toast({
      title: "Logo Removed",
      description: "The logo has been removed from your design.",
    })
  }

  // Layer management functions
  const moveLayerUp = (index: number) => {
    const newLogos = [...logos]
    const currentZIndex = newLogos[index].zIndex
    const higherLayers = newLogos.filter((l) => l.zIndex > currentZIndex)

    if (higherLayers.length > 0) {
      const nextZIndex = Math.min(...higherLayers.map((l) => l.zIndex))
      const swapIndex = newLogos.findIndex((l) => l.zIndex === nextZIndex)

      newLogos[index].zIndex = nextZIndex
      newLogos[swapIndex].zIndex = currentZIndex
      setLogos(newLogos)
    }
  }

  const moveLayerDown = (index: number) => {
    const newLogos = [...logos]
    const currentZIndex = newLogos[index].zIndex
    const lowerLayers = newLogos.filter((l) => l.zIndex < currentZIndex)

    if (lowerLayers.length > 0) {
      const nextZIndex = Math.max(...lowerLayers.map((l) => l.zIndex))
      const swapIndex = newLogos.findIndex((l) => l.zIndex === nextZIndex)

      newLogos[index].zIndex = nextZIndex
      newLogos[swapIndex].zIndex = currentZIndex
      setLogos(newLogos)
    }
  }

  const bringToFront = (index: number) => {
    const newLogos = [...logos]
    const maxZIndex = Math.max(...newLogos.map((l) => l.zIndex))
    newLogos[index].zIndex = maxZIndex + 1
    setLogos(newLogos)
  }

  const sendToBack = (index: number) => {
    const newLogos = [...logos]
    const minZIndex = Math.min(...newLogos.map((l) => l.zIndex))
    newLogos[index].zIndex = minZIndex - 1
    setLogos(newLogos)
  }

  const toggleLayerVisibility = (index: number) => {
    const newLogos = [...logos]
    newLogos[index].visible = !newLogos[index].visible
    setLogos(newLogos)
  }

  const toggleLayerLock = (index: number) => {
    const newLogos = [...logos]
    newLogos[index].locked = !newLogos[index].locked
    setLogos(newLogos)
  }

  // Alignment functions
  const alignElements = (alignment: string) => {
    if (selectedLogos.length < 2) {
      toast({
        title: "Select Multiple Elements",
        description: "Please select at least 2 elements to align them.",
        variant: "destructive",
      })
      return
    }

    const newLogos = [...logos]
    const selectedElements = selectedLogos.map((i) => newLogos[i])

    switch (alignment) {
      case "left":
        const leftMost = Math.min(...selectedElements.map((l) => l.position.x))
        selectedLogos.forEach((i) => {
          newLogos[i].position.x = leftMost
        })
        break
      case "right":
        const rightMost = Math.max(...selectedElements.map((l) => l.position.x))
        selectedLogos.forEach((i) => {
          newLogos[i].position.x = rightMost
        })
        break
      case "center":
        const centerX = selectedElements.reduce((sum, l) => sum + l.position.x, 0) / selectedElements.length
        selectedLogos.forEach((i) => {
          newLogos[i].position.x = centerX
        })
        break
      case "top":
        const topMost = Math.min(...selectedElements.map((l) => l.position.y))
        selectedLogos.forEach((i) => {
          newLogos[i].position.y = topMost
        })
        break
      case "bottom":
        const bottomMost = Math.max(...selectedElements.map((l) => l.position.y))
        selectedLogos.forEach((i) => {
          newLogos[i].position.y = bottomMost
        })
        break
      case "middle":
        const centerY = selectedElements.reduce((sum, l) => sum + l.position.y, 0) / selectedElements.length
        selectedLogos.forEach((i) => {
          newLogos[i].position.y = centerY
        })
        break
      case "distribute-h":
        const sortedByX = [...selectedLogos].sort((a, b) => newLogos[a].position.x - newLogos[b].position.x)
        const leftX = newLogos[sortedByX[0]].position.x
        const rightX = newLogos[sortedByX[sortedByX.length - 1]].position.x
        const stepX = (rightX - leftX) / (sortedByX.length - 1)
        sortedByX.forEach((i, index) => {
          newLogos[i].position.x = leftX + stepX * index
        })
        break
      case "distribute-v":
        const sortedByY = [...selectedLogos].sort((a, b) => newLogos[a].position.y - newLogos[b].position.y)
        const topY = newLogos[sortedByY[0]].position.y
        const bottomY = newLogos[sortedByY[sortedByY.length - 1]].position.y
        const stepY = (bottomY - topY) / (sortedByY.length - 1)
        sortedByY.forEach((i, index) => {
          newLogos[i].position.y = topY + stepY * index
        })
        break
    }

    setLogos(newLogos)
    toast({
      title: "Elements Aligned",
      description: `Successfully aligned ${selectedLogos.length} elements.`,
    })
  }

  // Canvas resize function
  const resizeCanvas = () => {
    const preset = CANVAS_PRESETS[selectedPreset as keyof typeof CANVAS_PRESETS]
    const newSize = selectedPreset === "custom" ? customSize : { width: preset.width, height: preset.height }

    if (scaleElements && logos.length > 0) {
      const scaleX = newSize.width / canvasSize.width
      const scaleY = newSize.height / canvasSize.height

      const newLogos = logos.map((logo) => ({
        ...logo,
        position: {
          x: logo.position.x * scaleX,
          y: logo.position.y * scaleY,
        },
        size: logo.size * Math.min(scaleX, scaleY),
      }))
      setLogos(newLogos)
    }

    setCanvasSize(newSize)
    setShowResizeDialog(false)

    toast({
      title: "Canvas Resized",
      description: `Canvas size changed to ${newSize.width}x${newSize.height}px`,
    })
  }

  // Update logo URL when file changes
  useEffect(() => {
    logos.forEach((logo, index) => {
      if (logo.file && !logo.url) {
        const url = URL.createObjectURL(logo.file)
        const updatedLogos = [...logos]
        updatedLogos[index] = { ...logo, url }
        setLogos(updatedLogos)

        // Calculate aspect ratio for uploaded images
        const img = new window.Image()
        img.onload = () => {
          const aspectRatio = img.width / img.height
          const newLogos = [...updatedLogos]
          newLogos[index] = { ...newLogos[index], aspectRatio }
          setLogos(newLogos)
        }
        img.src = url
      }
    })

    // Cleanup URLs when component unmounts
    return () => {
      logos.forEach((logo) => {
        if (logo.url && logo.url.startsWith("blob:")) {
          URL.revokeObjectURL(logo.url)
        }
      })
    }
  }, [logos])

  // Handle file upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PNG, JPG, or other image file.",
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

      const objectUrl = URL.createObjectURL(file)
      addLogo(file, objectUrl)

      // Reset the input value so the same file can be selected again if needed
      e.target.value = ""
    }
  }

  // Enhanced drag and resize handlers
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, logoIndex: number) => {
    if (logos[logoIndex].locked) return

    setSelectedLogoIndex(logoIndex)
    setIsDragging(true)

    let clientX: number, clientY: number

    if ("touches" in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) {
      const logo = logos[logoIndex]
      const offsetX = clientX - rect.left - (rect.width * logo.position.x) / 100
      const offsetY = clientY - rect.top - (rect.height * logo.position.y) / 100
      setDragOffset({ x: offsetX, y: offsetY })
    }
  }

  const handleResizeStart = (e: React.MouseEvent, logoIndex: number, handle: string) => {
    e.stopPropagation()
    if (logos[logoIndex].locked) return

    setSelectedLogoIndex(logoIndex)
    setIsResizing(true)
    setResizeHandle(handle)
  }

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging && !isResizing) return
    if (selectedLogoIndex === null || !containerRef.current) return

    e.preventDefault()

    let clientX: number, clientY: number

    if ("touches" in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    const rect = containerRef.current.getBoundingClientRect()

    if (isDragging) {
      let x = ((clientX - rect.left - dragOffset.x) / rect.width) * 100
      let y = ((clientY - rect.top - dragOffset.y) / rect.height) * 100

      // Snap to grid if enabled
      if (snapToGrid) {
        const gridSize = 5 // 5% grid
        x = Math.round(x / gridSize) * gridSize
        y = Math.round(y / gridSize) * gridSize
      }

      const newLogos = [...logos]
      newLogos[selectedLogoIndex] = {
        ...newLogos[selectedLogoIndex],
        position: {
          x: Math.max(0, Math.min(100, x)),
          y: Math.max(0, Math.min(100, y)),
        },
      }
      setLogos(newLogos)
    } else if (isResizing && resizeHandle) {
      const logo = logos[selectedLogoIndex]
      const centerX = (rect.width * logo.position.x) / 100
      const centerY = (rect.height * logo.position.y) / 100

      const deltaX = clientX - rect.left - centerX
      const deltaY = clientY - rect.top - centerY

      let newSize = logo.size

      if (resizeHandle.includes("right")) {
        newSize = Math.max(5, Math.min(100, (Math.abs(deltaX) / rect.width) * 200))
      } else if (resizeHandle.includes("bottom")) {
        newSize = Math.max(5, Math.min(100, (Math.abs(deltaY) / rect.height) * 200))
      } else if (resizeHandle.includes("corner")) {
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
        newSize = Math.max(5, Math.min(100, (distance / rect.width) * 200))
      }

      const newLogos = [...logos]
      newLogos[selectedLogoIndex] = {
        ...newLogos[selectedLogoIndex],
        size: newSize,
      }
      setLogos(newLogos)
    }
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    setIsResizing(false)
    setResizeHandle(null)
  }

  // Update logo properties
  const updateLogoSize = (size: number) => {
    if (selectedLogoIndex === null) return

    const newLogos = [...logos]
    newLogos[selectedLogoIndex] = {
      ...newLogos[selectedLogoIndex],
      size,
    }
    setLogos(newLogos)
  }

  const updateLogoRotation = (rotation: number) => {
    if (selectedLogoIndex === null) return

    const newLogos = [...logos]
    newLogos[selectedLogoIndex] = {
      ...newLogos[selectedLogoIndex],
      rotation,
    }
    setLogos(newLogos)
  }

  const updateLogoPosition = (x: number, y: number) => {
    if (selectedLogoIndex === null) return

    const newLogos = [...logos]
    newLogos[selectedLogoIndex] = {
      ...newLogos[selectedLogoIndex],
      position: { x, y },
    }
    setLogos(newLogos)
  }

  const updateLogoFilter = (filter: keyof LogoData["filters"], value: number) => {
    if (selectedLogoIndex === null) return

    const newLogos = [...logos]
    newLogos[selectedLogoIndex] = {
      ...newLogos[selectedLogoIndex],
      filters: {
        ...newLogos[selectedLogoIndex].filters,
        [filter]: value,
      },
    }
    setLogos(newLogos)
  }

  const toggleMaintainAspectRatio = () => {
    if (selectedLogoIndex === null) return

    const newLogos = [...logos]
    newLogos[selectedLogoIndex] = {
      ...newLogos[selectedLogoIndex],
      maintainAspectRatio: !newLogos[selectedLogoIndex].maintainAspectRatio,
    }
    setLogos(newLogos)
  }

  // Reset logo position and settings
  const resetLogo = () => {
    if (selectedLogoIndex === null) return

    const newLogos = [...logos]
    newLogos[selectedLogoIndex] = {
      ...newLogos[selectedLogoIndex],
      position: { x: 50, y: 50 },
      size: 30,
      rotation: 0,
      filters: {
        brightness: 100,
        contrast: 100,
        hue: 0,
        saturation: 100,
      },
    }
    setLogos(newLogos)

    toast({
      title: "Logo Reset",
      description: "Logo position and settings have been reset to default.",
    })
  }

  // Enhanced download function
  const handleDownload = () => {
    if (!containerRef.current) return
    if (!user) {
      setShowLoginModal(true)
      return
    }
    setIsDownloading(true)

    try {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        setIsDownloading(false)
        toast({
          title: "Error",
          description: "Could not create canvas context for download",
          variant: "destructive",
        })
        return
      }

      canvas.width = canvasSize.width
      canvas.height = canvasSize.height

      // Draw white background
      ctx.fillStyle = "white"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw wax effect if enabled
      if (waxEffect.enabled && logos.length > 0) {
        const firstLogo = logos.find((l) => l.url)
        if (firstLogo?.url) {
          const waxImg = new window.Image()
          waxImg.crossOrigin = "anonymous"
          waxImg.onload = () => {
            ctx.save()
            ctx.globalAlpha = waxEffect.opacity
            ctx.globalCompositeOperation = "multiply"

            // Create pattern
            const patternCanvas = document.createElement("canvas")
            const patternCtx = patternCanvas.getContext("2d")
            if (patternCtx) {
              patternCanvas.width = waxEffect.size
              patternCanvas.height = waxEffect.size

              // Draw logo in pattern canvas
              patternCtx.filter = "grayscale(100%) brightness(150%)"
              patternCtx.drawImage(waxImg, 0, 0, waxEffect.size, waxEffect.size)

              // Create pattern and fill
              const pattern = ctx.createPattern(patternCanvas, "repeat")
              if (pattern) {
                ctx.save()
                ctx.translate(canvas.width / 2, canvas.height / 2)
                ctx.rotate((waxEffect.rotation * Math.PI) / 180)
                ctx.translate(-canvas.width / 2, -canvas.height / 2)
                ctx.fillStyle = pattern
                ctx.fillRect(0, 0, canvas.width, canvas.height)
                ctx.restore()
              }
            }

            ctx.restore()
            // Continue with main rendering
            renderMainContent()
          }
          waxImg.src = firstLogo.url
        }
      } else {
        renderMainContent()
      }

      function renderMainContent() {
        // Draw template
        const templateImg = new window.Image()
        templateImg.crossOrigin = "anonymous"
        templateImg.src = templateImages[selectedTemplate]

        templateImg.onload = () => {
          ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height)

          // Sort logos by z-index and render visible ones
          const sortedLogos = logos
            .map((logo, index) => ({ logo, index }))
            .filter(({ logo }) => logo.visible && logo.url)
            .sort((a, b) => a.logo.zIndex - b.logo.zIndex)

          let processedLogos = 0

          if (sortedLogos.length === 0) {
            finishDownload()
            return
          }

          sortedLogos.forEach(({ logo }) => {
            const img = new window.Image()
            img.crossOrigin = "anonymous"
            img.onload = () => {
              const x = (canvas.width * logo.position.x) / 100
              const y = (canvas.height * logo.position.y) / 100
              const size = (canvas.width * logo.size) / 100
              const width = logo.maintainAspectRatio ? size : size
              const height = logo.maintainAspectRatio ? size / logo.aspectRatio : size

              ctx.save()
              ctx.translate(x, y)
              ctx.rotate((logo.rotation * Math.PI) / 180)
              ctx.filter = getLogoFilterStyle(logo.filters)
              ctx.drawImage(img, -width / 2, -height / 2, width, height)
              ctx.restore()

              processedLogos++
              if (processedLogos === sortedLogos.length) {
                finishDownload()
              }
            }
            img.src = logo.url!
          })
        }

        templateImg.onerror = () => {
          toast({
            title: "Error",
            description: "Failed to load template image",
            variant: "destructive",
          })
          setIsDownloading(false)
        }
      }

      function finishDownload() {
        try {
          const dataUrl = canvas.toDataURL("image/png", 1.0)
          const link = document.createElement("a")
          link.download = `mockup-${selectedTemplate}-${Date.now()}.png`
          link.href = dataUrl
          link.click()

          toast({
            title: "Download Complete!",
            description: "Your high-quality mockup has been downloaded successfully.",
          })
        } catch (error) {
          console.error("Error creating download:", error)
          toast({
            title: "Error",
            description: "Failed to create download file",
            variant: "destructive",
          })
        } finally {
          setIsDownloading(false)
        }
      }
    } catch (error) {
      console.error("Error in download process:", error)
      toast({
        title: "Error",
        description: "There was an error generating your download",
        variant: "destructive",
      })
      setIsDownloading(false)
    }
  }

  // Handle canvas click for selection
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Check if click is on any logo
    let clickedLogoIndex = -1

    // Sort by z-index (highest first) to select topmost element
    const sortedLogos = logos.map((logo, index) => ({ logo, index })).sort((a, b) => b.logo.zIndex - a.logo.zIndex)

    for (const { logo, index } of sortedLogos) {
      if (!logo.visible) continue

      const logoX = (rect.width * logo.position.x) / 100
      const logoY = (rect.height * logo.position.y) / 100
      const logoWidth = (rect.width * logo.size) / 100
      const logoHeight = logoWidth / logo.aspectRatio

      if (
        x >= logoX - logoWidth / 2 &&
        x <= logoX + logoWidth / 2 &&
        y >= logoY - logoHeight / 2 &&
        y <= logoY + logoHeight / 2
      ) {
        clickedLogoIndex = index
        break
      }
    }

    // Handle multi-selection with Ctrl/Cmd key
    if (e.ctrlKey || e.metaKey) {
      if (clickedLogoIndex !== -1) {
        setSelectedLogos((prev) =>
          prev.includes(clickedLogoIndex) ? prev.filter((i) => i !== clickedLogoIndex) : [...prev, clickedLogoIndex],
        )
      }
    } else {
      if (clickedLogoIndex !== -1) {
        setSelectedLogoIndex(clickedLogoIndex)
        setSelectedLogos([clickedLogoIndex])
      } else {
        setSelectedLogoIndex(null)
        setSelectedLogos([])
      }
    }
  }

  // Toggle panels
  const toggleLeftPanel = () => setShowLeftPanel(!showLeftPanel)
  const toggleRightPanel = () => setShowRightPanel(!showRightPanel)

  // AI logo generation
  const generateLogoWithAI = () => {
    if (!aiPrompt.trim()) return

    setIsGenerating(true)

    setTimeout(() => {
      const newGeneratedLogos = [
        `/placeholder.svg?height=200&width=200&query=${encodeURIComponent(aiPrompt + " logo design 1")}`,
        `/placeholder.svg?height=200&width=200&query=${encodeURIComponent(aiPrompt + " logo design 2")}`,
        `/placeholder.svg?height=200&width=200&query=${encodeURIComponent(aiPrompt + " logo design 3")}`,
      ]

      setGeneratedLogos(newGeneratedLogos)
      setIsGenerating(false)

      toast({
        title: "AI Logos Generated!",
        description: "Click on any generated logo to add it to your mockup.",
      })
    }, 2000)
  }

  const addGeneratedLogo = (url: string) => {
    addLogo(null, url)
  }

  // Set up event listeners
  useEffect(() => {
    window.addEventListener("mouseup", handleDragEnd)
    window.addEventListener("touchend", handleDragEnd)

    return () => {
      window.removeEventListener("mouseup", handleDragEnd)
      window.removeEventListener("touchend", handleDragEnd)
    }
  }, [])

  // Get CSS filter string for a logo
  const getLogoFilterStyle = (filters: LogoData["filters"]) => {
    return `brightness(${filters.brightness}%) contrast(${filters.contrast}%) hue-rotate(${filters.hue}deg) saturate(${filters.saturation}%)`
  }

  // Render resize handles for selected logo
  const renderResizeHandles = (logo: LogoData, index: number) => {
    if (selectedLogoIndex !== index || logo.locked) return null

    const handles = ["nw", "ne", "sw", "se", "n", "s", "e", "w"]

    return handles.map((handle) => (
      <div
        key={handle}
        className={`absolute w-2 h-2 bg-primary border border-white cursor-${handle}-resize`}
        style={{
          top: handle.includes("n") ? "-4px" : handle.includes("s") ? "calc(100% - 4px)" : "calc(50% - 4px)",
          left: handle.includes("w") ? "-4px" : handle.includes("e") ? "calc(100% - 4px)" : "calc(50% - 4px)",
        }}
        onMouseDown={(e) => handleResizeStart(e, index, handle)}
      />
    ))
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
            <Button variant="outline" size="icon" onClick={toggleLeftPanel}>
              <PanelLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Mockup Editor</h1>
              <p className="text-sm text-gray-500">Create professional packaging mockups</p>
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
                  <DialogDescription>
                    Change the canvas size and choose how to handle existing elements.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Canvas Preset</Label>
                    <Select value={selectedPreset} onValueChange={setSelectedPreset}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CANVAS_PRESETS).map(([key, preset]) => (
                          <SelectItem key={key} value={key}>
                            {preset.name} ({preset.width}x{preset.height})
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

            <Link href="/logo-designer">
              <Button variant="outline" className="gap-2">
                <Palette className="h-4 w-4" /> Logo Designer
              </Button>
            </Link>
            <Button onClick={handleDownload} className="gap-2" disabled={isDownloading || logos.length === 0}>
              {isDownloading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Preparing...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" /> Download
                </>
              )}
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
                      handleDownload()
                    }
                  }, 300)
                }}
            />
            <Button variant="outline" size="icon" onClick={toggleRightPanel}>
              <PanelRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container py-6 mx-auto">
        <div
          className="grid gap-6"
          style={{
            gridTemplateColumns: `${showLeftPanel ? "320px" : "0px"} 1fr ${showRightPanel ? "320px" : "0px"}`,
          }}
        >
          {/* Left Panel - Templates & AI */}
          {showLeftPanel && (
            <div className="space-y-6 transition-all duration-300">
              {/* Template Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5" /> Templates
                  </CardTitle>
                  <CardDescription>Choose a template to start designing your mockup</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(templateNames).map(([id, name]) => (
                      <div
                        key={id}
                        className={`border rounded-lg p-2 cursor-pointer transition-all hover:border-primary ${selectedTemplate === id ? "border-primary bg-primary/5" : ""}`}
                        onClick={() => setSelectedTemplate(id)}
                      >
                        <div className="relative w-full aspect-square mb-1">
                          <Image
                            src={templateImages[id] || "/placeholder.svg"}
                            alt={name}
                            fill
                            className="object-contain p-1"
                          />
                        </div>
                        <p className="text-xs text-center font-medium">{name}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Wax Effect */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Grid3X3 className="h-5 w-5" /> Wax Effect (Watermark)
                  </CardTitle>
                  <CardDescription>Add a subtle watermark pattern using your logo</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="wax-effect"
                      checked={waxEffect.enabled}
                      onCheckedChange={(enabled) => setWaxEffect((prev) => ({ ...prev, enabled }))}
                    />
                    <Label htmlFor="wax-effect">Enable Watermark Pattern</Label>
                  </div>

                  {waxEffect.enabled && (
                    <>
                      <div className="space-y-2">
                        <Label>Opacity: {Math.round(waxEffect.opacity * 100)}%</Label>
                        <Slider
                          value={[waxEffect.opacity]}
                          min={0.02}
                          max={0.3}
                          step={0.01}
                          onValueChange={(value) => setWaxEffect((prev) => ({ ...prev, opacity: value[0] }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Pattern Size: {waxEffect.size}px</Label>
                        <Slider
                          value={[waxEffect.size]}
                          min={20}
                          max={150}
                          step={5}
                          onValueChange={(value) => setWaxEffect((prev) => ({ ...prev, size: value[0] }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Rotation: {waxEffect.rotation}°</Label>
                        <Slider
                          value={[waxEffect.rotation]}
                          min={0}
                          max={360}
                          step={15}
                          onValueChange={(value) => setWaxEffect((prev) => ({ ...prev, rotation: value[0] }))}
                        />
                      </div>

                      <div className="text-xs text-gray-500 p-2 bg-blue-50 rounded">
                        💡 <strong>Tip:</strong> Wax effect creates a subtle watermark pattern using your first logo.
                        Perfect for branding and copyright protection!
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* AI Logo Generator */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" /> AI Logo Generator
                  </CardTitle>
                  <CardDescription>Generate logo ideas using AI</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ai-prompt">Describe your logo</Label>
                    <Textarea
                      id="ai-prompt"
                      placeholder="E.g., A minimalist coffee bean logo with blue and brown colors"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                    />
                  </div>

                  <Button
                    onClick={generateLogoWithAI}
                    className="w-full gap-2"
                    disabled={!aiPrompt.trim() || isGenerating}
                  >
                    <Sparkles className="h-4 w-4" />
                    {isGenerating ? "Generating..." : "Generate Logo Ideas"}
                  </Button>

                  <div className="text-xs text-gray-500">
                    Example prompts:
                    <ul className="mt-1 space-y-1">
                      <li
                        className="cursor-pointer hover:text-primary p-1 rounded hover:bg-gray-100"
                        onClick={() => setAiPrompt("A modern tech company logo with gradient blue colors")}
                      >
                        • Modern tech company logo
                      </li>
                      <li
                        className="cursor-pointer hover:text-primary p-1 rounded hover:bg-gray-100"
                        onClick={() => setAiPrompt("A vintage bakery logo with wheat and rolling pin")}
                      >
                        • Vintage bakery logo
                      </li>
                      <li
                        className="cursor-pointer hover:text-primary p-1 rounded hover:bg-gray-100"
                        onClick={() => setAiPrompt("A fitness gym logo with a dumbbell silhouette")}
                      >
                        • Fitness gym logo
                      </li>
                    </ul>
                  </div>

                  {generatedLogos.length > 0 && (
                    <div className="space-y-2">
                      <Label>Generated Logos</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {generatedLogos.map((url, index) => (
                          <div
                            key={index}
                            className="border rounded-lg p-1 cursor-pointer hover:border-primary transition-all"
                            onClick={() => addGeneratedLogo(url)}
                          >
                            <div className="relative w-full aspect-square">
                              <Image
                                src={url || "/placeholder.svg"}
                                alt={`Generated logo ${index + 1}`}
                                fill
                                className="object-contain"
                              />
                            </div>
                            <p className="text-xs text-center mt-1">Add</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Editor Preview */}
          <div className="relative bg-gray-50 rounded-lg overflow-hidden">
            {/* Canvas Controls */}
            <div className="absolute top-4 left-4 z-20 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGrid(!showGrid)}
                className={showGrid ? "bg-primary text-primary-foreground" : ""}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSnapToGrid(!snapToGrid)}
                className={snapToGrid ? "bg-primary text-primary-foreground" : ""}
              >
                Snap
              </Button>
            </div>

            {/* Alignment Tools */}
            {selectedLogos.length > 1 && (
              <div className="absolute top-4 right-4 z-20 flex gap-1 bg-white rounded-lg p-1 shadow-lg">
                <Button variant="ghost" size="sm" onClick={() => alignElements("left")}>
                  <AlignLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => alignElements("center")}>
                  <AlignCenter className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => alignElements("right")}>
                  <AlignRight className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => alignElements("top")}>
                  <AlignJustify className="h-4 w-4 rotate-90" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => alignElements("middle")}>
                  <AlignJustify className="h-4 w-4 rotate-90" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => alignElements("bottom")}>
                  <AlignJustify className="h-4 w-4 rotate-90" />
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <Button variant="ghost" size="sm" onClick={() => alignElements("distribute-h")}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => alignElements("distribute-v")}>
                  <MoreHorizontal className="h-4 w-4 rotate-90" />
                </Button>
              </div>
            )}

            <div
              ref={containerRef}
              className="relative w-full aspect-square bg-white rounded-lg shadow-sm overflow-hidden"
              onMouseMove={handleDragMove}
              onTouchMove={handleDragMove}
              onClick={handleCanvasClick}
              style={{
                backgroundImage: showGrid
                  ? "linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)"
                  : "none",
                backgroundSize: showGrid ? "5% 5%" : "auto",
              }}
            >
              <Image
                src={templateImages[selectedTemplate] || "/placeholder.svg"}
                alt={templateNames[selectedTemplate] || "Template"}
                fill
                className="object-contain"
              />

              {/* Wax Effect Overlay - Replace existing implementation */}
              {waxEffect.enabled && logos.length > 0 && logos[0].url && (
                <div
                  className="absolute inset-0 pointer-events-none z-0"
                  style={{
                    opacity: waxEffect.opacity,
                    backgroundImage: `url(${logos[0].url})`,
                    backgroundSize: `${waxEffect.size}px ${waxEffect.size}px`,
                    backgroundRepeat: "repeat",
                    backgroundPosition: "center",
                    transform: `rotate(${waxEffect.rotation}deg)`,
                    transformOrigin: "center",
                    filter: "grayscale(100%) brightness(1.5)",
                    mixBlendMode: "multiply",
                  }}
                />
              )}

              {logos
                .filter((logo) => logo.visible)
                .sort((a, b) => a.zIndex - b.zIndex)
                .map((logo, index) => {
                  const originalIndex = logos.findIndex((l) => l.id === logo.id)
                  return (
                    logo.url && (
                      <div
                        key={logo.id}
                        className={`absolute cursor-move logo-image transition-all ${
                          selectedLogoIndex === originalIndex
                            ? "ring-2 ring-primary ring-offset-2 z-10"
                            : selectedLogos.includes(originalIndex)
                              ? "ring-2 ring-blue-400 ring-offset-2 z-10"
                              : "z-5"
                        } ${logo.locked ? "cursor-not-allowed" : ""}`}
                        style={{
                          left: `${logo.position.x}%`,
                          top: `${logo.position.y}%`,
                          transform: `translate(-50%, -50%) rotate(${logo.rotation}deg)`,
                          width: `${logo.size}%`,
                          height: logo.maintainAspectRatio ? `${logo.size / logo.aspectRatio}%` : `${logo.size}%`,
                          touchAction: "none",
                          zIndex: logo.zIndex,
                          opacity: logo.locked ? 0.7 : 1,
                        }}
                        onMouseDown={(e) => handleDragStart(e, originalIndex)}
                        onTouchStart={(e) => handleDragStart(e, originalIndex)}
                      >
                        <Image
                          src={logo.url || "/placeholder.svg"}
                          alt={`Logo ${originalIndex + 1}`}
                          fill
                          className="object-contain"
                          style={{
                            pointerEvents: "none",
                            filter: getLogoFilterStyle(logo.filters),
                          }}
                        />

                        {/* Resize Handles */}
                        {renderResizeHandles(logo, originalIndex)}

                        {/* Lock indicator */}
                        {logo.locked && (
                          <div className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl">
                            <Lock className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                    )
                  )
                })}

              {/* Welcome Message */}
              {showWelcome && logos.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Card className="max-w-md mx-4">
                    <CardContent className="p-6 text-center">
                      <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-semibold mb-2">Upload Your Logo</h3>
                      <p className="text-gray-600 mb-4">Get started by uploading your logo or generating one with AI</p>
                      <div className="flex flex-col gap-2">
                        <input
                          type="file"
                          id="welcome-upload"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <label htmlFor="welcome-upload">
                          <Button className="w-full gap-2" asChild>
                            <span>
                              <Upload className="h-4 w-4" /> Upload Logo
                            </span>
                          </Button>
                        </label>
                        <Link href="/logo-designer">
                          <Button variant="outline" className="w-full gap-2">
                            <Palette className="h-4 w-4" /> Design Logo
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            {/* Help Text */}
            {logos.length > 0 && (
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 text-sm text-gray-600 flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  <span>
                    Drag to move • Drag corners to resize • Ctrl+Click for multi-select • Right-click for options
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Editor Controls */}
          {showRightPanel && (
            <div className="space-y-6 transition-all duration-300">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="logo">Logos</TabsTrigger>
                  <TabsTrigger value="layers">Layers</TabsTrigger>
                  <TabsTrigger value="colors">Colors</TabsTrigger>
                  <TabsTrigger value="export">Export</TabsTrigger>
                </TabsList>

                <TabsContent value="logo" className="space-y-6 pt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5" /> Manage Logos
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {logos.map((logo, index) => (
                          <div
                            key={logo.id}
                            className={`border rounded-lg p-1 cursor-pointer transition-all ${
                              selectedLogoIndex === index
                                ? "border-primary bg-primary/5"
                                : selectedLogos.includes(index)
                                  ? "border-blue-400 bg-blue-50"
                                  : "hover:border-gray-300"
                            } ${!logo.visible ? "opacity-50" : ""}`}
                            onClick={() => setSelectedLogoIndex(index)}
                          >
                            <div className="relative w-12 h-12">
                              {logo.url && (
                                <Image
                                  src={logo.url || "/placeholder.svg"}
                                  alt={`Logo ${index + 1}`}
                                  fill
                                  className="object-contain"
                                  style={{ filter: getLogoFilterStyle(logo.filters) }}
                                />
                              )}
                              {logo.locked && <Lock className="absolute top-0 right-0 h-3 w-3 text-red-500" />}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-col gap-2">
                        <input
                          type="file"
                          id="logo-upload-side"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <label htmlFor="logo-upload-side">
                          <Button variant="outline" className="w-full gap-2" asChild>
                            <span>
                              <Upload className="h-4 w-4" /> Upload New Logo
                            </span>
                          </Button>
                        </label>

                        {selectedLogo && (
                          <>
                            <Button variant="outline" onClick={resetLogo} className="gap-2">
                              <RotateCcw className="h-4 w-4" /> Reset Position
                            </Button>
                            <Button
                              variant="outline"
                              onClick={removeLogo}
                              className="gap-2 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" /> Remove Logo
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {selectedLogo && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Logo Settings</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="relative w-full aspect-video border rounded-lg mb-2 overflow-hidden">
                          {selectedLogo.url && (
                            <Image
                              src={selectedLogo.url || "/placeholder.svg"}
                              alt="Selected logo"
                              fill
                              className="object-contain"
                              style={{ filter: getLogoFilterStyle(selectedLogo.filters) }}
                            />
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Size</span>
                            <div className="flex items-center gap-2">
                              <ZoomIn className="h-4 w-4 text-gray-500" />
                              <span className="text-sm">{selectedLogo.size}%</span>
                            </div>
                          </div>
                          <Slider
                            value={[selectedLogo.size]}
                            min={5}
                            max={100}
                            step={1}
                            onValueChange={(value) => updateLogoSize(value[0])}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Rotation</span>
                            <span className="text-sm">{selectedLogo.rotation}°</span>
                          </div>
                          <Slider
                            value={[selectedLogo.rotation]}
                            min={0}
                            max={360}
                            step={1}
                            onValueChange={(value) => updateLogoRotation(value[0])}
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="maintain-aspect"
                            checked={selectedLogo.maintainAspectRatio}
                            onCheckedChange={toggleMaintainAspectRatio}
                          />
                          <Label htmlFor="maintain-aspect">Maintain aspect ratio</Label>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Move className="h-4 w-4" />
                          <span>Drag logo on canvas to position</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label htmlFor="position-x">X Position</Label>
                            <Input
                              id="position-x"
                              type="number"
                              value={Math.round(selectedLogo.position.x)}
                              onChange={(e) => updateLogoPosition(Number(e.target.value), selectedLogo.position.y)}
                              min={0}
                              max={100}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="position-y">Y Position</Label>
                            <Input
                              id="position-y"
                              type="number"
                              value={Math.round(selectedLogo.position.y)}
                              onChange={(e) => updateLogoPosition(selectedLogo.position.x, Number(e.target.value))}
                              min={0}
                              max={100}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="layers" className="space-y-6 pt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Layers className="h-5 w-5" /> Layer Management
                      </CardTitle>
                      <CardDescription>Manage the stacking order and properties of your elements</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {logos
                        .map((logo, index) => ({ logo, index }))
                        .sort((a, b) => b.logo.zIndex - a.logo.zIndex)
                        .map(({ logo, index }) => (
                          <div
                            key={logo.id}
                            className={`flex items-center gap-2 p-2 border rounded-lg ${
                              selectedLogoIndex === index ? "border-primary bg-primary/5" : ""
                            }`}
                            onClick={() => setSelectedLogoIndex(index)}
                          >
                            <div className="relative w-8 h-8 flex-shrink-0">
                              {logo.url && (
                                <Image
                                  src={logo.url || "/placeholder.svg"}
                                  alt={`Layer ${index + 1}`}
                                  fill
                                  className="object-contain rounded"
                                />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">Logo {index + 1}</p>
                              <p className="text-xs text-gray-500">Z-Index: {logo.zIndex}</p>
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
                                {logo.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleLayerLock(index)
                                }}
                              >
                                {logo.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
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
                                  <DropdownMenuItem onClick={() => bringToFront(index)}>
                                    Bring to Front
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => sendToBack(index)}>Send to Back</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ))}

                      {logos.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Layers className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No layers yet. Add some logos to get started!</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="colors" className="space-y-6 pt-4">
                  {selectedLogo ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Palette className="h-5 w-5" /> Logo Color Adjustments
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="relative w-full aspect-video border rounded-lg mb-2 overflow-hidden">
                          {selectedLogo.url && (
                            <Image
                              src={selectedLogo.url || "/placeholder.svg"}
                              alt="Selected logo"
                              fill
                              className="object-contain"
                              style={{ filter: getLogoFilterStyle(selectedLogo.filters) }}
                            />
                          )}
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm flex items-center gap-1">
                                <SunMedium className="h-4 w-4" /> Brightness
                              </span>
                              <span className="text-sm">{selectedLogo.filters.brightness}%</span>
                            </div>
                            <Slider
                              value={[selectedLogo.filters.brightness]}
                              min={0}
                              max={200}
                              step={1}
                              onValueChange={(value) => updateLogoFilter("brightness", value[0])}
                            />
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm flex items-center gap-1">
                                <Contrast className="h-4 w-4" /> Contrast
                              </span>
                              <span className="text-sm">{selectedLogo.filters.contrast}%</span>
                            </div>
                            <Slider
                              value={[selectedLogo.filters.contrast]}
                              min={0}
                              max={200}
                              step={1}
                              onValueChange={(value) => updateLogoFilter("contrast", value[0])}
                            />
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Hue Rotation</span>
                              <span className="text-sm">{selectedLogo.filters.hue}°</span>
                            </div>
                            <Slider
                              value={[selectedLogo.filters.hue]}
                              min={0}
                              max={360}
                              step={1}
                              onValueChange={(value) => updateLogoFilter("hue", value[0])}
                            />
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Saturation</span>
                              <span className="text-sm">{selectedLogo.filters.saturation}%</span>
                            </div>
                            <Slider
                              value={[selectedLogo.filters.saturation]}
                              min={0}
                              max={200}
                              step={1}
                              onValueChange={(value) => updateLogoFilter("saturation", value[0])}
                            />
                          </div>

                          <Button
                            variant="outline"
                            onClick={() => {
                              if (selectedLogoIndex === null) return
                              const newLogos = [...logos]
                              newLogos[selectedLogoIndex] = {
                                ...newLogos[selectedLogoIndex],
                                filters: {
                                  brightness: 100,
                                  contrast: 100,
                                  hue: 0,
                                  saturation: 100,
                                },
                              }
                              setLogos(newLogos)
                            }}
                            className="w-full"
                          >
                            Reset Color Adjustments
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="p-6 text-center">
                        <Palette className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-500">Select a logo to adjust its colors</p>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle>Color Presets</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          className="h-auto py-3"
                          onClick={() => {
                            if (selectedLogoIndex === null) return
                            const newLogos = [...logos]
                            newLogos[selectedLogoIndex] = {
                              ...newLogos[selectedLogoIndex],
                              filters: {
                                brightness: 100,
                                contrast: 120,
                                hue: 0,
                                saturation: 110,
                              },
                            }
                            setLogos(newLogos)
                          }}
                          disabled={!selectedLogo}
                        >
                          <div className="flex flex-col items-center">
                            <span className="font-medium">Vibrant</span>
                            <span className="text-xs text-gray-500">High contrast</span>
                          </div>
                        </Button>

                        <Button
                          variant="outline"
                          className="h-auto py-3"
                          onClick={() => {
                            if (selectedLogoIndex === null) return
                            const newLogos = [...logos]
                            newLogos[selectedLogoIndex] = {
                              ...newLogos[selectedLogoIndex],
                              filters: {
                                brightness: 110,
                                contrast: 90,
                                hue: 0,
                                saturation: 80,
                              },
                            }
                            setLogos(newLogos)
                          }}
                          disabled={!selectedLogo}
                        >
                          <div className="flex flex-col items-center">
                            <span className="font-medium">Soft</span>
                            <span className="text-xs text-gray-500">Muted colors</span>
                          </div>
                        </Button>

                        <Button
                          variant="outline"
                          className="h-auto py-3"
                          onClick={() => {
                            if (selectedLogoIndex === null) return
                            const newLogos = [...logos]
                            newLogos[selectedLogoIndex] = {
                              ...newLogos[selectedLogoIndex],
                              filters: {
                                brightness: 100,
                                contrast: 100,
                                hue: 180,
                                saturation: 100,
                              },
                            }
                            setLogos(newLogos)
                          }}
                          disabled={!selectedLogo}
                        >
                          <div className="flex flex-col items-center">
                            <span className="font-medium">Invert Hue</span>
                            <span className="text-xs text-gray-500">Opposite colors</span>
                          </div>
                        </Button>

                        <Button
                          variant="outline"
                          className="h-auto py-3"
                          onClick={() => {
                            if (selectedLogoIndex === null) return
                            const newLogos = [...logos]
                            newLogos[selectedLogoIndex] = {
                              ...newLogos[selectedLogoIndex],
                              filters: {
                                brightness: 120,
                                contrast: 110,
                                hue: 0,
                                saturation: 0,
                              },
                            }
                            setLogos(newLogos)
                          }}
                          disabled={!selectedLogo}
                        >
                          <div className="flex flex-col items-center">
                            <span className="font-medium">Grayscale</span>
                            <span className="text-xs text-gray-500">Black & white</span>
                          </div>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="export" className="space-y-6 pt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Canvas Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Canvas Size:</span>
                        <span className="text-sm font-medium">
                          {canvasSize.width} × {canvasSize.height}px
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Elements:</span>
                        <span className="text-sm font-medium">{logos.length} logos</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Visible Elements:</span>
                        <span className="text-sm font-medium">{logos.filter((l) => l.visible).length}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Export Settings</CardTitle>
                      <CardDescription>Download your mockup in high quality</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="export-format">Export Format</Label>
                        <Select defaultValue="png">
                          <SelectTrigger id="export-format">
                            <SelectValue placeholder="Select format" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="png">PNG Image</SelectItem>
                            <SelectItem value="jpg">JPG Image</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="export-quality">Image Quality</Label>
                        <Select defaultValue="high">
                          <SelectTrigger id="export-quality">
                            <SelectValue placeholder="Select quality" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low (72 DPI)</SelectItem>
                            <SelectItem value="medium">Medium (150 DPI)</SelectItem>
                            <SelectItem value="high">High (300 DPI)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button onClick={handleDownload} className="w-full gap-2" disabled={isDownloading}>
                        {isDownloading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" /> Preparing...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4" /> Download Mockup
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
