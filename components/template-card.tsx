import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"
import { ArrowRight } from "lucide-react"

interface TemplateCardProps {
  id: string
  name: string
  description: string
  image: string
  Icon: LucideIcon
}

export default function TemplateCard({ id, name, description, image, Icon }: TemplateCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <div className="relative aspect-video w-full overflow-hidden">
        <Image
          src={image || "/placeholder.svg"}
          alt={`${name} packaging mockup template`}
          fill
          className="object-cover transition-all duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
      </div>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">{name}</CardTitle>
            <CardDescription className="text-sm text-gray-600 mt-1">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardFooter className="pt-0">
        <Link href={`/editor?template=${id}`} className="w-full">
          <Button className="w-full gap-2 group-hover:gap-3 transition-all">
            Use This Template
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
