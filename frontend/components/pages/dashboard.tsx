"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Menu, X, BarChart3, TrendingUp, Users, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

const chartData = [
  { name: "Harry", value: 400 },
  { name: "Ollie", value: 300 },
  { name: "Collin", value: 200 },
  { name: "Jason", value: 278 },
  { name: "Hadent", value: 189 },
  { name: "June", value: 239 },
]
interface CountyHappiness {
  name: string;
  value: number;
}
const bottomCounties: CountyHappiness[] = chartData
  .sort((a, b) => a.value - b.value) // sort ascending
  .slice(0, 5); // take bottom 5

const topCounties: CountyHappiness[] = chartData
  .sort((a, b) => b.value - a.value) // sort ascending
  .slice(0, 5); // take bottom 5

const pieData = [
  { name: "Product A", value: 400 },
  { name: "Product B", value: 300 },
  { name: "Product C", value: 200 },
  { name: "Product D", value: 100 },
]

const COLORS = ["#7c3aed", "#06b6d4", "#f59e0b", "#ef4444"]

const menuItems = [
  { icon: BarChart3, label: "Overview", href: "#" },
  { icon: TrendingUp, label: "Analytics", href: "#" },
  { icon: Users, label: "Users", href: "#" },
  { icon: Zap, label: "Performance", href: "#" },
]

export function DashboardContent() {

  const sidebarVariants = {
    open: { width: 256, opacity: 1 },
    closed: { width: 0, opacity: 0 },
  }

  const contentVariants = {
    open: { marginLeft: 256 },
    closed: { marginLeft: 0 },
  }

  return (
    <div className="flex min-h-screen bg-background">
      
      {/* Main Content */}
      <motion.main
        variants={contentVariants}
        transition={{ duration: 0.3 }}
        className="flex-1 mt-16"
      >

        <div className="pb-16 pt-0 pl-16 pr-16 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's the county performance overview.</p>
          </div>

          {/* Stats Grid 
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            {[
              { label: "Total Revenue", value: "$45,231", change: "+12.5%" },
              { label: "Users", value: "8,429", change: "+8.2%" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -4 }}
                className="rounded-lg border border-border bg-card p-4 hover:shadow-lg transition-shadow"
              >
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold mt-2">{stat.value}</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">{stat.change}</p>
              </motion.div>
            ))}
          </motion.div>*/}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }} 
            className="flex gap-4">

          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Bottom Counties</CardTitle>
              <CardDescription>Least happy counties (By Happiness Index)</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-gray-200">
                {bottomCounties.map((county, index) => (
                  <li key={index} className="py-2 flex justify-between">
                    <span>{county.name}</span>
                    <span className="font-bold text-[#E40878]">{county.value.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
  
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Top Counties</CardTitle>
              <CardDescription>Happiest counties (By Happiness Index)</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-gray-200">
                {topCounties.map((county, index) => (
                  <li key={index} className="py-2 flex justify-between">
                    <span>{county.name}</span>
                    <span className="font-bold text-[#E40878]">{county.value.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>

          {/* Charts Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className=/*"grid grid-cols-1 lg:grid-cols-2 gap-6"*/""
          >
            
            
            {/* Line Chart */}
            <div className="flex"> {/* container stretching full width */}
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>Forecast of Customer Satisfaction</CardTitle>
                  <CardDescription>Quarterly forecast</CardDescription>
                </CardHeader>
                <CardContent className="w-full">
                  <ChartContainer
                    config={{
                      revenue: {
                        label: "Revenue",
                        color: "hsl(var(--chart-1))",
                      },
                    }}
                    className="h-80 w-full"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="var(--color-revenue)"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

          </motion.div>
        </div>
      </motion.main>
    </div>
  )
}
