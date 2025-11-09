import NorthAmericaMap from "@/components/pages/overview"
import OverviewGlobe from "@/components/pages/overview"

export default function OverviewPage() {
  return <NorthAmericaMap countyData={{
    "0500000US21103": 0.6,
    "01003": 0.5,
    "01005": 0.8,
    // Add more county data as needed
  }} />
}
