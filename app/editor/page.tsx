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
  Clock,
  Save,
  Trash,
  Calendar,
  FileText,
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
import { useAuth } from "@/lib/auth-context"
import LoginModal from "@/components/login-modal"

// Define logo data structure with enhanced properties
interface LogoData {
  id: string
  file: File | null
  url: string | null
  originalUrl?: string // Store the original URL for AI-generated logos
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

// Design data structure for saving/loading
interface DesignData {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  thumbnail?: string
  data: {
    selectedTemplate: string
    logos: LogoData[]
    canvasSize: { width: number; height: number }
    waxEffect: any
    templateColor: string
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
    size: 50,
  })
  const containerRef = useRef<HTMLDivElement>(null)
  const isMobile = useMobile()
  const { user, loading, getAuthToken } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)

  // Design History & Recent Projects
  const [designHistory, setDesignHistory] = useState<DesignData[]>([])
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [currentDesignName, setCurrentDesignName] = useState("")
  const [showSaveDialog, setShowSaveDialog] = useState(false)

  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [currentDesignId, setCurrentDesignId] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Add this near the top of the component with other refs
  const userRef = useRef(user)

  // Add this useEffect to keep the ref updated
  useEffect(() => {
    userRef.current = user
  }, [user])

  // Debug logging for auth state changes
  useEffect(() => {
    console.log("🎨 Editor - Auth state changed:", { user, loading })
  }, [user, loading])

  // Check if user should see auth modal (but don't change layout)
  useEffect(() => {
    console.log("🎨 Editor - Checking if should show modal:", { loading, user })
    if (!loading) {
      if (!user) {
        console.log("🎨 Editor - No user, showing modal")
        setShowAuthModal(true)
      } else {
        console.log("🎨 Editor - User found, hiding modal")
        setShowAuthModal(false)
      }
    }
  }, [user, loading])

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
    console.log("🎨 Creating new logo:", { file: file?.name, url, newZIndex })

    return {
      id: Date.now().toString(),
      file,
      url,
      originalUrl: url, // Store the original URL
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
    console.log("🎨 Adding logo:", { file: file?.name, url })
    const newLogo = createNewLogo(file, url)
    setLogos((prevLogos) => {
      const updatedLogos = [...prevLogos, newLogo]
      console.log("🎨 Updated logos array:", updatedLogos)
      return updatedLogos
    })
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

  // Update logo URL when file changes - FIXED VERSION
  useEffect(() => {
    console.log("🎨 Logo URL effect triggered, logos count:", logos.length)

    logos.forEach((logo, index) => {
      if (logo.file && !logo.url) {
        console.log(`🎨 Processing logo ${index} with file:`, logo.file.name)

        const url = URL.createObjectURL(logo.file)
        console.log(`🎨 Created blob URL for logo ${index}:`, url)

        setLogos((prevLogos) => {
          const updatedLogos = [...prevLogos]
          updatedLogos[index] = { ...logo, url }
          console.log(`🎨 Updated logo ${index} with URL:`, updatedLogos[index])
          return updatedLogos
        })

        // Calculate aspect ratio for uploaded images
        const img = new window.Image()
        img.onload = () => {
          const aspectRatio = img.width / img.height
          console.log(`🎨 Logo ${index} aspect ratio calculated:`, aspectRatio)

          setLogos((prevLogos) => {
            const newLogos = [...prevLogos]
            if (newLogos[index]) {
              newLogos[index] = { ...newLogos[index], aspectRatio }
              console.log(`🎨 Updated logo ${index} with aspect ratio:`, newLogos[index])
            }
            return newLogos
          })
        }
        img.onerror = (error) => {
          console.error(`🎨 Error loading image for logo ${index}:`, error)
        }
        img.src = url
      }
    })

    // Cleanup function - only cleanup blob URLs that are no longer in use
    return () => {
      // This cleanup will run when logos array changes or component unmounts
      // We should be careful not to revoke URLs that are still being used
    }
  }, [logos.length]) // Only depend on logos.length to avoid infinite loops

  // Enhanced file upload with backend storage - FIXED VERSION
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("🎨 File upload triggered")

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      console.log("🎨 File selected:", { name: file.name, size: file.size, type: file.type })

      // Validate file type
      if (!file.type.startsWith("image/")) {
        console.error("🎨 Invalid file type:", file.type)
        toast({
          title: "Invalid File Type",
          description: "Please upload a PNG, JPG, or other image file.",
          variant: "destructive",
        })
        return
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        console.error("🎨 File too large:", file.size)
        toast({
          title: "File Too Large",
          description: "Please upload an image smaller than 10MB.",
          variant: "destructive",
        })
        return
      }

      if (!user) {
        console.log("🎨 No user authenticated")
        toast({
          title: "Authentication Required",
          description: "Please log in to upload images.",
          variant: "destructive",
        })
        setShowAuthModal(true)
        return
      }

      setIsUploading(true)

      try {
        // Create form data
        const formData = new FormData()
        formData.append("image", file)
        console.log("🎨 FormData created with image")

        // Upload to backend directly
        const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://mockupgenerator-be.vercel.app"
        console.log("🎨 Using backend URL:", BACKEND_URL)
        const uploadUrl = `${BACKEND_URL}/api/uploads/upload`

        console.log("🎨 Uploading to:", uploadUrl)

        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: formData,
        })

        console.log("🎨 Upload response status:", response.status)

        if (!response.ok) {
          const errorData = await response.json()
          console.error("🎨 Upload failed:", errorData)
          throw new Error(errorData.error || "Upload failed")
        }

        const uploadData = await response.json()
        console.log("🎨 Upload successful:", uploadData)

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
          console.log("🎨 Transformed localhost URL to:", imageUrl)
        }

        console.log("🎨 Final image URL:", imageUrl)

        if (!imageUrl) {
          console.error("🎨 No URL found in upload response:", uploadData)
          throw new Error("No image URL returned from server")
        }

        // Add logo with permanent URL
        addLogo(null, imageUrl)

        toast({
          title: "Upload Successful!",
          description: "Your image has been uploaded and added to the canvas.",
        })
      } catch (error) {
        console.error("🎨 Upload error:", error)

        // Fallback: create blob URL for immediate use
        console.log("🎨 Using fallback blob URL")
        addLogo(file, null)

        toast({
          title: "Upload Failed - Using Local Copy",
          description: "Image added locally. Save your design to try uploading again.",
          variant: "default",
        })
      } finally {
        setIsUploading(false)
      }

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
  const generateLogoWithAI = async () => {
    if (!aiPrompt.trim()) return

    setIsGenerating(true)

    try {
      // Direct Unsplash API call
      const response = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(aiPrompt + " logo design")}&per_page=9&orientation=squarish&client_id=${process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY}`,
          {
            headers: {
              "Accept-Version": "v1",
            },
          },
      )

      if (!response.ok) {
        throw new Error(`Unsplash API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.results && data.results.length > 0) {
        const newGeneratedLogos = data.results.map((photo: any) => photo.urls.regular)
        setGeneratedLogos(newGeneratedLogos)
      } else {
        // Fallback to placeholder images
        const fallbackLogos = [
          `/placeholder.svg?height=200&width=200&query=${encodeURIComponent(aiPrompt + " logo design 1")}`,
          `/placeholder.svg?height=200&width=200&query=${encodeURIComponent(aiPrompt + " logo design 2")}`,
          `/placeholder.svg?height=200&width=200&query=${encodeURIComponent(aiPrompt + " logo design 3")}`,
        ]
        setGeneratedLogos(fallbackLogos)
      }

      setIsGenerating(false)

      toast({
        title: "AI Logos Generated!",
        description: "Click on any generated logo to add it to your mockup.",
      })
    } catch (error) {
      console.error("Error generating logos:", error)
      setIsGenerating(false)

      // Fallback to placeholder images if API fails
      const fallbackLogos = [
        `/placeholder.svg?height=200&width=200&query=${encodeURIComponent(aiPrompt + " logo design 1")}`,
        `/placeholder.svg?height=200&width=200&query=${encodeURIComponent(aiPrompt + " logo design 2")}`,
        `/placeholder.svg?height=200&width=200&query=${encodeURIComponent(aiPrompt + " logo design 3")}`,
      ]

      setGeneratedLogos(fallbackLogos)

      toast({
        title: "Using Placeholder Images",
        description: "Unable to fetch from Unsplash API. Using placeholder images instead.",
        variant: "destructive",
      })
    }
  }

  const addGeneratedLogo = (url: string) => {
    console.log("🎨 Adding generated logo:", url)
    const newLogo = createNewLogo(null, url)
    newLogo.originalUrl = url // Ensure we store the original URL
    setLogos([...logos, newLogo])
    setSelectedLogoIndex(logos.length)
    setShowWelcome(false)
    toast({
      title: "Logo Added!",
      description: "Your AI-generated logo has been added to the canvas.",
    })
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

  // Load design history on component mount
  useEffect(() => {
    if (user) {
      loadDesignHistory()
    }
  }, [user])

  // Auto-save current design state every 30 seconds
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (logos.length > 0 && user && currentDesignId) {
        // Only auto-save if we have an existing design
        saveCurrentDesign(currentDesignName || "Auto-save")
      }
    }, 30000) // 30 seconds

    return () => clearInterval(autoSaveInterval)
  }, [logos, selectedTemplate, canvasSize, waxEffect, user, currentDesignId, currentDesignName])

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

  const handleAuthModalClose = (open: boolean) => {
    // Only redirect if modal is being closed and we're sure it wasn't a successful login
    if (!open && !loading) {
      // Use setTimeout to allow React state updates to complete
      setTimeout(() => {
        // Get the current user state from the ref (not closure)
        const currentUser = userRef.current
        console.log("📝 Editor - Delayed check for redirect:", { currentUser })

        if (!currentUser) {
          console.log("📝 Editor - Redirecting to home")
          window.location.href = "/"
        } else {
          console.log("📝 Editor - User found, staying on page")
        }
      }, 200)
    }
    setShowLoginModal(open)
  }

  const handleAuthSuccess = () => {
    console.log("📝 Editor - Auth success handler")
    // User successfully logged in - close modal and stay on page
    setShowLoginModal(false)
    toast({
      title: "Welcome!",
      description: "You can now download your mockup design.",
    })
    // Automatically trigger download after successful login
    setTimeout(() => {
      if (userRef.current) {
        handleDownload()
      }
    }, 300)
  }

  // Design History Functions - FIXED VERSION
  const saveCurrentDesign = async (name?: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to save your design.",
        variant: "destructive",
      })
      return
    }

    const designName = name || currentDesignName || `Design ${Date.now()}`
    setIsSaving(true)
    setSaveError(null)

    try {
      // Prepare logos data for saving - only save permanent URLs
      const logosToSave = logos
          .filter((logo) => logo.url && !logo.url.startsWith("blob:")) // Filter out blob URLs
          .map((logo) => ({
            ...logo,
            file: null, // Don't save file objects
            url: logo.originalUrl || logo.url, // Use original URL
            originalUrl: logo.originalUrl || logo.url,
          }))

      console.log("🎨 Saving design with logos:", logosToSave)

      const designData = {
        name: designName,
        data: {
          selectedTemplate,
          logos: logosToSave,
          canvasSize,
          waxEffect,
          templateColor,
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

        console.log("🎨 Saving to:", endpoint)

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
        console.log("🎨 Design saved successfully:", savedDesign)

        // Update current design ID if this was a new design
        if (!currentDesignId) {
          setCurrentDesignId(savedDesign.id)
        }

        // Reload design history
        await loadDesignHistory()

        toast({
          title: "Design Saved!",
          description: `"${designName}" has been saved successfully.`,
        })
      } catch (apiError) {
        console.error("🎨 API save failed, using local storage:", apiError)

        // Fallback to local storage
        const fallbackDesign: DesignData = {
          id: currentDesignId || Date.now().toString(),
          name: designName,
          createdAt: currentDesignId
              ? designHistory.find((d) => d.id === currentDesignId)?.createdAt || new Date().toISOString()
              : new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          data: {
            selectedTemplate,
            logos: logosToSave,
            canvasSize,
            waxEffect,
            templateColor,
          },
        }

        const existingDesigns = JSON.parse(localStorage.getItem("mockup-designs") || "[]")
        const updatedDesigns = [
          fallbackDesign,
          ...existingDesigns.filter((d: DesignData) => d.id !== fallbackDesign.id).slice(0, 9),
        ]
        localStorage.setItem("mockup-designs", JSON.stringify(updatedDesigns))
        setDesignHistory(updatedDesigns)

        if (!currentDesignId) {
          setCurrentDesignId(fallbackDesign.id)
        }

        toast({
          title: "Design Saved Locally!",
          description: `"${designName}" has been saved to local storage.`,
          variant: "default",
        })
      }

      setCurrentDesignName(designName)
      setShowSaveDialog(false)
    } catch (error) {
      console.error("🎨 Save failed:", error)
      setSaveError("Failed to save design")
      toast({
        title: "Save Failed",
        description: "There was an error saving your design.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const loadDesign = async (design: DesignData) => {
    console.log("🎨 Loading design:", design)
    setIsLoading(true)

    try {
      // Restore the design state
      setSelectedTemplate(design.data.selectedTemplate)
      setCanvasSize(design.data.canvasSize)
      setWaxEffect(design.data.waxEffect)
      setTemplateColor(design.data.templateColor)
      setCurrentDesignName(design.name)
      setCurrentDesignId(design.id)

      // Restore logos with proper URL handling - only restore logos with valid URLs
      const restoredLogos = (design.data.logos || [])
          .filter((logo) => logo.url && !logo.url.startsWith("blob:")) // Only restore non-blob URLs
          .map((logo) => ({
            ...logo,
            url: logo.originalUrl || logo.url, // Use original URL for AI-generated logos
            file: null, // Files can't be restored
          }))

      console.log("🎨 Restored logos:", restoredLogos)
      setLogos(restoredLogos)
      setShowHistoryModal(false)
      setShowWelcome(restoredLogos.length === 0)

      toast({
        title: "Design Loaded!",
        description: `"${design.name}" has been loaded successfully.`,
      })

      if (restoredLogos.length < (design.data.logos?.length || 0)) {
        toast({
          title: "Some Images Skipped",
          description: "Uploaded files couldn't be restored. Only AI-generated images were loaded.",
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
      const existingDesigns = JSON.parse(localStorage.getItem("mockup-designs") || "[]")
      const updatedDesigns = existingDesigns.filter((d: DesignData) => d.id !== designId)
      localStorage.setItem("mockup-designs", JSON.stringify(updatedDesigns))
      setDesignHistory(updatedDesigns)

      toast({
        title: "Design Deleted Locally",
        description: "The design has been removed from local storage.",
      })
    }
  }

  // Generate thumbnail for design preview
  const generateDesignThumbnail = async (design: DesignData): Promise<string> => {
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

      // Load and draw template
      const templateImg = new window.Image()
      templateImg.crossOrigin = "anonymous"
      templateImg.onload = () => {
        // Draw template
        ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height)

        // Draw logos
        const visibleLogos = (design.data.logos || [])
            .filter((logo) => logo.visible && logo.url && !logo.url.startsWith("blob:"))
            .sort((a, b) => a.zIndex - b.zIndex)

        if (visibleLogos.length === 0) {
          resolve(canvas.toDataURL("image/jpeg", 0.8))
          return
        }

        let loadedLogos = 0
        const totalLogos = visibleLogos.length

        visibleLogos.forEach((logo) => {
          const logoImg = new window.Image()
          logoImg.crossOrigin = "anonymous"
          logoImg.onload = () => {
            const x = (canvas.width * logo.position.x) / 100
            const y = (canvas.height * logo.position.y) / 100
            const size = (canvas.width * logo.size) / 100
            const width = logo.maintainAspectRatio ? size : size
            const height = logo.maintainAspectRatio ? size / logo.aspectRatio : size

            ctx.save()
            ctx.translate(x, y)
            ctx.rotate((logo.rotation * Math.PI) / 180)
            ctx.filter = getLogoFilterStyle(logo.filters)
            ctx.drawImage(logoImg, -width / 2, -height / 2, width, height)
            ctx.restore()

            loadedLogos++
            if (loadedLogos === totalLogos) {
              resolve(canvas.toDataURL("image/jpeg", 0.8))
            }
          }
          logoImg.onerror = () => {
            loadedLogos++
            if (loadedLogos === totalLogos) {
              resolve(canvas.toDataURL("image/jpeg", 0.8))
            }
          }
          logoImg.src = logo.url!
        })
      }
      templateImg.onerror = () => {
        resolve("/placeholder.svg?height=200&width=200")
      }
      templateImg.src = templateImages[design.data.selectedTemplate] || "/placeholder.svg"
    })
  }

  const [designThumbnails, setDesignThumbnails] = useState<Record<string, string>>({})

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
        console.log("🎨 API Response:", data) // Debug log

        // Handle the nested response structure
        let serverDesigns: DesignData[] = []
        if (data.success && data.data && data.data.designs && Array.isArray(data.data.designs)) {
          serverDesigns = data.data.designs
          console.log("🎨 Extracted designs from nested structure:", serverDesigns)
        } else if (Array.isArray(data)) {
          serverDesigns = data
          console.log("🎨 Using direct array response:", serverDesigns)
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
        localStorage.setItem("mockup-designs", JSON.stringify(serverDesigns))
        return
      }

      // Fallback to local storage
      const savedDesigns = JSON.parse(localStorage.getItem("mockup-designs") || "[]")
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
      const savedDesigns = JSON.parse(localStorage.getItem("mockup-designs") || "[]")
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

  // Debug effect to log logos state changes
  useEffect(() => {
    console.log("🎨 Logos state changed:", {
      count: logos.length,
      logos: logos.map((logo, index) => ({
        index,
        id: logo.id,
        hasFile: !!logo.file,
        hasUrl: !!logo.url,
        url: logo.url,
        visible: logo.visible,
      })),
    })
  }, [logos])

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
              <Button variant="outline" size="icon" onClick={toggleRightPanel}>
                <PanelRight className="h-4 w-4" />
              </Button>
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
                  disabled={logos.length === 0 || isSaving || !user}
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
                  className="relative w-full aspect-square bg-gray-50 rounded-lg shadow-sm overflow-hidden"
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

                {/* Wax Effect Overlay */}
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
                                disabled={isUploading}
                            />
                            <label htmlFor="welcome-upload">
                              <Button className="w-full gap-2" asChild disabled={isUploading}>
                            <span>
                              {isUploading ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
                                  </>
                              ) : (
                                  <>
                                    <Upload className="h-4 w-4" /> Upload Logo
                                  </>
                              )}
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
                                disabled={isUploading}
                            />
                            <label htmlFor="logo-upload-side">
                              <Button variant="outline" className="w-full gap-2" asChild disabled={isUploading}>
                            <span>
                              {isUploading ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
                                  </>
                              ) : (
                                  <>
                                    <Upload className="h-4 w-4" /> Upload New Logo
                                  </>
                              )}
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

        <LoginModal open={showAuthModal} onOpenChange={handleAuthModalClose} onSuccess={handleAuthSuccess} />

        {/* Save Design Dialog */}
        <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Save Design</DialogTitle>
              <DialogDescription>Give your design a name to save it to your recent projects.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="design-name">Design Name</Label>
                <Input
                    id="design-name"
                    value={currentDesignName}
                    onChange={(e) => setCurrentDesignName(e.target.value)}
                    placeholder="My Awesome Design"
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
                Recent Designs
              </DialogTitle>
              <DialogDescription>Continue where you left off or start fresh with a previous design.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {!Array.isArray(designHistory) || designHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold mb-2">No Recent Designs</h3>
                    <p className="text-gray-600">Start creating your first design to see it here!</p>
                  </div>
              ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {designHistory.map((design: DesignData) => (
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

                              {/* Template badge */}
                              <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                {templateNames[design.data.selectedTemplate] || design.data.selectedTemplate}
                              </div>

                              {/* Logo count badge */}
                              {design.data.logos && design.data.logos.length > 0 && (
                                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                                    {design.data.logos.length} logo{design.data.logos.length !== 1 ? "s" : ""}
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
                                  {design.data.canvasSize?.width || 800} × {design.data.canvasSize?.height || 600}px
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
