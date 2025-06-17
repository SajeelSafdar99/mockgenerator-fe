"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { SunMedium, Contrast, RotateCcw } from "lucide-react"
import { useIsMobile as useMobile } from "@/hooks/use-mobile"

interface LogoColorAdjusterProps {
  logoUrl: string | null
  onApplyFilters: (filters: LogoFilters) => void
  initialFilters?: LogoFilters
}

interface LogoFilters {
  brightness: number
  contrast: number
  hue: number
  saturation: number
}

export default function LogoColorAdjuster({ logoUrl, onApplyFilters, initialFilters }: LogoColorAdjusterProps) {
  const [filters, setFilters] = useState<LogoFilters>(
    initialFilters || {
      brightness: 100,
      contrast: 100,
      hue: 0,
      saturation: 100,
    },
  )

  // Update filters when initialFilters change
  useEffect(() => {
    if (initialFilters) {
      setFilters(initialFilters)
    }
  }, [initialFilters])

  const updateFilter = (filter: keyof LogoFilters, value: number) => {
    const newFilters = { ...filters, [filter]: value }
    setFilters(newFilters)
    onApplyFilters(newFilters)
  }

  const resetFilters = () => {
    const defaultFilters = {
      brightness: 100,
      contrast: 100,
      hue: 0,
      saturation: 100,
    }
    setFilters(defaultFilters)
    onApplyFilters(defaultFilters)
  }

  const applyPreset = (preset: "vibrant" | "soft" | "invert" | "grayscale") => {
    let newFilters: LogoFilters

    switch (preset) {
      case "vibrant":
        newFilters = {
          brightness: 110,
          contrast: 120,
          hue: 0,
          saturation: 130,
        }
        break
      case "soft":
        newFilters = {
          brightness: 110,
          contrast: 90,
          hue: 0,
          saturation: 80,
        }
        break
      case "invert":
        newFilters = {
          brightness: 100,
          contrast: 100,
          hue: 180,
          saturation: 100,
        }
        break
      case "grayscale":
        newFilters = {
          brightness: 120,
          contrast: 110,
          hue: 0,
          saturation: 0,
        }
        break
    }

    setFilters(newFilters)
    onApplyFilters(newFilters)
  }

  // Get CSS filter string
  const getFilterStyle = (filters: LogoFilters) => {
    return `brightness(${filters.brightness}%) contrast(${filters.contrast}%) hue-rotate(${filters.hue}deg) saturate(${filters.saturation}%)`
  }

  const isMobile = useMobile()

  return (
    <div className="space-y-4">
      {logoUrl && (
        <div className="relative w-full aspect-video border rounded-lg mb-4 overflow-hidden">
          <Image
            src={logoUrl || "/placeholder.svg"}
            alt="Logo preview"
            fill
            className="object-contain"
            style={{ filter: getFilterStyle(filters) }}
          />
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm flex items-center gap-1">
              <SunMedium className="h-4 w-4" /> Brightness
            </span>
            <span className="text-sm">{filters.brightness}%</span>
          </div>
          <Slider
            value={[filters.brightness]}
            min={0}
            max={200}
            step={1}
            onValueChange={(value) => updateFilter("brightness", value[0])}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm flex items-center gap-1">
              <Contrast className="h-4 w-4" /> Contrast
            </span>
            <span className="text-sm">{filters.contrast}%</span>
          </div>
          <Slider
            value={[filters.contrast]}
            min={0}
            max={200}
            step={1}
            onValueChange={(value) => updateFilter("contrast", value[0])}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Hue Rotation</span>
            <span className="text-sm">{filters.hue}°</span>
          </div>
          <Slider
            value={[filters.hue]}
            min={0}
            max={360}
            step={1}
            onValueChange={(value) => updateFilter("hue", value[0])}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Saturation</span>
            <span className="text-sm">{filters.saturation}%</span>
          </div>
          <Slider
            value={[filters.saturation]}
            min={0}
            max={200}
            step={1}
            onValueChange={(value) => updateFilter("saturation", value[0])}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={() => applyPreset("vibrant")}>
            Vibrant
          </Button>
          <Button variant="outline" size="sm" onClick={() => applyPreset("soft")}>
            Soft
          </Button>
          <Button variant="outline" size="sm" onClick={() => applyPreset("invert")}>
            Invert Colors
          </Button>
          <Button variant="outline" size="sm" onClick={() => applyPreset("grayscale")}>
            Grayscale
          </Button>
        </div>

        <Button variant="outline" onClick={resetFilters} className="w-full gap-2 mt-2">
          <RotateCcw className="h-4 w-4" /> Reset Colors
        </Button>
      </div>
    </div>
  )
}
