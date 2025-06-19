import { type NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://mockupgenerator-be.vercel.app"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const designId = params.id

        // Get auth token from request headers
        const authHeader = request.headers.get("authorization")
        if (!authHeader) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 })
        }

        const response = await fetch(`${BACKEND_URL}/api/designs/delete?designId=${designId}`, {
            method: "DELETE",
            headers: {
                Authorization: authHeader,
                "Content-Type": "application/json",
            },
        })

        if (!response.ok) {
            const errorData = await response.json()
            return NextResponse.json({ error: errorData.message || "Failed to delete design" }, { status: response.status })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting design:", error)
        return NextResponse.json({ error: "Failed to delete design" }, { status: 500 })
    }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const designId = params.id

        // Get auth token from request headers
        const authHeader = request.headers.get("authorization")
        if (!authHeader) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 })
        }

        const response = await fetch(`${BACKEND_URL}/api/designs/get?designId=${designId}`, {
            method: "GET",
            headers: {
                Authorization: authHeader,
                "Content-Type": "application/json",
            },
        })

        if (!response.ok) {
            const errorData = await response.json()
            return NextResponse.json({ error: errorData.message || "Failed to fetch design" }, { status: response.status })
        }

        const data = await response.json()

        // Return the nested data structure
        if (data.success && data.data) {
            return NextResponse.json(data.data)
        } else {
            return NextResponse.json(data)
        }
    } catch (error) {
        console.error("Error fetching design:", error)
        return NextResponse.json({ error: "Failed to fetch design" }, { status: 500 })
    }
}

