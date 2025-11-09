"use client";

import { useEffect, useState } from "react";
import NorthAmericaMap from "@/components/pages/overview";

// Define the type interfaces and data structures OUTSIDE the component
type CountyData = Record<string, number>;

interface CountyFeature {
  properties: {
    GEOID: string;
    normalized_speed: number;
    // Note: If you need to add the prefix "0500000US" to the GEOID key,
    // that logic should be added within the .forEach loop.
  };
}


export default function OverviewPage() {
  const [countyData, setCountyData] = useState<CountyData | null>(null);
  useEffect(() => {
    
    fetch('/counties-with-speed.geojson') 
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to fetch GeoJSON: ${res.statusText}`);
        }
        console.log("GeoJSON fetched successfully, status:", res.status);
        return res.json();
      })
      .then(geoJson => {
        const dataDictionary: CountyData = {};
        const GEOID_PREFIX = "0500000US";
        geoJson.features.forEach((feature: CountyFeature) => {
          const { GEOID, normalized_speed } = feature.properties;
          if (GEOID && typeof normalized_speed === 'number') {
            const prefixedGEOID = GEOID_PREFIX + GEOID;
            dataDictionary[prefixedGEOID] = normalized_speed;          }
          //console.log(`Processed County - GEOID: ${GEOID}, Normalized Speed: ${normalized_speed}`);
        });
        console.log("County Data Dictionary constructed:", dataDictionary);
        setCountyData(dataDictionary);
        console.log("County Data state updated.");
      })
      .catch(error => {
        console.error("Error fetching or processing GeoJSON:", error);
      });
  }, []);

  if (countyData === null) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-xl">
        Loading County Network Speed Data...
      </div>
    );
  }

  return <NorthAmericaMap countyData={countyData} forecastData={{}} />;
}