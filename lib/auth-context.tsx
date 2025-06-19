"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"

interface User {
    id: string
    firstName: string
    lastName: string
    email: string
}

interface AuthContextType {
    user: User | null
    login: (email: string, password: string, rememberMe?: boolean, redirect?: boolean) => Promise<void>
    signup: (firstName: string, lastName: string, email: string, password: string, redirect?: boolean) => Promise<void>
    logout: () => Promise<void>
    loading: boolean
    error: string | null
    getAuthToken: () => string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    // API base URL - replace with your Vercel deployment URL
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://mockupgenerator-be.vercel.app"
    const getAuthToken = () => {
        if (typeof window === "undefined") return null
        return localStorage.getItem("accessToken")
    }

    // Debug logging for user state changes
    useEffect(() => {
        console.log("🔄 User state changed:", user)
    }, [user])

    useEffect(() => {
        console.log("🚀 AuthProvider mounted, checking auth status...")
        checkAuthStatus()
    }, [])

    const checkAuthStatus = async () => {
        console.log("🔍 Checking auth status...")
        try {
            const accessToken = localStorage.getItem("accessToken")
            console.log("🔑 Access token:", accessToken ? "exists" : "not found")

            if (!accessToken) {
                console.log("❌ No access token, setting loading to false")
                setLoading(false)
                return
            }

            const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            })

            console.log("📡 Profile response status:", response.status)

            if (response.ok) {
                const data = await response.json()
                console.log("✅ Profile data received:", data.data.user)
                console.log("🔄 Setting user state...")

                setUser(data.data.user)

                // Verify the state was set
                setTimeout(() => {
                    console.log("🔍 User state after setting:", user)
                }, 100)
            } else {
                console.log("🔄 Profile request failed, trying to refresh token...")
                // Token might be expired, try to refresh
                const refreshSuccess = await refreshToken()
                if (!refreshSuccess) {
                    console.log("❌ Token refresh failed")
                }
            }
        } catch (error) {
            console.error("❌ Auth check failed:", error)
            localStorage.removeItem("accessToken")
            localStorage.removeItem("refreshToken")
        } finally {
            console.log("✅ Setting loading to false")
            setLoading(false)
        }
    }

    const refreshToken = async () => {
        console.log("🔄 Attempting to refresh token...")
        try {
            const refreshToken = localStorage.getItem("refreshToken")
            if (!refreshToken) {
                console.log("❌ No refresh token available")
                return false
            }

            const response = await fetch(`${API_BASE_URL}/api/auth?action=refresh`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ refreshToken }),
            })

            if (response.ok) {
                const data = await response.json()
                console.log("✅ Token refreshed successfully")
                localStorage.setItem("accessToken", data.data.accessToken)
                await checkAuthStatus()
                return true
            } else {
                console.log("❌ Token refresh failed, clearing tokens")
                localStorage.removeItem("accessToken")
                localStorage.removeItem("refreshToken")
                return false
            }
        } catch (error) {
            console.error("❌ Token refresh error:", error)
            return false
        }
    }

    const login = async (email: string, password: string, rememberMe = false, redirect = false) => {
        console.log("🔐 Attempting login...")
        try {
            setLoading(true)
            setError(null)

            const response = await fetch(`${API_BASE_URL}/api/auth?action=login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password, rememberMe }),
            })

            const data = await response.json()

            if (response.ok) {
                console.log("✅ Login successful, received user data:", data.data.user)
                localStorage.setItem("accessToken", data.data.accessToken)
                localStorage.setItem("refreshToken", data.data.refreshToken)

                console.log("🔄 Setting user state from login...")
                setUser(data.data.user)

                // Only redirect if explicitly requested
                if (redirect) {
                    console.log("🔄 Redirecting to /editor...")
                    router.push("/editor")
                } else {
                    console.log("✅ Login complete, staying on current page")
                }
            } else {
                console.log("❌ Login failed:", data.message)
                setError(data.message || "Login failed")
            }
        } catch (error) {
            console.error("❌ Login error:", error)
            setError("Network error. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const signup = async (firstName: string, lastName: string, email: string, password: string, redirect = false) => {
        console.log("📝 Attempting signup...")
        try {
            setLoading(true)
            setError(null)

            const response = await fetch(`${API_BASE_URL}/api/auth?action=signup`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ firstName, lastName, email, password }),
            })

            const data = await response.json()

            if (response.ok) {
                console.log("✅ Signup successful, received user data:", data.data.user)
                localStorage.setItem("accessToken", data.data.accessToken)
                localStorage.setItem("refreshToken", data.data.refreshToken)

                console.log("🔄 Setting user state from signup...")
                setUser(data.data.user)

                // Only redirect if explicitly requested
                if (redirect) {
                    console.log("🔄 Redirecting to /editor...")
                    router.push("/editor")
                } else {
                    console.log("✅ Signup complete, staying on current page")
                }
            } else {
                console.log("❌ Signup failed:", data.message)
                setError(data.message || "Signup failed")
            }
        } catch (error) {
            console.error("❌ Signup error:", error)
            setError("Network error. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const logout = async () => {
        console.log("🚪 Logging out...")
        try {
            const refreshToken = localStorage.getItem("refreshToken")
            if (refreshToken) {
                await fetch(`${API_BASE_URL}/api/auth?action=logout`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ refreshToken }),
                })
            }
        } catch (error) {
            console.error("❌ Logout error:", error)
        } finally {
            localStorage.removeItem("accessToken")
            localStorage.removeItem("refreshToken")
            setUser(null)
            console.log("✅ Logout complete, redirecting to home")
            router.push("/")
        }
    }

    // Debug the current state
    console.log("🔍 AuthProvider render - user:", user, "loading:", loading)

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                signup,
                logout,
                loading,
                error,
                getAuthToken,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}
