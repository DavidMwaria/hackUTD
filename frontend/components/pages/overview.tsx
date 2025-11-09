"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import * as d3 from "d3";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

type CountyData = Record<string, number>; // county ID -> value for coloring

interface Props {
  countyData: CountyData;
}

export default function NorthAmericaMap({ countyData }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [-100, 45], // center roughly on North America
      zoom: 3.5,
    });

    map.current.on("load", () => {
      // --------------------------
      // 1️⃣ Add US counties GeoJSON
      // --------------------------
      map.current!.addSource("us-counties", {
        type: "geojson",
        data: "/us-counties.geojson", // put this file in /public/
      });

      // --------------------------
      // 2️⃣ Prepare color scale
      // --------------------------
      const colorScale = d3.scaleSequential(d3.interpolateRdYlGn).domain([0, 1]);

      // --------------------------
      // 3️⃣ Add counties fill layer
      // --------------------------
      map.current!.addLayer({
        id: "county-fills",
        type: "fill",
        source: "us-counties",
        paint: {
          "fill-color": [
            "match",
            ["get", "GEOID"], // county identifier in GeoJSON
            ...Object.entries(countyData).flatMap(([geoid, value]) => [
              geoid,
              colorScale(value),
            ]),
            "#ccc", // default color
          ],
          "fill-opacity": 0.8,
        },
      });

      // --------------------------
      // 4️⃣ Add county borders
      // --------------------------
      map.current!.addLayer({
        id: "county-borders",
        type: "line",
        source: "us-counties",
        paint: {
          "line-color": "#444",
          "line-width": 0.5,
        },
      });

      // --------------------------
      // 5️⃣ Add Canada / Mexico borders if desired
      // --------------------------
      map.current!.addSource("north-america", {
        type: "geojson",
        data: "/north-america.geojson", // include US, Canada, Mexico
      });

      map.current!.addLayer({
        id: "country-borders",
        type: "line",
        source: "north-america",
        paint: {
          "line-color": "#222",
          "line-width": 1,
        },
      });
      

    });
  }, [countyData]);

  return <div ref={mapContainer} className="w-full h-screen" />;
}
