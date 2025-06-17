"use client"

import type React from "react"
import Image from "next/image"
import { Box, Coffee, Package, ShoppingBag } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useIsMobile as useMobile } from "@/hooks/use-mobile"

interface TemplateData {
  name: string
  image: string
  icon: React.ElementType
}

interface TemplateMap {
  [key: string]: TemplateData
}

interface TemplateSelectorProps {
  selectedTemplate: string
  onSelectTemplate: (templateId: string) => void
}

export default function TemplateSelector({ selectedTemplate, onSelectTemplate }: TemplateSelectorProps) {
  const isMobile = useMobile()

  const templates: TemplateMap = {
    box: {
      name: "Product Box",
      image: "/product-box.png?key=l38cn",
      icon: Box,
    },
    cup: {
      name: "Coffee Cup",
      image: "/cup.png?key=qcc5x",
      icon: Coffee,
    },
    bag: {
      name: "Shopping Bag",
      image: "/bag.jpg?key=vzk0m",
      icon: ShoppingBag,
    },
    container: {
      name: "Food Container",
      image: "/food-container.webp?key=k6x8b",
      icon: Package,
    },
  }

  return (
    <div className="p-4 border rounded-lg space-y-4">
      <h2 className="font-semibold text-lg">Templates</h2>
      <Tabs value={selectedTemplate} onValueChange={onSelectTemplate}>
        <TabsList className="grid grid-cols-4 w-full">
          {Object.entries(templates).map(([id, template]) => (
            <TabsTrigger key={id} value={id} className="flex flex-col items-center gap-1 p-2">
              <template.icon className="h-5 w-5" />
              {!isMobile && <span className="text-xs">{template.name.split(" ")[0]}</span>}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card className="overflow-hidden">
        <CardContent className="p-2">
          <div className="relative w-full aspect-video">
            <Image
              src={templates[selectedTemplate]?.image || "/placeholder.svg"}
              alt={templates[selectedTemplate]?.name || "Template"}
              fill
              className="object-contain"
            />
          </div>
          <p className="text-center text-sm mt-2">{templates[selectedTemplate]?.name}</p>
        </CardContent>
      </Card>
    </div>
  )
}
