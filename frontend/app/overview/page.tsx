import NorthAmericaMap from "@/components/pages/overview"
import OverviewGlobe from "@/components/pages/overview"

export default function OverviewPage() {
  return <NorthAmericaMap countyData={{
    "01001": 0.2,
    "01003": 0.5,
    "01005": 0.8,
    // Add more county data as needed
  }} />
}
