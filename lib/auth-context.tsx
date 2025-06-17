'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    // API base URL - replace with your Vercel deployment URL
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mockupgenerator-be.vercel.app'

    useEffect(() => {
        checkAuthStatus()
    }, [])

    const checkAuthStatus = async () => {
        try {
            const accessToken = localStorage.getItem('accessToken')
            if (!accessToken) {
                setLoading(false)
                return
            }

            const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            })

            if (response.ok) {
                const data = await response.json()
                setUser(data.data.user)
            } else {
                // Token might be expired, try to refresh
                await refreshToken()
            }
        } catch (error) {
            console.error('Auth check failed:', error)
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
        } finally {
            setLoading(false)
        }
    }

    const refreshToken = async () => {
        try {
            const refreshToken = localStorage.getItem('refreshToken')
            if (!refreshToken) return false

            const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refreshToken })
            })

            if (response.ok) {
                const data = await response.json()
                localStorage.setItem('accessToken', data.data.accessToken)
                await checkAuthStatus()
                return true
            } else {
                localStorage.removeItem('accessToken')
                localStorage.removeItem('refreshToken')
                return false
            }
        } catch (error) {
            console.error('Token refresh failed:', error)
            return false
        }
    }

    const login = async (email: string, password: string, rememberMe = false, redirect = true) => {
        try {
            setLoading(true)
            setError(null)

            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password, rememberMe }),
            })

            const data = await response.json()

            if (response.ok) {
                localStorage.setItem("accessToken", data.data.accessToken)
                localStorage.setItem("refreshToken", data.data.refreshToken)
                setUser(data.data.user)
                if (redirect) {
                    router.push("/editor")
                }
            } else {
                setError(data.message || "Login failed")
            }
        } catch (error) {
            setError("Network error. Please try again.")
            console.error("Login error:", error)
        } finally {
            setLoading(false)
        }
    }

    const signup = async (firstName: string, lastName: string, email: string, password: string, redirect = true) => {
        try {
            setLoading(true)
            setError(null)

            const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ firstName, lastName, email, password }),
            })

            const data = await response.json()

            if (response.ok) {
                localStorage.setItem("accessToken", data.data.accessToken)
                localStorage.setItem("refreshToken", data.data.refreshToken)
                setUser(data.data.user)
                if (redirect) {
                    router.push("/editor")
                }
            } else {
                setError(data.message || "Signup failed")
            }
        } catch (error) {
            setError("Network error. Please try again.")
            console.error("Signup error:", error)
        } finally {
            setLoading(false)
        }
    }
    const logout = async () => {
        try {
            const refreshToken = localStorage.getItem('refreshToken')
            if (refreshToken) {
                await fetch(`${API_BASE_URL}/api/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ refreshToken })
                })
            }
        } catch (error) {
            console.error('Logout error:', error)
        } finally {
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            setUser(null)
            router.push('/')
        }
    }

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, loading, error }}>
    {children}
    </AuthContext.Provider>
)
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
