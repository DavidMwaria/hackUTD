"use client";

import { use, useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import * as d3 from "d3";
import * as turf from "@turf/turf";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

type CountyData = Record<string, number>;

interface SelectedCounty {
  GEOID: string;
  NAME: string;
  value: number;
  centroid: [number, number]; // [lng, lat]
}

export default function MapWithConnector({ countyData }: { countyData: CountyData }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [selectedCounty, setSelectedCounty] = useState<SelectedCounty | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const infoBoxRef = useRef<HTMLDivElement>(null);
  
  // Deselect county on map click
  useEffect(() => {
  if (!map.current) return;

    const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
      const features = map.current!.queryRenderedFeatures(e.point, {
        layers: ["county-fills"],
      });

      console.log("Map clicked, features:", features);
      if (!features.length) {
        setSelectedCounty(null); // deselect when clicking off
      }
    };

    map.current.on("click", handleMapClick);

    return () => {
      map.current!.off("click", handleMapClick);
    };
  }, []);

  // Update lines on map interactions
  useEffect(() => {
    if (!map.current || !selectedCounty || !svgRef.current || !infoBoxRef.current) return;

    const svg = d3.select(svgRef.current);

    // redraw lines on every map render
    const updateLines = () => {
      console.log(selectedCounty.NAME);
      svg.selectAll("*").remove();

      const infoBoxRect = infoBoxRef.current!.getBoundingClientRect();
      const mapRect = mapContainer.current!.getBoundingClientRect();

      // project county centroid
      const point = map.current!.project(selectedCounty.centroid);

      const startX = point.x;
      const startY = point.y;

      // target points: corners of info box
      const targets = [
        [infoBoxRect.left - mapRect.left, infoBoxRect.top - mapRect.top], // top-left
        //[infoBoxRect.right - mapRect.left, infoBoxRect.top - mapRect.top], // top-right
        [infoBoxRect.left - mapRect.left, infoBoxRect.bottom - mapRect.top], // bottom-left
        //[infoBoxRect.right - mapRect.left, infoBoxRect.bottom - mapRect.top], // bottom-right
      ];

      targets.forEach(([tx, ty]) => {
        svg
          .append("line")
          .attr("x1", startX)
          .attr("y1", startY)
          .attr("x2", tx)
          .attr("y2", ty)
          .attr("stroke", "black")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "4 2");
      });
    };

    // call initially
    updateLines();

    // update lines on map move/zoom/rotate
    map.current!.on("move", updateLines);
    map.current!.on("zoom", updateLines);
    map.current!.on("rotate", updateLines);

    // cleanup listener on unmount or selection change
    return () => {
      map.current!.off("move", updateLines);
      map.current!.off("zoom", updateLines);
      map.current!.off("rotate", updateLines);
    };
  }, [selectedCounty]);
  
  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/hadentdang/cmhr7lszz003b01rx17kjdlph",
      center: [-100, 45],
      zoom: 3.5,
    });

    map.current.on("load", () => {
      map.current!.addSource("us-counties", {
        type: "geojson",
        data: "/us-counties.geojson",
      });

      const colorScale = d3.scaleSequential(d3.interpolateRdYlGn).domain([0, 1]);

      map.current!.addLayer({
        id: "county-fills",
        type: "fill",
        source: "us-counties",
        paint: {
          "fill-color": [
            "match",
            ["get", "GEO_ID"],
            ...Object.entries(countyData).flatMap(([geoid, value]) => [geoid, colorScale(value)]),
            "#ccc",
          ],
          "fill-opacity": 0.8,
        },
      });

      map.current!.addLayer({
        id: "county-borders",
        type: "line",
        source: "us-counties",
        paint: { "line-color": "#bbb", "line-width": 0.5 },
      });

      // Click handler
      // Handle clicks on the map (both on and off counties)
      map.current!.on("click", (e) => {
        const features = map.current!.queryRenderedFeatures(e.point, {
          layers: ["county-fills"],
        });

        if (features.length > 0) {
          const feature = features[0];
          const geoid = feature.properties?.GEOID as string;
          const name = feature.properties?.NAME as string;

          // Compute centroid using turf
          const centroid = turf.centroid(feature as any).geometry.coordinates as [number, number];

          const value = countyData[geoid] ?? 0;
          setSelectedCounty({ GEOID: geoid, NAME: name, value, centroid });
        } else {
          // Clicked outside any county → deselect
          setSelectedCounty(null);
        }
      });

    });
  }, [countyData]);

  // Draw dotted lines
  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // always clear existing lines first

    if (!selectedCounty || !map.current || !infoBoxRef.current) return;

    const infoBoxRect = infoBoxRef.current.getBoundingClientRect();
    const mapContainerRect = mapContainer.current!.getBoundingClientRect();

    const [lng, lat] = selectedCounty.centroid;
    const point = map.current.project([lng, lat]); // screen coordinates

    const startX = point.x;
    const startY = point.y;

    const targets = [
      [infoBoxRect.left - mapContainerRect.left, infoBoxRect.top - mapContainerRect.top],
      [infoBoxRect.left - mapContainerRect.left, infoBoxRect.bottom - mapContainerRect.top],
    ];

    targets.forEach(([tx, ty]) => {
      svg
        .append("line")
        .attr("x1", startX)
        .attr("y1", startY)
        .attr("x2", tx)
        .attr("y2", ty)
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "4 2");
    });
  }, [selectedCounty]);


  return (
    <div className="flex w-full h-screen relative">
      <div ref={mapContainer} className="flex-1 relative z-0" />
      <svg
        ref={svgRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{ zIndex: 10 }}
      />
      <div
        ref={infoBoxRef}
        className={`min-w-60 max-w-100 m-8 p-4 pb-16 border-1 border-gray-400 bg-linear-to-b from-white to-gray-50/10 absolute right-0 top-0 h-auto z-20
          transition-opacity duration-500 ease-out rounded-r-lg shadow-lg 
          ${selectedCounty ? "opacity-100" : "opacity-0"}`}
      >
        {selectedCounty ? (
          <>
            <h2 className="font-bold text-[#1869FF] text-2xl mb-2 text-center">{selectedCounty.NAME} County</h2>
            <p className="text-black font-bold text-center">Overall Sentiment:</p>
            <p className="text-black">Residents of {selectedCounty.NAME} County have mixed feelings about T-Mobile. Many appreciate the company’s affordable plans and improved 5G coverage in urban areas.</p>
            
            <p className="text-black font-bold text-center">Problems Reported:</p>
            <p className="text-black">Rural parts of the county still face frequent signal drops and slow data speeds. Some residents also mention inconsistent customer support and billing issues.</p>
            
            <p className="text-black font-bold text-center">Future Outlook:</p>
            <p className="text-black">T-Mobile’s recent promise to expand rural infrastructure has given locals cautious optimism that service reliability will improve in the coming year.</p>
            
            <p className="text-black">Value: {selectedCounty.value.toFixed(2)}</p>
          </>
        ) : (
          <p>Click a county to see details</p>
        )}
      </div>


    </div>
  );
}
