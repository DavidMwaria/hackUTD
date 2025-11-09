"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Menu, X, BarChart3, TrendingUp, Users, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts"

// ----------------- TYPES -----------------
interface DataPoint {
  month: string;
  happiness_index: number;
}

interface ForecastData {
  historical_data: DataPoint[];
  forecast: Record<string, number>;
}

interface CountyHappiness {
  name: string;
  value: number;
}

// ----------------- STATIC DATA -----------------
const chartData: CountyHappiness[] = [
  { name: "Harry", value: .323 },
  { name: "Collin", value: .308 },
  { name: "Jackson", value: .291 },
  { name: "Jason", value: .265 },
  { name: "Otego", value: .264 },
  { name: "Shannon", value: .0023 },
  { name: "Tarrant", value: .0013 },
  { name: "Washington", value: .0089 },
  { name: "Jefferson", value: .0016 },
  { name: "St. Louis", value: .00012 },
  { name: "Lake", value: .00093 },
]

const menuItems = [
  { icon: BarChart3, label: "Overview", href: "#" },
  { icon: TrendingUp, label: "Analytics", href: "#" },
  { icon: Users, label: "Users", href: "#" },
  { icon: Zap, label: "Performance", href: "#" },
]

// Month order for sorting
const monthOrder = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

// ----------------- COMPONENT -----------------
export function DashboardContent() {
  const [historical, setHistorical] = useState<DataPoint[]>([])
  const [forecast, setForecast] = useState<DataPoint[]>([])
  const [loading, setLoading] = useState(true)
  
  const [tableData, setTableData] = useState<CountyHappiness[]>([])
  const [chartDataState, setChartDataState] = useState<any[]>([])

  useEffect(() => {
    fetch("http://localhost:5001/api/forecast")
      .then((res) => res.json())
      .then((data: ForecastData) => {
        // Historical
        const historicalArray = data.historical_data.map(d => ({
          month: d.month,
          happiness_index: Number(d.happiness_index),
        }))
        setHistorical(historicalArray)

        // Forecast
        const forecastArray = Object.entries(data.forecast)
          .map(([month, value]) => ({
            month,
            happiness_index: Number(value),
          }))
          .sort((a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month)) // Ensure chronological order
        setForecast(forecastArray)

        // Combined chart data with separate keys for historical & forecast
        const combinedChartData = [
          ...historicalArray.map(d => ({ month: d.month, historical: d.happiness_index, forecast: null })),
          ...forecastArray.map(d => ({ month: d.month, historical: null, forecast: d.happiness_index })),
        ].sort((a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month))
        setChartDataState(combinedChartData)

        // Table data
        setTableData(chartData)

        setLoading(false)
      })
      .catch(err => {
        console.error("Error fetching forecast:", err)
        setLoading(false)
      })
  }, [])

  const bottomCounties: CountyHappiness[] = [...tableData].sort((a, b) => a.value - b.value).slice(0, 5)
  const topCounties: CountyHappiness[] = [...tableData].sort((a, b) => b.value - a.value).slice(0, 5)

  const contentVariants = {
    open: { marginLeft: 256 },
    closed: { marginLeft: 0 },
  }

  return (
    <div className="flex min-h-screen bg-background">
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

          {/* Bottom / Top Counties */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }} 
            className="flex gap-4"
          >
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
                      <span className="font-bold text-[#E40878]">{county.value.toFixed(5)}</span>
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
                      <span className="font-bold text-[#E40878]">{county.value.toFixed(5)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          {/* Line Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex">
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>Forecast of Customer Satisfaction</CardTitle>
                  <CardDescription>Quarterly forecast</CardDescription>
                </CardHeader>
                <CardContent className="w-full">
                  <ChartContainer config={{
                    revenue: {
                      label: "Revenue",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartDataState}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis
                          domain={[
                            (dataMin: number) => Math.floor(dataMin * 0.9),
                            (dataMax: number) => Math.ceil(dataMax * 1.1),
                          ]}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />

                        {/* Historical line */}
                        <Line
                          type="monotone"
                          dataKey="historical"
                          stroke="#ffffffff"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                          connectNulls
                        />

                        {/* Forecast line */}
                        <Line
                          type="monotone"
                          dataKey="forecast"
                          stroke="#EF4444"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                          connectNulls
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
