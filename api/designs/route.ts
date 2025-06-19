import { type NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://mockupgenerator-be.vercel.app"

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const page = searchParams.get("page") || "1"
        const limit = searchParams.get("limit") || "10"
        const search = searchParams.get("search") || ""

        // Get auth token from request headers
        const authHeader = request.headers.get("authorization")
        if (!authHeader) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 })
        }

        const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://mockupgenerator-be.vercel.app"
        const response = await fetch(`${BACKEND_URL}/api/designs/list?page=${page}&limit=${limit}&search=${search}`, {
            method: "GET",
            headers: {
                Authorization: authHeader,
                "Content-Type": "application/json",
            },
        })

        if (!response.ok) {
            const errorData = await response.json()
            return NextResponse.json({ error: errorData.message || "Failed to fetch designs" }, { status: response.status })
        }

        const data = await response.json()
        console.log("Backend response:", data) // Debug log

        // Handle the nested response structure properly
        if (data.success && data.data && data.data.designs && Array.isArray(data.data.designs)) {
            return NextResponse.json(data.data.designs)
        } else if (data.success && data.data && Array.isArray(data.data)) {
            return NextResponse.json(data.data)
        } else if (Array.isArray(data)) {
            return NextResponse.json(data)
        } else {
            console.warn("Unexpected response structure:", data)
            return NextResponse.json([])
        }
    } catch (error) {
        console.error("Error fetching designs:", error)
        return NextResponse.json({ error: "Failed to fetch designs" }, { status: 500 })
    }
}
export async function POST(request: NextRequest) {
    try {
        const designData = await request.json()

        // Get auth token from request headers
        const authHeader = request.headers.get("authorization")
        if (!authHeader) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 })
        }

        const response = await fetch(`${BACKEND_URL}/api/designs/create`, {
            method: "POST",
            headers: {
                Authorization: authHeader,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(designData),
        })

        if (!response.ok) {
            const errorData = await response.json()
            return NextResponse.json({ error: errorData.message || "Failed to create design" }, { status: response.status })
        }

        const data = await response.json()

        // Return the nested data structure
        if (data.success && data.data) {
            return NextResponse.json(data.data)
        } else {
            return NextResponse.json(data)
        }
    } catch (error) {
        console.error("Error creating design:", error)
        return NextResponse.json({ error: "Failed to create design" }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const designData = await request.json()
        const designId = designData.id

        if (!designId) {
            return NextResponse.json({ error: "Design ID is required" }, { status: 400 })
        }

        // Get auth token from request headers
        const authHeader = request.headers.get("authorization")
        if (!authHeader) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 })
        }

        const response = await fetch(`${BACKEND_URL}/api/designs/update?designId=${designId}`, {
            method: "PUT",
            headers: {
                Authorization: authHeader,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(designData),
        })

        if (!response.ok) {
            const errorData = await response.json()
            return NextResponse.json({ error: errorData.message || "Failed to update design" }, { status: response.status })
        }

        const data = await response.json()

        // Return the nested data structure
        if (data.success && data.data) {
            return NextResponse.json(data.data)
        } else {
            return NextResponse.json(data)
        }
    } catch (error) {
        console.error("Error updating design:", error)
        return NextResponse.json({ error: "Failed to update design" }, { status: 500 })
    }
}
