"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
}

export default function ColorPicker({ color, onChange }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Predefined colors
  const presetColors = [
    "#000000",
    "#ffffff",
    "#ff0000",
    "#00ff00",
    "#0000ff",
    "#ffff00",
    "#00ffff",
    "#ff00ff",
    "#c0c0c0",
    "#808080",
    "#800000",
    "#808000",
    "#008000",
    "#800080",
    "#008080",
    "#000080",
  ]

  // Draw color spectrum
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Draw hue gradient
    const hueGradient = ctx.createLinearGradient(0, 0, canvas.width, 0)
    for (let i = 0; i <= 360; i += 60) {
      hueGradient.addColorStop(i / 360, `hsl(${i}, 100%, 50%)`)
    }
    ctx.fillStyle = hueGradient
    ctx.fillRect(0, 0, canvas.width, canvas.height / 2)

    // Draw saturation/lightness gradient
    const slGradient = ctx.createLinearGradient(0, canvas.height / 2, 0, canvas.height)
    slGradient.addColorStop(0, "rgba(255, 255, 255, 1)")
    slGradient.addColorStop(0.5, "rgba(255, 255, 255, 0)")
    slGradient.addColorStop(0.5, "rgba(0, 0, 0, 0)")
    slGradient.addColorStop(1, "rgba(0, 0, 0, 1)")
    ctx.fillStyle = slGradient
    ctx.fillRect(0, canvas.height / 2, canvas.width, canvas.height / 2)
  }, [isOpen])

  // Handle canvas click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const imageData = ctx.getImageData(x, y, 1, 1).data
    const r = imageData[0]
    const g = imageData[1]
    const b = imageData[2]

    const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
    onChange(hex)
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-10 h-10 p-0" style={{ backgroundColor: color }}>
          <span className="sr-only">Pick a color</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3">
        <div className="space-y-3">
          <canvas
            ref={canvasRef}
            width={200}
            height={150}
            onClick={handleCanvasClick}
            className="w-full cursor-crosshair rounded border"
          />

          <div className="grid grid-cols-8 gap-1">
            {presetColors.map((presetColor) => (
              <button
                key={presetColor}
                className="w-6 h-6 rounded-sm border"
                style={{ backgroundColor: presetColor }}
                onClick={() => {
                  onChange(presetColor)
                  setIsOpen(false)
                }}
                aria-label={`Select color ${presetColor}`}
              />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
