"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
    Download,
    Upload,
    Loader2,
    ArrowLeft,
    Lock,
    RotateCw,
    RotateCwIcon as RotateCounterClockwise,
    Plus,
    Minus,
    Clock,
    Save,
    FileText,
    Calendar,
    Maximize2,
    Trash,
} from "lucide-react"
import { useIsMobile as useMobile } from "@/hooks/use-mobile"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import LoginModal from "@/components/login-modal"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// Define logo data structure with enhanced properties
interface LogoData {
    id: string
    file: File | null
    url: string | null
    originalUrl?: string
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
        paperSize: string
        paperColor: string
        material: string
        quantity: number
        gridSettings: {
            enabled: boolean
            rows: number
            columns: number
            spacing: number
            autoArrange: boolean
        }
    }
}

// Paper size presets
const PAPER_SIZES = {
    "4x4": { width: 4, height: 4, name: '4" x 4"' },
    "6x6": { width: 6, height: 6, name: '6" x 6"' },
    "8x8": { width: 8, height: 8, name: '8" x 8"' },
    "12x12": { width: 12, height: 12, name: '12" x 12"' },
    custom: { width: 8, height: 8, name: "Custom" },
}

// Material options
const MATERIALS = {
    "butcher-paper": "Butcher Paper",
    "wax-paper": "Wax Paper",
    parchment: "Parchment Paper",
    "food-grade": "Food Grade Paper",
}

