"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { usePathname, useRouter } from "next/navigation"

export function useRouteProtection() {
    const { user, loading } = useAuth()
    const pathname = usePathname()
    const router = useRouter()
    const [showLoginModal, setShowLoginModal] = useState(false)
    const loginSuccessRef = useRef(false)

    // Define protected routes
    const protectedRoutes = ["/editor", "/logo-designer"]
    const isProtectedRoute = protectedRoutes.includes(pathname)

    useEffect(() => {
        if (!loading && isProtectedRoute && !user) {
            setShowLoginModal(true)
            loginSuccessRef.current = false
        } else if (user && showLoginModal) {
            setShowLoginModal(false)
            loginSuccessRef.current = false
        }
    }, [user, loading, isProtectedRoute, showLoginModal])

    const handleLoginSuccess = () => {
        loginSuccessRef.current = true
        setShowLoginModal(false)
    }

    const handleLoginModalClose = (open: boolean) => {
        if (!open) {
            // Use setTimeout to allow user state to update after successful login
            setTimeout(() => {
                // Only redirect if user is still not authenticated and it wasn't a successful login
                if (!user && isProtectedRoute && !loginSuccessRef.current) {
                    router.push("/")
                }
                loginSuccessRef.current = false
            }, 100)
        }
        setShowLoginModal(open)
    }

    return {
        showLoginModal,
        isProtectedRoute,
        isAuthenticated: !!user,
        loading,
        handleLoginSuccess,
        handleLoginModalClose,
        shouldShowContent: !isProtectedRoute || !!user || loading,
    }
}
