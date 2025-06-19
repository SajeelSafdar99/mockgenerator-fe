import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, Package, Coffee, ShoppingBag, Box, Palette, Sparkles, Upload, Download, Move } from "lucide-react"
import TemplateCard from "@/components/template-card"

export default function Home() {
  const templates = [
    {
      id: "box",
      name: "Product Box",
      description: "Perfect for retail packaging and product launches",
      image: "/product-box.png?key=dlz0d",
      icon: Box,
    },
    {
      id: "cup",
      name: "Coffee Cup",
      description: "Ideal for cafes, beverages, and food brands",
      image: "/cup.png?key=otyqj",
      icon: Coffee,
    },
    {
      id: "bag",
      name: "Shopping Bag",
      description: "Great for retail stores and fashion brands",
      image: "/bag.jpg?key=4ratd",
      icon: ShoppingBag,
    },
    {
      id: "container",
      name: "Food Container",
      description: "Perfect for restaurants and takeout services",
      image: "/food-container.webp?key=8z6wr",
      icon: Package,
    },
  ]

  const features = [
    {
      icon: Upload,
      title: "Upload Your Logo",
      description: "Simply upload your existing logo or designs in PNG/JPG format",
    },
    {
      icon: Move,
      title: "Drag & Position",
      description: "Drag and drop your logo to the perfect position on any packaging",
    },
    {
      icon: Palette,
      title: "Customize Colors",
      description: "Adjust brightness, contrast, and colors to match your brand",
    },
    {
      icon: Download,
      title: "Download Instantly",
      description: "Get high-quality mockups ready for presentations and marketing",
    },
  ]

  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-b from-white to-gray-50">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <div className="flex flex-col justify-center space-y-6">
              <div className="space-y-4">
                <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary">
                  ✨ Professional Mockups in Seconds
                </div>
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                  See Your Logo on
                  <span className="text-primary"> Real Packaging</span>
                </h1>
                <p className="max-w-[600px] text-gray-600 md:text-xl leading-relaxed">
                  Upload your logo and instantly visualize it on professional packaging designs. Create stunning mockups
                  for presentations, marketing, and client pitches.
                </p>
              </div>
              <div className="flex flex-col gap-3 min-[400px]:flex-row">
                <Link href="/editor">
                  <Button size="lg" className="gap-2 px-8 py-6 text-lg">
                    Start Creating Free <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/logo-designer">
                  <Button size="lg" variant="outline" className="gap-2 px-8 py-6 text-lg">
                    <Palette className="h-5 w-5" /> Design a Logo
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>✓ No signup required</span>
                <span>✓ Instant download</span>
                <span>✓ High quality</span>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative w-full max-w-[500px] aspect-square">
                <Image
                  src="/hero-section.png?key=9zdcr"
                  alt="Professional packaging mockup preview showing logo placement"
                  fill
                  className="object-contain drop-shadow-2xl"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="w-full py-16 md:py-24 bg-white">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">How It Works</h2>
              <p className="max-w-[700px] text-gray-600 md:text-xl/relaxed">
                Create professional packaging mockups in just 3 simple steps
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-4">
            {features.map((feature, index) => (
              <div key={index} className="flex flex-col items-center space-y-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <feature.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Templates Gallery Section */}
      <section id="templates" className="w-full py-16 md:py-24 bg-gray-50">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Choose Your Template</h2>
              <p className="max-w-[700px] text-gray-600 md:text-xl/relaxed">
                Select from our collection of professional packaging templates
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-2">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                id={template.id}
                name={template.name}
                description={template.description}
                image={template.image}
                Icon={template.icon}
              />
            ))}
          </div>
          <div className="flex justify-center mt-12">
            <Link href="/editor">
              <Button size="lg" className="gap-2 px-8 py-6 text-lg">
                Start Designing Now <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* AI Logo Designer CTA */}
      <section className="w-full py-16 md:py-24 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center justify-center space-y-6 text-center">
            <div className="space-y-4">
              <div className="inline-block rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-1 text-sm text-white">
                <Sparkles className="inline h-4 w-4 mr-1" />
                New Feature
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Don't Have a Logo Yet?</h2>
              <p className="max-w-[700px] text-gray-600 md:text-xl/relaxed">
                Use our built-in logo designer to create a custom logo from scratch. Add shapes, text, icons, and colors
                to build your perfect brand identity.
              </p>
            </div>
            <div className="flex flex-col gap-3 min-[400px]:flex-row">
              <Link href="/logo-designer">
                <Button
                  size="lg"
                  className="gap-2 px-8 py-6 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Palette className="h-5 w-5" /> Design Your Logo
                </Button>
              </Link>
              <Link href="/editor">
                <Button size="lg" variant="outline" className="gap-2 px-8 py-6 text-lg">
                  Skip & Use Template
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-16 md:py-24 bg-white">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Powerful Features</h2>
              <p className="max-w-[700px] text-gray-600 md:text-xl/relaxed">
                Everything you need to create professional packaging mockups
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col space-y-3">
              <h3 className="text-xl font-bold">Drag & Drop Editor</h3>
              <p className="text-gray-600">
                Easily position your logo exactly where you want it with intuitive drag and drop controls.
              </p>
            </div>
            <div className="flex flex-col space-y-3">
              <h3 className="text-xl font-bold">Smart Resize & Rotate</h3>
              <p className="text-gray-600">
                Adjust the size and angle of your logo with precision controls and real-time preview.
              </p>
            </div>
            <div className="flex flex-col space-y-3">
              <h3 className="text-xl font-bold">Multiple Templates</h3>
              <p className="text-gray-600">
                Choose from various packaging templates for different industries and product types.
              </p>
            </div>
            <div className="flex flex-col space-y-3">
              <h3 className="text-xl font-bold">Color Adjustments</h3>
              <p className="text-gray-600">
                Fine-tune brightness, contrast, hue, and saturation to match your brand perfectly.
              </p>
            </div>
            <div className="flex flex-col space-y-3">
              <h3 className="text-xl font-bold">High-Quality Export</h3>
              <p className="text-gray-600">
                Download your designs in high resolution, perfect for presentations and marketing materials.
              </p>
            </div>
            <div className="flex flex-col space-y-3">
              <h3 className="text-xl font-bold">Built-in Logo Designer</h3>
              <p className="text-gray-600">
                Create custom logos from scratch with shapes, text, icons, and professional color tools.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center justify-center space-y-6 text-center">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Ready to Create Your Mockups?
              </h2>
              <p className="max-w-[700px] md:text-xl/relaxed opacity-90">
                Join thousands of designers and business owners who use VectorByte to create professional packaging
                mockups in minutes.
              </p>
            </div>
            <div className="flex flex-col gap-3 min-[400px]:flex-row">
              <Link href="/editor">
                <Button size="lg" variant="secondary" className="gap-2 px-8 py-6 text-lg">
                  Start Creating Free <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/logo-designer">
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 px-8 py-6 text-lg border-white text-white hover:bg-white hover:text-primary"
                >
                  <Palette className="h-5 w-5" /> Try Logo Designer
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-8 bg-gray-100">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="flex items-center space-x-2">
              <Package className="h-6 w-6" />
              <span className="text-lg font-bold">VectorByte</span>
            </div>
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} VectorByte. Professional mockup generator for modern brands.
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
