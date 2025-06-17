"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles } from "lucide-react"
import { useIsMobile as useMobile } from "@/hooks/use-mobile"

interface AILogoGeneratorProps {
  onSelectLogo: (logoUrl: string) => void
}

export default function AILogoGenerator({ onSelectLogo }: AILogoGeneratorProps) {
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedLogos, setGeneratedLogos] = useState<string[]>([])

  const examplePrompts = [
    "A modern tech company logo with gradient blue colors",
    "A vintage bakery logo with wheat and rolling pin",
    "A fitness gym logo with a dumbbell silhouette",
    "A minimalist coffee shop logo with a cup icon",
    "An elegant fashion brand logo with script typography",
  ]

  const isMobile = useMobile()

  const generateLogos = () => {
    if (!prompt.trim()) return

    setIsGenerating(true)

    // Simulate AI generation with a timeout
    setTimeout(() => {
      // In a real implementation, this would call an AI API
      // For now, we'll use placeholder images that will actually display
      const newGeneratedLogos = [
        `/placeholder.svg?height=200&width=200&query=bakery logo with ${encodeURIComponent(prompt)}`,
        `/placeholder.svg?height=200&width=200&query=gym logo with ${encodeURIComponent(prompt)}`,
        `/placeholder.svg?height=200&width=200&query=tech logo with ${encodeURIComponent(prompt)}`,
        `/placeholder.svg?height=200&width=200&query=modern logo with ${encodeURIComponent(prompt)}`,
      ]

      setGeneratedLogos(newGeneratedLogos)
      setIsGenerating(false)
    }, 2000)
  }

  const setExamplePrompt = (example: string) => {
    setPrompt(example)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="ai-prompt">Describe your logo</Label>
        <Textarea
          id="ai-prompt"
          placeholder="E.g., A minimalist coffee bean logo with blue and brown colors"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-[100px]"
        />
      </div>

      <div className="space-y-2">
        <Button onClick={generateLogos} className="w-full gap-2" disabled={!prompt.trim() || isGenerating}>
          <Sparkles className="h-4 w-4" />
          {isGenerating ? "Generating..." : "Generate Logo Ideas"}
        </Button>

        <div className="text-xs text-gray-500">
          Example prompts:
          <div className="mt-1 space-y-1">
            {examplePrompts.map((example, index) => (
              <div
                key={index}
                className="cursor-pointer hover:text-primary p-1 rounded hover:bg-gray-100"
                onClick={() => setExamplePrompt(example)}
              >
                • {example}
              </div>
            ))}
          </div>
        </div>
      </div>

      {generatedLogos.length > 0 && (
        <div className="space-y-2">
          <Label>Generated Logos</Label>
          <div className="grid grid-cols-2 gap-2">
            {generatedLogos.map((url, index) => (
              <Card
                key={index}
                className="overflow-hidden cursor-pointer hover:border-primary"
                onClick={() => onSelectLogo(url)}
              >
                <CardContent className="p-2">
                  <div className="relative w-full aspect-square">
                    <Image
                      src={url || "/placeholder.svg"}
                      alt={`Generated logo ${index + 1}`}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <p className="text-xs text-center mt-2">Click to use this logo</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
