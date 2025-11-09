"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Sparkles, Code2, Zap, Calculator } from "lucide-react"
import { Variants } from "framer-motion";


export function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  }

  const features = [
    {
      icon: Code2,
      title: "Built with Modern Tech",
      description: "Next.js, TypeScript, Tailwind CSS, and shadcn/ui",
    },
    {
      icon: Sparkles,
      title: "AI Implemented",
      description: "Optimized performance and best practices built-in",
    },
    {
      icon: Calculator,
      title: "Calculated Insights",
      description: "Charting and data visualization for clear understanding",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/10">
      {/* Hero Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-24">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="text-center">
          {/* Headline */}
          <motion.div variants={itemVariants} className="mb-6">
            <span className="inline-flex items-center rounded-full bg-[#E40878]/10 px-4 py-2 text-sm font-medium text-[#E40878] mb-4">
              <Sparkles className="mr-2 h-4 w-4" />
              Welcome to the future
            </span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter mb-6 text-balance"
          >
            Understand The Core
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">
              Of Business
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-balance"
          >
            Everything you need to help your users. Giving the consensus through understanding.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/dashboard">
              <Button size="lg" className="gap-2">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/overview">
              <Button size="lg" variant="outline">
                Try the Map
              </Button>
            </Link>
          </motion.div>

          {/* Features Grid */}
          <motion.div variants={containerVariants} className="grid md:grid-cols-3 gap-8 mt-20">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                  className="rounded-xl border border-border bg-card p-8 hover:shadow-lg transition-shadow"
                >
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </motion.div>
              )
            })}
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
