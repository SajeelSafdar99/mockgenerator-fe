"use client"

import Link from "next/link"
import { Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { useState, type FormEvent } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export default function SignupPage() {
    const { signup, loading, error } = useAuth()
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
    })
    const [validationError, setValidationError] = useState("")

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setValidationError("")

        // Client-side validation
        if (formData.password !== formData.confirmPassword) {
            setValidationError("Passwords do not match")
            return
        }

        if (formData.password.length < 8) {
            setValidationError("Password must be at least 8 characters long")
            return
        }

        await signup(formData.firstName, formData.lastName, formData.email, formData.password)
    }

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
        if (validationError) setValidationError("")
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50 px-4">
            <div className="w-full max-w-md">
                <div className="flex flex-col items-center mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <Package className="h-8 w-8" />
                        <span className="font-bold text-2xl">VectorByte</span>
                    </div>
                    <h1 className="text-3xl font-bold text-center">Create Your Account</h1>
                    <p className="text-gray-600 text-center mt-2">Join thousands of designers creating professional mockups</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl">Sign Up</CardTitle>
                        <CardDescription>Enter your information to create an account and start designing</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {(error || validationError) && (
                            <Alert className="mb-4" variant="destructive">
                                <AlertDescription>{error || validationError}</AlertDescription>
                            </Alert>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="first-name">First name</Label>
                                    <Input
                                        id="first-name"
                                        placeholder="John"
                                        value={formData.firstName}
                                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="last-name">Last name</Label>
                                    <Input
                                        id="last-name"
                                        placeholder="Doe"
                                        value={formData.lastName}
                                        onChange={(e) => handleInputChange("lastName", e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="john@example.com"
                                    value={formData.email}
                                    onChange={(e) => handleInputChange("email", e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Create a strong password"
                                    value={formData.password}
                                    onChange={(e) => handleInputChange("password", e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm Password</Label>
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    placeholder="Confirm your password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating Account...
                                    </>
                                ) : (
                                    "Create Account"
                                )}
                            </Button>
                        </form>

                        <div className="mt-6 text-center text-sm">
                            Already have an account?{" "}
                            <Link href="/login" className="underline hover:text-primary">
                                Sign in
                            </Link>
                        </div>

                        <div className="mt-4 text-center text-xs text-muted-foreground">
                            By creating an account, you agree to our{" "}
                            <Link href="/terms" className="underline hover:text-primary">
                                Terms of Service
                            </Link>{" "}
                            and{" "}
                            <Link href="/privacy" className="underline hover:text-primary">
                                Privacy Policy
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