export default function WaxPaperPage() {
    const searchParams = useSearchParams()
    const initialTemplate = searchParams.get("template") || "repeating-pattern"
    const [selectedTemplate, setSelectedTemplate] = useState(initialTemplate)
    const [logos, setLogos] = useState<LogoData[]>([])
    const [selectedLogoIndex, setSelectedLogoIndex] = useState<number | null>(null)
    const [selectedLogos, setSelectedLogos] = useState<number[]>([])
    const [isDragging, setIsDragging] = useState(false)
    const [isResizing, setIsResizing] = useState(false)
    const [resizeHandle, setResizeHandle] = useState<string | null>(null)
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
    const [templateColor, setTemplateColor] = useState("#FFFFFF")
    const [paperSize, setPaperSize] = useState("4x4")
    const [paperColor, setPaperColor] = useState("#ffffff")
    const [material, setMaterial] = useState("butcher-paper")
    const [quantity, setQuantity] = useState(1)
    const [showLeftPanel, setShowLeftPanel] = useState(true)
    const [showRightPanel, setShowRightPanel] = useState(true)
    const [activeTab, setActiveTab] = useState("logo")
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
        enabled: true,
        opacity: 0.15,
        rotation: 30,
        spacing: 80,
        pattern: "logo",
        size: 60,
    })
    // Grid functionality for arranging logos
    const [gridSettings, setGridSettings] = useState({
        enabled: true,
        rows: 10,
        columns: 15,
        spacing: 5,
        autoArrange: true,
    })
    const containerRef = useRef<HTMLDivElement>(null)
    const isMobile = useMobile()
    const { user, loading, getAuthToken } = useAuth()
    const [showAuthModal, setShowAuthModal] = useState(false)
    const [showLoginModal, setShowLoginModal] = useState(false)
    const [isUploading, setIsUploading] = useState(false)

    // Add after existing state declarations
    const [showCustomSizeDialog, setShowCustomSizeDialog] = useState(false)
    const [customPaperSize, setCustomPaperSize] = useState({ width: 8, height: 8 })
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

    // Add this near the top of the component with other refs
    const userRef = useRef(user)

    // Add this useEffect to keep the ref updated
    useEffect(() => {
        userRef.current = user
    }, [user])

    // Debug logging for auth state changes
    useEffect(() => {
        console.log("🧻 WaxPaper - Auth state changed:", { user, loading })
    }, [user, loading])

    // Check if user should see auth modal (but don't change layout)
    useEffect(() => {
        console.log("🧻 WaxPaper - Checking if should show modal:", { loading, user })
        if (!loading) {
            if (!user) {
                console.log("🧻 WaxPaper - No user, showing modal")
                setShowAuthModal(true)
            } else {
                console.log("🧻 WaxPaper - User found, hiding modal")
                setShowAuthModal(false)
            }
        }
    }, [user, loading])

    // Template data mapping
    const templateImages: Record<string, string> = {
        "dense-grid": "/placeholder.svg?height=600&width=800",
        "section-blocks": "/placeholder.svg?height=600&width=800",
        "medium-grid": "/placeholder.svg?height=600&width=800",
        "large-sections": "/placeholder.svg?height=600&width=800",
        "sparse-layout": "/placeholder.svg?height=600&width=800",
        "diamond-pattern": "/placeholder.svg?height=600&width=800",
    }

    const templateNames: Record<string, string> = {
        "dense-grid": "Dense Grid Pattern",
        "section-blocks": "Section Blocks",
        "medium-grid": "Medium Grid",
        "large-sections": "Large Sections",
        "sparse-layout": "Sparse Layout",
        "diamond-pattern": "Diamond Pattern",
    }

    const templateGridSettings: Record<string, { rows: number; columns: number; spacing: number }> = {
        "dense-grid": { rows: 15, columns: 20, spacing: 2 },
        "section-blocks": { rows: 8, columns: 5, spacing: 8 },
        "medium-grid": { rows: 12, columns: 15, spacing: 3 },
        "large-sections": { rows: 6, columns: 4, spacing: 12 },
        "sparse-layout": { rows: 8, columns: 10, spacing: 15 },
        "diamond-pattern": { rows: 10, columns: 12, spacing: 5 },
    }

    // Get the currently selected logo
    const selectedLogo = selectedLogoIndex !== null ? logos[selectedLogoIndex] : null

    // Create a new logo with enhanced properties
    const createNewLogo = (file: File | null = null, url: string | null = null): LogoData => {
        const newZIndex = Math.max(...logos.map((l) => l.zIndex), 0) + 1
        console.log("🧻 Creating new logo:", { file: file?.name, url, newZIndex })

        return {
            id: Date.now().toString(),
            file,
            url,
            originalUrl: url,
            position: { x: 50, y: 50 },
            size: 25, // Smaller default size for wax paper
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

    // Update addLogo function to ask for save when adding first logo
    const addLogo = (file: File | null = null, url: string | null = null) => {
        console.log("🧻 Adding logo:", { file: file?.name, url })
        const newLogo = createNewLogo(file, url)
        setLogos((prevLogos) => {
            const updatedLogos = [...prevLogos, newLogo]
            console.log("🧻 Updated logos array:", updatedLogos)
            return updatedLogos
        })
        setSelectedLogoIndex(logos.length)
        setShowWelcome(false)

        // Set template to single-logo for new uploads if no template is selected
        if (selectedTemplate === "repeating-pattern" || !selectedTemplate) {
            setSelectedTemplate("single-logo")
        }

        // If this is the first logo and no current design, ask user to save with a name
        if (logos.length === 0 && !currentDesignId && user) {
            setTimeout(() => {
                setShowSaveDialog(true) // Show dialog to get name from user
            }, 1000)
        }

        // Auto-arrange in grid if enabled and it's a grid template
        if (gridSettings.enabled && gridSettings.autoArrange && selectedTemplate !== "single-logo") {
            setTimeout(() => {
                arrangeLogosInGrid()
            }, 100)
        }

        toast({
            title: "Logo Added!",
            description: "Your logo has been added to the wax paper. Drag it to position it perfectly.",
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
            description: "The logo has been removed from your wax paper design.",
        })
    }

    // Size control functions
    const enlargeLogo = () => {
        if (selectedLogoIndex === null) return
        const newLogos = [...logos]
        newLogos[selectedLogoIndex].size = Math.min(80, newLogos[selectedLogoIndex].size + 5)
        setLogos(newLogos)

        // Force re-render of template patterns
        if (selectedTemplate !== "single-logo") {
            // Trigger a small state change to force template re-render
            setTemplateColor((prev) => prev)
        }
    }

    const shrinkLogo = () => {
        if (selectedLogoIndex === null) return
        const newLogos = [...logos]
        newLogos[selectedLogoIndex].size = Math.max(5, newLogos[selectedLogoIndex].size - 5)
        setLogos(newLogos)

        // Force re-render of template patterns
        if (selectedTemplate !== "single-logo") {
            // Trigger a small state change to force template re-render
            setTemplateColor((prev) => prev)
        }
    }

    // Rotation control functions
    const rotateClockwise = () => {
        if (selectedLogoIndex === null) return
        const newLogos = [...logos]
        newLogos[selectedLogoIndex].rotation = (newLogos[selectedLogoIndex].rotation + 15) % 360
        setLogos(newLogos)
    }

    const rotateCounterClockwise = () => {
        if (selectedLogoIndex === null) return
        const newLogos = [...logos]
        newLogos[selectedLogoIndex].rotation = (newLogos[selectedLogoIndex].rotation - 15 + 360) % 360
        setLogos(newLogos)
    }

    // Grid arrangement function
    const arrangeLogosInGrid = () => {
        if (logos.length === 0) return

        const visibleLogos = logos.filter((logo) => logo.visible && !logo.locked)
        if (visibleLogos.length === 0) return

        const { rows, columns, spacing } = gridSettings
        const maxLogos = rows * columns
        const logosToArrange = visibleLogos.slice(0, maxLogos)

        // Calculate grid dimensions
        const canvasWidth = 100 // percentage
        const canvasHeight = 100 // percentage
        const cellWidth = (canvasWidth - (columns + 1) * spacing) / columns
        const cellHeight = (canvasHeight - (rows + 1) * spacing) / rows

        const newLogos = [...logos]

        logosToArrange.forEach((logo, index) => {
            const row = Math.floor(index / columns)
            const col = index % columns

            const x = spacing + col * (cellWidth + spacing) + cellWidth / 2
            const y = spacing + row * (cellHeight + spacing) + cellHeight / 2

            const logoIndex = logos.findIndex((l) => l.id === logo.id)
            if (logoIndex !== -1) {
                newLogos[logoIndex] = {
                    ...newLogos[logoIndex],
                    position: { x, y },
                    size: Math.min(cellWidth * 0.8, cellHeight * 0.8), // 80% of cell size
                }
            }
        })

        setLogos(newLogos)
        toast({
            title: "Grid Applied",
            description: `Arranged ${logosToArrange.length} logos in a ${rows}×${columns} grid.`,
        })
    }

    // Update logo URL when file changes
    useEffect(() => {
        console.log("🧻 Logo URL effect triggered, logos count:", logos.length)

        logos.forEach((logo, index) => {
            if (logo.file && !logo.url) {
                console.log(`🧻 Processing logo ${index} with file:`, logo.file.name)

                const url = URL.createObjectURL(logo.file)
                console.log(`🧻 Created blob URL for logo ${index}:`, url)

                setLogos((prevLogos) => {
                    const updatedLogos = [...prevLogos]
                    updatedLogos[index] = { ...logo, url }
                    console.log(`🧻 Updated logo ${index} with URL:`, updatedLogos[index])
                    return updatedLogos
                })

                // Calculate aspect ratio for uploaded images
                const img = new window.Image()
                img.onload = () => {
                    const aspectRatio = img.width / img.height
                    console.log(`🧻 Logo ${index} aspect ratio calculated:`, aspectRatio)

                    setLogos((prevLogos) => {
                        const newLogos = [...prevLogos]
                        if (newLogos[index]) {
                            newLogos[index] = { ...newLogos[index], aspectRatio }
                            console.log(`🧻 Updated logo ${index} with aspect ratio:`, newLogos[index])
                        }
                        return newLogos
                    })
                }
                img.onerror = (error) => {
                    console.error(`🧻 Error loading image for logo ${index}:`, error)
                }
                img.src = url
            }
        })
    }, [logos.length])

    // Enhanced file upload with backend storage
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        console.log("🧻 File upload triggered")

        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            console.log("🧻 File selected:", { name: file.name, size: file.size, type: file.type })

            // Validate file type
            if (!file.type.startsWith("image/")) {
                console.error("🧻 Invalid file type:", file.type)
                toast({
                    title: "Invalid File Type",
                    description: "Please upload a PNG, JPG, or other image file.",
                    variant: "destructive",
                })
                return
            }

            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                console.error("🧻 File too large:", file.size)
                toast({
                    title: "File Too Large",
                    description: "Please upload an image smaller than 10MB.",
                    variant: "destructive",
                })
                return
            }

            if (!user) {
                console.log("🧻 No user authenticated")
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
                console.log("🧻 FormData created with image")

                // Upload to backend directly
                const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://mockupgenerator-be.vercel.app"
                console.log("🧻 Using backend URL:", BACKEND_URL)
                const uploadUrl = `${BACKEND_URL}/api/uploads/upload`

                console.log("🧻 Uploading to:", uploadUrl)

                const response = await fetch(uploadUrl, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${getAuthToken()}`,
                    },
                    body: formData,
                })

                console.log("🧻 Upload response status:", response.status)

                if (!response.ok) {
                    const errorData = await response.json()
                    console.error("🧻 Upload failed:", errorData)
                    throw new Error(errorData.error || "Upload failed")
                }

                const uploadData = await response.json()
                console.log("🧻 Upload successful:", uploadData)

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
                    console.log("🧻 Transformed localhost URL to:", imageUrl)
                }

                console.log("🧻 Final image URL:", imageUrl)

                if (!imageUrl) {
                    console.error("🧻 No URL found in upload response:", uploadData)
                    throw new Error("No image URL returned from server")
                }

                // Add logo with permanent URL
                addLogo(null, imageUrl)

                toast({
                    title: "Upload Successful!",
                    description: "Your image has been uploaded and added to the wax paper.",
                })
            } catch (error) {
                console.error("🧻 Upload error:", error)

                // Fallback: create blob URL for immediate use
                console.log("🧻 Using fallback blob URL")
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
                newSize = Math.max(5, Math.min(80, (Math.abs(deltaX) / rect.width) * 200))
            } else if (resizeHandle.includes("bottom")) {
                newSize = Math.max(5, Math.min(80, (Math.abs(deltaY) / rect.height) * 200))
            } else if (resizeHandle.includes("corner")) {
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
                newSize = Math.max(5, Math.min(80, (distance / rect.width) * 200))
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

    // Set up event listeners
    useEffect(() => {
        window.addEventListener("mouseup", handleDragEnd)
        window.addEventListener("touchend", handleDragEnd)

        return () => {
            window.removeEventListener("mouseup", handleDragEnd)
            window.removeEventListener("touchend", handleDragEnd)
        }
    }, [])

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
        if (!open && !loading) {
            setTimeout(() => {
                const currentUser = userRef.current
                console.log("🧻 WaxPaper - Delayed check for redirect:", { currentUser })

                if (!currentUser) {
                    console.log("🧻 WaxPaper - Redirecting to home")
                    window.location.href = "/"
                } else {
                    console.log("🧻 WaxPaper - User found, staying on page")
                }
            }, 200)
        }
        setShowLoginModal(open)
    }

    const handleAuthSuccess = () => {
        console.log("🧻 WaxPaper - Auth success handler")
        setShowLoginModal(false)
        toast({
            title: "Welcome!",
            description: "You can now download your wax paper design.",
        })
        setTimeout(() => {
            if (userRef.current) {
                handleDownload()
            }
        }, 300)
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

            // Draw background color
            ctx.fillStyle = paperColor
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            const visibleLogos = logos.filter(({ logo }) => logo.visible && logo.url)

            if (visibleLogos.length === 0) {
                finishDownload()
                return
            }

            // Check if this is a grid template
            const isGridTemplate = selectedTemplate !== "single-logo"

            if (isGridTemplate && visibleLogos.length > 0) {
                // Render grid pattern
                const firstLogo = visibleLogos[0]
                const img = new window.Image()
                img.crossOrigin = "anonymous"
                img.onload = () => {
                    // Calculate grid cell dimensions
                    const cellWidth = canvas.width / gridSettings.columns
                    const cellHeight = canvas.height / gridSettings.rows
                    const logoSize = Math.min(cellWidth, cellHeight) * 0.6 // 60% of cell size

                    // Draw grid pattern
                    for (let row = 0; row < gridSettings.rows; row++) {
                        for (let col = 0; col < gridSettings.columns; col++) {
                            const x = col * cellWidth + cellWidth / 2
                            const y = row * cellHeight + cellHeight / 2

                            ctx.save()
                            ctx.translate(x, y)
                            ctx.rotate((firstLogo.rotation * Math.PI) / 180)
                            ctx.filter = getLogoFilterStyle(firstLogo.filters)

                            // Apply template-specific sizing
                            let finalLogoSize = logoSize
                            if (selectedTemplate === "sparse-layout") {
                                finalLogoSize = logoSize * 0.8
                            } else if (selectedTemplate === "large-sections") {
                                finalLogoSize = logoSize * 1.5
                            }

                            ctx.drawImage(img, -finalLogoSize / 2, -finalLogoSize / 2, finalLogoSize, finalLogoSize)
                            ctx.restore()
                        }
                    }

                    finishDownload()
                }
                img.onerror = () => {
                    console.error("Failed to load logo for grid download")
                    finishDownload()
                }
                img.src = firstLogo.url!
            } else {
                // Render individual logos for single-logo template
                const sortedLogos = visibleLogos.sort((a, b) => a.zIndex - b.zIndex)

                let processedLogos = 0

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
                    img.onerror = () => {
                        processedLogos++
                        if (processedLogos === sortedLogos.length) {
                            finishDownload()
                        }
                    }
                    img.src = logo.url!
                })
            }

            function finishDownload() {
                try {
                    const dataUrl = canvas.toDataURL("image/png", 1.0)
                    const link = document.createElement("a")
                    link.download = `wax-paper-${selectedTemplate}-${Date.now()}.png`
                    link.href = dataUrl
                    link.click()

                    toast({
                        title: "Download Complete!",
                        description: "Your high-quality wax paper design has been downloaded successfully.",
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
            console.error("Error during download:", error)
            toast({
                title: "Error",
                description: "An error occurred during the download process.",
                variant: "destructive",
            })
            setIsDownloading(false)
        }
    }

    // Design History & Recent Projects
    const [designHistory, setDesignHistory] = useState<DesignData[]>([])
    const [showHistoryModal, setShowHistoryModal] = useState(false)
    const [currentDesignName, setCurrentDesignName] = useState("")
    const [showSaveDialog, setShowSaveDialog] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [currentDesignId, setCurrentDesignId] = useState<string | null>(null)
    const [designThumbnails, setDesignThumbnails] = useState<Record<string, string>>({})

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

    // Add auto-save trigger for any design changes
    useEffect(() => {
        if (
            logos.length > 0 ||
            selectedTemplate !== "repeating-pattern" ||
            paperColor !== "#ffffff" ||
            paperSize !== "4x4"
        ) {
            setHasUnsavedChanges(true)

            // Auto-save after 2 seconds of inactivity
            const autoSaveTimeout = setTimeout(() => {
                if (user && hasUnsavedChanges && currentDesignId) {
                    // Only auto-save if we already have a design ID (user has named it)
                    saveCurrentDesign(currentDesignName || "Auto-save", false)
                }
            }, 2000)

            return () => clearTimeout(autoSaveTimeout)
        }
    }, [
        logos,
        selectedTemplate,
        paperColor,
        paperSize,
        material,
        quantity,
        gridSettings,
        user,
        hasUnsavedChanges,
        currentDesignId,
        currentDesignName,
    ])

    // Design History Functions
    // Update saveCurrentDesign function signature and add silent parameter
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

        const designName = name || currentDesignName || `Wax Paper Design ${Date.now()}`
        setIsSaving(true)

        try {
            const logosToSave = logos
                .filter((logo) => logo.url && !logo.url.startsWith("blob:"))
                .map((logo) => ({
                    ...logo,
                    file: null,
                    url: logo.originalUrl || logo.url,
                    originalUrl: logo.originalUrl || logo.url,
                }))

            const designData = {
                name: designName,
                data: {
                    selectedTemplate,
                    logos: logosToSave,
                    canvasSize,
                    waxEffect,
                    templateColor,
                    paperSize,
                    paperColor,
                    material,
                    quantity,
                    gridSettings,
                },
            }

            if (currentDesignId) {
                ;(designData as any).id = currentDesignId
            }

            try {
                const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://mockupgenerator-be.vercel.app"
                const endpoint = currentDesignId
                    ? `${BACKEND_URL}/api/designs/update?designId=${currentDesignId}`
                    : `${BACKEND_URL}/api/designs/create`

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
                if (!currentDesignId) {
                    setCurrentDesignId(savedDesign.id || savedDesign.data?.id || Date.now().toString())
                }

                await loadDesignHistory()
                setHasUnsavedChanges(false)

                if (showToast) {
                    toast({
                        title: "Design Saved!",
                        description: `"${designName}" has been saved successfully.`,
                    })
                }
            } catch (apiError) {
                console.error("API save failed, using local storage:", apiError)

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
                        paperSize,
                        paperColor,
                        material,
                        quantity,
                        gridSettings,
                    },
                }

                const existingDesigns = JSON.parse(localStorage.getItem("wax-paper-designs") || "[]")
                const updatedDesigns = [
                    fallbackDesign,
                    ...existingDesigns.filter((d: DesignData) => d.id !== fallbackDesign.id).slice(0, 9),
                ]
                localStorage.setItem("wax-paper-designs", JSON.stringify(updatedDesigns))
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
            console.error("Save failed:", error)
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

    const loadDesign = async (design: DesignData) => {
        setIsLoading(true)

        try {
            setSelectedTemplate(design.data.selectedTemplate)
            setCanvasSize(design.data.canvasSize)
            setWaxEffect(design.data.waxEffect)
            setTemplateColor(design.data.templateColor)
            setPaperSize(design.data.paperSize || "4x4")
            setPaperColor(design.data.paperColor || "#ffffff")
            setMaterial(design.data.material || "butcher-paper")
            setQuantity(design.data.quantity || 1)

            // Properly restore grid settings based on the saved template
            const savedGridSettings = design.data.gridSettings || {
                enabled: true,
                rows: 10,
                columns: 15,
                spacing: 5,
                autoArrange: true,
            }

            // If the template has specific grid settings, use those
            const templateSettings = templateGridSettings[design.data.selectedTemplate]
            if (templateSettings) {
                setGridSettings({
                    ...savedGridSettings,
                    ...templateSettings,
                })
            } else {
                setGridSettings(savedGridSettings)
            }

            setCurrentDesignName(design.name)
            setCurrentDesignId(design.id)

            const restoredLogos = (design.data.logos || [])
                .filter((logo) => logo.url) // Keep all logos with URLs
                .map((logo) => ({
                    ...logo,
                    url: logo.originalUrl || logo.url,
                    file: null,
                }))

            setLogos(restoredLogos)
            // Add this line to enable buttons:
            setSelectedLogoIndex(restoredLogos.length > 0 ? 0 : null)
            setShowHistoryModal(false)
            setShowWelcome(restoredLogos.length === 0)

            // DON'T force template to single-logo - keep the original template
            // This was the bug - removing this line:
            // if (restoredLogos.length > 0) {
            //   setSelectedTemplate("single-logo")
            // }

            toast({
                title: "Design Loaded!",
                description: `"${design.name}" has been loaded successfully with ${templateNames[design.data.selectedTemplate]} template.`,
            })
        } catch (error) {
            console.error("Load failed:", error)
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

            await loadDesignHistory()

            toast({
                title: "Design Deleted",
                description: "The design has been removed from your history.",
            })
        } catch (error) {
            console.error("Delete failed:", error)

            const existingDesigns = JSON.parse(localStorage.getItem("wax-paper-designs") || "[]")
            const updatedDesigns = existingDesigns.filter((d: DesignData) => d.id !== designId)
            localStorage.setItem("wax-paper-designs", JSON.stringify(updatedDesigns))
            setDesignHistory(updatedDesigns)

            toast({
                title: "Design Deleted Locally",
                description: "The design has been removed from local storage.",
            })
        }
    }

    const generateDesignThumbnail = async (design: DesignData): Promise<string> => {
        return new Promise((resolve) => {
            const canvas = document.createElement("canvas")
            const ctx = canvas.getContext("2d")

            if (!ctx) {
                resolve("/placeholder.svg?height=200&width=200")
                return
            }

            canvas.width = 200
            canvas.height = 200

            ctx.fillStyle = design.data.paperColor || "white"
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            const visibleLogos = (design.data.logos || [])
                .filter((logo) => logo.visible && logo.url && !logo.url.startsWith("blob:"))
                .sort((a, b) => a.zIndex - b.zIndex)

            if (visibleLogos.length === 0) {
                resolve(canvas.toDataURL("image/jpeg", 0.8))
                return
            }

            // Check if this is a grid template or single-logo
            const isGridTemplate = design.data.selectedTemplate !== "single-logo"

            if (isGridTemplate && visibleLogos.length > 0) {
                // Render grid pattern for thumbnails
                const firstLogo = visibleLogos[0]
                const gridSettings = design.data.gridSettings || { rows: 10, columns: 15, spacing: 5 }

                const img = new window.Image()
                img.crossOrigin = "anonymous"
                img.onload = () => {
                    // Calculate grid cell size
                    const cellWidth = canvas.width / gridSettings.columns
                    const cellHeight = canvas.height / gridSettings.rows
                    const logoSize = Math.min(cellWidth, cellHeight) * 0.6 // 60% of cell size

                    // Draw grid pattern
                    for (let row = 0; row < Math.min(gridSettings.rows, 8); row++) {
                        for (let col = 0; col < Math.min(gridSettings.columns, 8); col++) {
                            const x = col * cellWidth + cellWidth / 2
                            const y = row * cellHeight + cellHeight / 2

                            ctx.save()
                            ctx.translate(x, y)
                            ctx.rotate((firstLogo.rotation * Math.PI) / 180)
                            ctx.filter = getLogoFilterStyle(firstLogo.filters)
                            ctx.drawImage(img, -logoSize / 2, -logoSize / 2, logoSize, logoSize)
                            ctx.restore()
                        }
                    }

                    resolve(canvas.toDataURL("image/jpeg", 0.8))
                }
                img.onerror = () => {
                    resolve(canvas.toDataURL("image/jpeg", 0.8))
                }
                img.src = firstLogo.url!
            } else {
                // Render individual logos for single-logo template
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

                let serverDesigns: DesignData[] = []
                if (data.success && data.data && data.data.designs && Array.isArray(data.data.designs)) {
                    serverDesigns = data.data.designs
                } else if (Array.isArray(data)) {
                    serverDesigns = data
                } else {
                    serverDesigns = []
                }

                setDesignHistory(serverDesigns)

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

                localStorage.setItem("wax-paper-designs", JSON.stringify(serverDesigns))
                return
            }

            const savedDesigns = JSON.parse(localStorage.getItem("wax-paper-designs") || "[]")
            const validDesigns = Array.isArray(savedDesigns) ? savedDesigns : []
            setDesignHistory(validDesigns)

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
            console.error("Load history failed:", error)
            const savedDesigns = JSON.parse(localStorage.getItem("wax-paper-designs") || "[]")
            const validDesigns = Array.isArray(savedDesigns) ? savedDesigns : []
            setDesignHistory(validDesigns)

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

    // Update the paper size change handler
    const handlePaperSizeChange = (newSize: string) => {
        if (newSize === "custom") {
            setShowCustomSizeDialog(true)
        } else {
            setPaperSize(newSize)
        }
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            {/* Header */}
            <header className="border-b p-4 bg-white shadow-sm">
                <div className="container flex items-center justify-between mx-auto">
                    <div className="flex items-center gap-3">
                        <Link href="/">
                            <Button variant="outline" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold">Wax Paper Editor</h1>
                            <p className="text-sm text-gray-500">Create custom wax paper packaging designs</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
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
                <div className="grid grid-cols-12 gap-6 h-full">
                    {/* Left Panel - Template Selection */}
                    <div className="col-span-3 space-y-6">
                        {/* Template Selection */}
                        <Card className="border-yellow-200">
                            <CardHeader className="bg-yellow-100 border-b border-yellow-200">
                                <CardTitle className="text-yellow-800 font-bold">CHOOSE A TEMPLATE</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-3 max-h-96 overflow-y-auto">
                                {Object.entries(templateNames).map(([id, name]) => (
                                    <div
                                        key={id}
                                        className={`border rounded-lg p-3 cursor-pointer transition-all hover:border-primary ${selectedTemplate === id ? "border-primary bg-primary/5" : ""}`}
                                        onClick={() => {
                                            setSelectedTemplate(id)
                                            // Update grid settings based on template
                                            const settings = templateGridSettings[id]
                                            if (settings) {
                                                setGridSettings((prev) => ({
                                                    ...prev,
                                                    ...settings,
                                                }))
                                            }
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="relative w-16 h-16 flex-shrink-0">
                                                {/* Template preview based on type */}
                                                {id === "dense-grid" && (
                                                    <div className="grid grid-cols-8 gap-px p-1 h-full border rounded">
                                                        {Array.from({ length: 32 }).map((_, i) => (
                                                            <div key={i} className="bg-gray-300 rounded-sm text-xs flex items-center justify-center">
                                                                <span className="text-[3px] font-bold">L</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {id === "section-blocks" && (
                                                    <div className="grid grid-cols-2 gap-1 p-1 h-full border rounded">
                                                        {Array.from({ length: 4 }).map((_, i) => (
                                                            <div key={i} className="border border-gray-400 rounded p-1 grid grid-cols-2 gap-px">
                                                                {Array.from({ length: 4 }).map((_, j) => (
                                                                    <div
                                                                        key={j}
                                                                        className="bg-gray-200 rounded text-[4px] flex items-center justify-center"
                                                                    >
                                                                        <span className="font-bold">L</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {id === "medium-grid" && (
                                                    <div className="grid grid-cols-6 gap-px p-1 h-full border rounded">
                                                        {Array.from({ length: 24 }).map((_, i) => (
                                                            <div key={i} className="bg-gray-300 rounded-sm text-xs flex items-center justify-center">
                                                                <span className="text-[4px] font-bold">L</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {id === "large-sections" && (
                                                    <div className="grid grid-cols-2 gap-2 p-2 h-full border rounded">
                                                        {Array.from({ length: 4 }).map((_, i) => (
                                                            <div
                                                                key={i}
                                                                className="border-2 border-dashed border-gray-400 rounded p-1 flex items-center justify-center"
                                                            >
                                                                <span className="text-[6px] font-bold text-gray-600">LOGO</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {id === "sparse-layout" && (
                                                    <div className="relative h-full border rounded p-1">
                                                        {[
                                                            { top: "20%", left: "20%" },
                                                            { top: "30%", left: "70%" },
                                                            { top: "60%", left: "40%" },
                                                            { top: "80%", left: "80%" },
                                                        ].map((pos, i) => (
                                                            <div
                                                                key={i}
                                                                className="absolute w-3 h-2 bg-gray-300 rounded text-[3px] flex items-center justify-center"
                                                                style={{ top: pos.top, left: pos.left }}
                                                            >
                                                                <span className="font-bold">L</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {id === "diamond-pattern" && (
                                                    <div className="grid grid-cols-4 gap-1 p-1 h-full border rounded">
                                                        {Array.from({ length: 16 }).map((_, i) => (
                                                            <div
                                                                key={i}
                                                                className="bg-gray-300 text-[3px] flex items-center justify-center transform rotate-45"
                                                                style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }}
                                                            >
                                                                <span className="font-bold transform -rotate-45">L</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">{name}</p>
                                                <p className="text-xs text-gray-500">
                                                    {id === "dense-grid" && "Tightly packed small logos"}
                                                    {id === "section-blocks" && "Organized sections with multiple logos"}
                                                    {id === "medium-grid" && "Balanced spacing between logos"}
                                                    {id === "large-sections" && "Bigger logo areas with more spacing"}
                                                    {id === "sparse-layout" && "Scattered logos with lots of white space"}
                                                    {id === "diamond-pattern" && "Logos arranged in diamond shapes"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Center Panel - Preview Area */}
                    <div className="col-span-6 relative">
                        <div className="relative bg-white rounded-lg shadow-lg overflow-hidden h-full min-h-[600px]">
                            {/* Size indicator */}
                            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
                                <div className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                                    {PAPER_SIZES[paperSize as keyof typeof PAPER_SIZES]?.name || "4 INCHES"}
                                </div>
                            </div>

                            <div
                                ref={containerRef}
                                className="relative w-full h-full"
                                style={{ backgroundColor: paperColor }}
                                onMouseMove={handleDragMove}
                                onTouchMove={handleDragMove}
                                onClick={handleCanvasClick}
                            >
                                {/* Render logos based on template */}
                                {logos.length > 0 && logos[0].url && selectedTemplate !== "single-logo" && (
                                    <div className="absolute inset-0 p-4">
                                        <div
                                            className="grid gap-2 h-full w-full"
                                            style={{
                                                gridTemplateColumns: `repeat(${gridSettings.columns}, 1fr)`,
                                                gridTemplateRows: `repeat(${gridSettings.rows}, 1fr)`,
                                                gap: `${gridSettings.spacing}px`,
                                            }}
                                        >
                                            {Array.from({ length: gridSettings.rows * gridSettings.columns }).map((_, index) => (
                                                <div
                                                    key={`${index}-${logos[0].size}-${logos[0].rotation}`}
                                                    className="flex items-center justify-center"
                                                >
                                                    <div
                                                        className={`relative ${selectedTemplate === "diamond-pattern" ? "transform rotate-45" : ""}`}
                                                        style={{
                                                            width:
                                                                selectedTemplate === "sparse-layout"
                                                                    ? `${Math.max(20, logos[0].size * 0.8)}px`
                                                                    : selectedTemplate === "large-sections"
                                                                        ? `${Math.max(60, logos[0].size * 2)}px`
                                                                        : `${Math.max(30, logos[0].size * 1.2)}px`,
                                                            height:
                                                                selectedTemplate === "sparse-layout"
                                                                    ? `${Math.max(20, logos[0].size * 0.8)}px`
                                                                    : selectedTemplate === "large-sections"
                                                                        ? `${Math.max(60, logos[0].size * 2)}px`
                                                                        : `${Math.max(30, logos[0].size * 1.2)}px`,
                                                        }}
                                                    >
                                                        <Image
                                                            src={logos[0].url! || "/placeholder.svg"}
                                                            alt={`Pattern ${index}`}
                                                            fill
                                                            className="object-contain"
                                                            style={{
                                                                filter: getLogoFilterStyle(logos[0].filters),
                                                                transform: `rotate(${logos[0].rotation}deg)`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Only show individual logos in single-logo mode */}
                                {selectedTemplate === "single-logo" &&
                                    logos
                                        .filter((logo) => logo.visible && logo.url)
                                        .sort((a, b) => a.zIndex - b.zIndex)
                                        .map((logo, index) => {
                                            const originalIndex = logos.findIndex((l) => l.id === logo.id)
                                            return (
                                                logo.url && (
                                                    <div
                                                        key={logo.id}
                                                        className={`absolute cursor-move logo-image transition-all ${
                                                            selectedLogoIndex === originalIndex
                                                                ? "ring-2 ring-yellow-500 ring-offset-2 z-10"
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
                                {logos.length === 0 && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Card className="max-w-md mx-4">
                                            <CardContent className="p-6 text-center">
                                                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                                <h3 className="text-lg font-semibold mb-2">Upload Your Logo</h3>
                                                <p className="text-gray-600 mb-4">
                                                    Get started by uploading your logo to create your wax paper design
                                                </p>
                                                <input
                                                    type="file"
                                                    id="welcome-upload"
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                    className="hidden"
                                                    disabled={isUploading}
                                                />
                                                <label htmlFor="welcome-upload" className="flex-1">
                                                    <Button className="w-full gap-2" asChild disabled={isUploading}>
                            <span>
                              {isUploading ? (
                                  <>
                                      <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
                                  </>
                              ) : (
                                  <>
                                      <Upload className="h-4 w-4" /> Choose File
                                  </>
                              )}
                            </span>
                                                    </Button>
                                                </label>
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel - Controls */}
                    <div className="col-span-3 space-y-6">
                        {/* Size Controls */}
                        <div className="flex flex-col gap-2">
                            <Button onClick={enlargeLogo} disabled={!selectedLogo} className="gap-2">
                                <Plus className="h-5 w-5" />
                                ENLARGE
                            </Button>
                            <Button onClick={shrinkLogo} disabled={!selectedLogo} className="gap-2">
                                <Minus className="h-5 w-5" />
                                SHRINK
                            </Button>
                        </div>

                        {/* Rotation Controls */}
                        <div className="flex flex-col gap-2">
                            <Button onClick={rotateClockwise} disabled={!selectedLogo} className="gap-2">
                                <RotateCw className="h-5 w-5" />
                                CLOCKWISE
                            </Button>
                            <Button onClick={rotateCounterClockwise} disabled={!selectedLogo} className="gap-2">
                                <RotateCounterClockwise className="h-5 w-5" />
                                ANTI-CLOCKWISE
                            </Button>
                        </div>

                        {/* Remove Logo Control */}
                        <div className="flex flex-col gap-2">
                            <Button onClick={removeLogo} disabled={!selectedLogo} variant="destructive" className="gap-2">
                                <Trash className="h-5 w-5" />
                                REMOVE LOGO
                            </Button>
                        </div>

                        {/* Editor Settings */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg font-bold">WAX PAPER EDITOR</CardTitle>
                                <CardDescription>
                                    Create a design that stands out by starting with a base template and adding your own personal touch
                                    using the tools provided below.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Update Paper Size section */}
                                <div className="space-y-2">
                                    <Label className="font-semibold">Select Paper Size</Label>
                                    <Select value={paperSize} onValueChange={handlePaperSizeChange}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(PAPER_SIZES).map(([key, size]) => (
                                                <SelectItem key={key} value={key}>
                                                    {size.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Paper Color */}
                                <div className="space-y-2">
                                    <Label className="font-semibold">Select Paper Color</Label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={paperColor}
                                            onChange={(e) => setPaperColor(e.target.value)}
                                            className="w-full h-10 rounded border"
                                        />
                                    </div>
                                </div>

                                {/* Add Quantity and Materials sections back */}
                                <div className="space-y-2">
                                    <Label className="font-semibold">Quantity</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={1000}
                                        value={quantity}
                                        onChange={(e) => setQuantity(Number(e.target.value))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="font-semibold">Select Materials</Label>
                                    <Select value={material} onValueChange={setMaterial}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(MATERIALS).map(([key, name]) => (
                                                <SelectItem key={key} value={key}>
                                                    {name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>

            <LoginModal open={showAuthModal} onOpenChange={handleAuthModalClose} onSuccess={handleAuthSuccess} />

            {/* Save Design Dialog */}
            <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Save Wax Paper Design</DialogTitle>
                        <DialogDescription>Give your wax paper design a name to save it to your recent projects.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="design-name">Design Name</Label>
                            <Input
                                id="design-name"
                                value={currentDesignName}
                                onChange={(e) => setCurrentDesignName(e.target.value)}
                                placeholder="My Wax Paper Design"
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
                            Recent Wax Paper Designs
                        </DialogTitle>
                        <DialogDescription>Continue where you left off or start fresh with a previous design.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {!Array.isArray(designHistory) || designHistory.length === 0 ? (
                            <div className="text-center py-8">
                                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                <h3 className="text-lg font-semibold mb-2">No Recent Designs</h3>
                                <p className="text-gray-600">Start creating your first wax paper design to see it here!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {designHistory
                                    .filter(
                                        (design: DesignData) =>
                                            design.data?.selectedTemplate &&
                                            Array.isArray(design.data?.logos) &&
                                            design.data?.material &&
                                            design.data?.paperSize &&
                                            design.data?.paperColor &&
                                            design.data?.quantity &&
                                            design.data?.gridSettings,
                                    )
                                    .map((design: DesignData) => (
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

            {/* Custom Size Dialog */}
            <Dialog open={showCustomSizeDialog} onOpenChange={setShowCustomSizeDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Custom Paper Size</DialogTitle>
                        <DialogDescription>Enter your custom paper dimensions in inches.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="custom-width">Width (inches)</Label>
                                <Input
                                    id="custom-width"
                                    type="number"
                                    min={1}
                                    max={24}
                                    step={0.5}
                                    value={customPaperSize.width}
                                    onChange={(e) => setCustomPaperSize((prev) => ({ ...prev, width: Number(e.target.value) }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="custom-height">Height (inches)</Label>
                                <Input
                                    id="custom-height"
                                    type="number"
                                    min={1}
                                    max={24}
                                    step={0.5}
                                    value={customPaperSize.height}
                                    onChange={(e) => setCustomPaperSize((prev) => ({ ...prev, height: Number(e.target.value) }))}
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => {
                                    setPaperSize("custom")
                                    setShowCustomSizeDialog(false)
                                    toast({
                                        title: "Custom Size Applied",
                                        description: `Paper size set to ${customPaperSize.width}" x ${customPaperSize.height}"`,
                                    })
                                }}
                                className="flex-1"
                            >
                                Apply Custom Size
                            </Button>
                            <Button variant="outline" onClick={() => setShowCustomSizeDialog(false)}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
