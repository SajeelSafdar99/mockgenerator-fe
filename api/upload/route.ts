import { type NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://mockupgenerator-be.vercel.app"

export async function POST(request: NextRequest) {
    try {
        // Get auth token from request headers
        const authHeader = request.headers.get("authorization")
        if (!authHeader) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 })
        }

        // Get form data from request
        const formData = await request.formData()
        const file = formData.get("image") as File

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 })
        }

        // Validate file type
        if (!file.type.startsWith("image/")) {
            return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 })
        }

        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: "File too large. Maximum size is 10MB." }, { status: 400 })
        }

        // Create form data for backend
        const backendFormData = new FormData()
        backendFormData.append("image", file)

        // Forward to backend
        const response = await fetch(`${BACKEND_URL}/api/uploads/upload`, {
            method: "POST",
            headers: {
                Authorization: authHeader,
            },
            body: backendFormData,
        })

        if (!response.ok) {
            const errorData = await response.json()
            return NextResponse.json({ error: errorData.message || "Upload failed" }, { status: response.status })
        }

        const data = await response.json()

        if (data.success && data.data) {
            return NextResponse.json(data.data)
        } else {
            return NextResponse.json({ error: "Upload failed" }, { status: 500 })
        }
    } catch (error) {
        console.error("Upload error:", error)
        return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
    }
}