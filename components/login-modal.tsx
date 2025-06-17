"use client"

import { useState, type FormEvent } from "react"
import { Package, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"

interface LoginModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export default ({open, onOpenChange, onSuccess}: LoginModalProps) => {
    const { login, signup, loading, error } = useAuth()
    const [activeTab, setActiveTab] = useState("login")
    const [loginData, setLoginData] = useState({
        email: "",
        password: "",
        rememberMe: false,
    })
    const [signupData, setSignupData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
    })
    const [validationError, setValidationError] = useState("")

    const handleLoginSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setValidationError("")

        try {
            await login(loginData.email, loginData.password, loginData.rememberMe,false)
            onOpenChange(false)
            onSuccess?.()
        } catch (error) {
            // Error is handled by the auth context
        }
    }

    const handleSignupSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setValidationError("")

        // Client-side validation
        if (signupData.password !== signupData.confirmPassword) {
            setValidationError("Passwords do not match")
            return
        }

        if (signupData.password.length < 8) {
            setValidationError("Password must be at least 8 characters long")
            return
        }

        try {
            await signup(signupData.firstName, signupData.lastName, signupData.email, signupData.password, false)
            onOpenChange(false)
            onSuccess?.()
        } catch (error) {
            // Error is handled by the auth context
        }
    }

    const handleLoginInputChange = (field: string, value: string | boolean) => {
        setLoginData((prev) => ({ ...prev, [field]: value }))
        if (error || validationError) setValidationError("")
    }

    const handleSignupInputChange = (field: string, value: string) => {
        setSignupData((prev) => ({ ...prev, [field]: value }))
        if (error || validationError) setValidationError("")
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2 justify-center mb-2">
                        <Package className="h-6 w-6" />
                        <span className="font-bold text-xl">VectorByte</span>
                    </div>
                    <DialogTitle className="text-center">Sign in to Download</DialogTitle>
                    <DialogDescription className="text-center">
                        Create an account or sign in to download your logo design
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="login">Sign In</TabsTrigger>
                        <TabsTrigger value="signup">Sign Up</TabsTrigger>
                    </TabsList>

                    <TabsContent value="login" className="space-y-4">
                        {(error || validationError) && (
                            <Alert variant="destructive">
                                <AlertDescription>{error || validationError}</AlertDescription>
                            </Alert>
                        )}

                        <form onSubmit={handleLoginSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="login-email">Email</Label>
                                <Input
                                    id="login-email"
                                    type="email"
                                    placeholder="john@example.com"
                                    value={loginData.email}
                                    onChange={(e) => handleLoginInputChange("email", e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="login-password">Password</Label>
                                <Input
                                    id="login-password"
                                    type="password"
                                    placeholder="Enter your password"
                                    value={loginData.password}
                                    onChange={(e) => handleLoginInputChange("password", e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="modal-remember"
                                        checked={loginData.rememberMe}
                                        onCheckedChange={(checked) => handleLoginInputChange("rememberMe", checked as boolean)}
                                        disabled={loading}
                                    />
                                    <Label htmlFor="modal-remember" className="text-sm font-normal">
                                        Remember me
                                    </Label>
                                </div>
                                <Link href="/forgot-password" className="text-sm underline hover:text-primary">
                                    Forgot password?
                                </Link>
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Signing In...
                                    </>
                                ) : (
                                    "Sign In"
                                )}
                            </Button>
                        </form>
                    </TabsContent>

                    <TabsContent value="signup" className="space-y-4">
                        {(error || validationError) && (
                            <Alert variant="destructive">
                                <AlertDescription>{error || validationError}</AlertDescription>
                            </Alert>
                        )}

                        <form onSubmit={handleSignupSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="signup-first-name">First name</Label>
                                    <Input
                                        id="signup-first-name"
                                        placeholder="John"
                                        value={signupData.firstName}
                                        onChange={(e) => handleSignupInputChange("firstName", e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="signup-last-name">Last name</Label>
                                    <Input
                                        id="signup-last-name"
                                        placeholder="Doe"
                                        value={signupData.lastName}
                                        onChange={(e) => handleSignupInputChange("lastName", e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="signup-email">Email</Label>
                                <Input
                                    id="signup-email"
                                    type="email"
                                    placeholder="john@example.com"
                                    value={signupData.email}
                                    onChange={(e) => handleSignupInputChange("email", e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="signup-password">Password</Label>
                                <Input
                                    id="signup-password"
                                    type="password"
                                    placeholder="Create a strong password"
                                    value={signupData.password}
                                    onChange={(e) => handleSignupInputChange("password", e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                                <Input
                                    id="signup-confirm-password"
                                    type="password"
                                    placeholder="Confirm your password"
                                    value={signupData.confirmPassword}
                                    onChange={(e) => handleSignupInputChange("confirmPassword", e.target.value)}
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

                        <div className="text-center text-xs text-muted-foreground">
                            By creating an account, you agree to our{" "}
                            <Link href="/terms" className="underline hover:text-primary">
                                Terms of Service
                            </Link>{" "}
                            and{" "}
                            <Link href="/privacy" className="underline hover:text-primary">
                                Privacy Policy
                            </Link>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
