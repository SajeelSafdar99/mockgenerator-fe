"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Package, Menu, X, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function SiteHeader() {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const pathname = usePathname()
    const { user, logout, loading } = useAuth()

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen)
    }

    const handleLogout = async () => {
        await logout()
    }

    const navItems = [
        { name: "Home", path: "/" },
        { name: "Editor", path: "/editor" },
        { name: "Vector Logo Designer", path: "/logo-designer" },
        { name: "Wax Paper", path: "/wax-paper" },
    ]

    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    }

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 items-center justify-between">
                <div className="flex items-center gap-2">
                    <Link href="/" className="flex items-center gap-2">
                        <Package className="h-6 w-6" />
                        <span className="font-bold text-xl hidden sm:inline-block">VectorByte</span>
                    </Link>
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-6">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`text-sm font-medium transition-colors hover:text-primary ${
                                pathname === item.path ? "text-primary" : "text-muted-foreground"
                            }`}
                        >
                            {item.name}
                        </Link>
                    ))}

                    {/* Authentication Section */}
                    {loading ? (
                        <div className="w-8 h-8 animate-pulse bg-gray-200 rounded-full" />
                    ) : user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="text-xs">{getInitials(user.firstName, user.lastName)}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                            {user.firstName} {user.lastName}
                                        </p>
                                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link href="/login">
                                <Button variant="ghost" size="sm">
                                    Sign In
                                </Button>
                            </Link>
                            <Link href="/signup">
                                <Button size="sm">Get Started</Button>
                            </Link>
                        </div>
                    )}
                </nav>

                {/* Mobile Menu Button */}
                <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleMenu}>
                    {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
            </div>

            {/* Mobile Navigation */}
            {isMenuOpen && (
                <div className="md:hidden border-t">
                    <div className="container py-4 space-y-4">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`block py-2 text-sm font-medium transition-colors hover:text-primary ${
                                    pathname === item.path ? "text-primary" : "text-muted-foreground"
                                }`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {item.name}
                            </Link>
                        ))}

                        {/* Mobile Authentication */}
                        {loading ? (
                            <div className="w-full h-8 animate-pulse bg-gray-200 rounded" />
                        ) : user ? (
                            <div className="space-y-2 pt-2 border-t">
                                <div className="px-2 py-1">
                                    <p className="text-sm font-medium">
                                        {user.firstName} {user.lastName}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                </div>
                                <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Log out
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-2 pt-2 border-t">
                                <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                                    <Button variant="ghost" className="w-full">
                                        Sign In
                                    </Button>
                                </Link>
                                <Link href="/signup" onClick={() => setIsMenuOpen(false)}>
                                    <Button className="w-full">Get Started</Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </header>
    )
}
