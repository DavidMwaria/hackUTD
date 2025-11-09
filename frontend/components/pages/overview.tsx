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

export default function MapWithConnector({
  countyData,
  forecastData, // { [GEOID]: percentChange } e.g., 0.05 for +5%
}: {
  countyData: CountyData;
  forecastData: Record<string, number>;
}) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [selectedCounty, setSelectedCounty] = useState<SelectedCounty | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const infoBoxRef = useRef<HTMLDivElement>(null);

  const [colorByForecast, setColorByForecast] = useState(false);

  interface CountyInfo {
    overallSentiment: string;
    problemsReported: string;
    futureOutlook: string;
    value: number;
    forecastChange?: number;
  }

  const [countyInfo, setCountyInfo] = useState<CountyInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);


  // Fetch info when selectedCounty changes
  useEffect(() => {
    if (!selectedCounty) {
      setCountyInfo(null);
      return;
    }

    setLoadingInfo(true);
    fetch(`/api/county-info?geoid=${selectedCounty.GEOID}`)
      .then((res) => res.json())
      .then((data) => {
        setCountyInfo(data);
        setLoadingInfo(false);
      })
      .catch(() => {
        setCountyInfo(null);
        setLoadingInfo(false);
      });
  }, [selectedCounty]);

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

  // -------------------------
  // Initialize map
  // -------------------------
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
      
      const addCountyLayer = () => {
        const colorScale = d3.scaleSequential()
          .domain([0, 1]) // 0 = no increase, 1 = max increase
          .interpolator(d3.interpolateRgb("#ffffff", "#e40878"));

        map.current!.addLayer({
          id: "county-fills",
          type: "fill",
          source: "us-counties",
          paint: {
            "fill-color": [
              "match",
              ["get", "GEO_ID"],
              ...Object.entries(countyData).flatMap(([geoid, value]) => {
                let color: string;
                if (colorByForecast) {
                  const pct = forecastData[geoid] ?? 0;
                  color = pct >= 0 ? d3.interpolateGreens(pct) : d3.interpolateReds(-pct);
                } else {
                  color = colorScale(value);
                }
                return [geoid, color];
              }),
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
      };

      addCountyLayer();

      // Handle clicks on the map (both on and off counties)
      map.current!.on("click", (e) => {
        const features = map.current!.queryRenderedFeatures(e.point, {
          layers: ["county-fills"],
        });

        if (features.length > 0) {
          const feature = features[0];
          const geoid = feature.properties?.GEOID as string;
          const name = feature.properties?.NAME as string;

          const centroid = turf.centroid(feature as any).geometry.coordinates as [number, number];
          const value = countyData[geoid] ?? 0;
          setSelectedCounty({ GEOID: geoid, NAME: name, value, centroid });
        } else {
          setSelectedCounty(null);
        }
      });
    });
  }, [countyData]);

  // -------------------------
  // Update county colors when toggle changes
  // -------------------------
  useEffect(() => {
    if (!map.current?.getLayer("county-fills")) return;

    const colorScale = d3.scaleSequential()
      .domain([0, 1]) // 0 = no increase, 1 = max increase
      .interpolator(d3.interpolateRgb("#ffffff", "#e40878"));
    const paint: any = map.current.getPaintProperty("county-fills", "fill-color");

    map.current!.setPaintProperty(
      "county-fills",
      "fill-color",
      [
        "match",
        ["get", "GEO_ID"],
        ...Object.entries(countyData).flatMap(([geoid, value]) => {
          let color: string;
          if (colorByForecast) {
            const pct = forecastData[geoid] ?? 0;
            color = pct >= 0 ? d3.interpolateGreens(pct) : d3.interpolateReds(-pct);
          } else {
            color = colorScale(value);
          }
          return [geoid, color];
        }),
        "#ccc",
      ]
    );
  }, [colorByForecast]);

  // -------------------------
  // Draw dotted lines
  // -------------------------
  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    if (!selectedCounty || !map.current || !infoBoxRef.current) return;

    const infoBoxRect = infoBoxRef.current.getBoundingClientRect();
    const mapContainerRect = mapContainer.current!.getBoundingClientRect();
    const [lng, lat] = selectedCounty.centroid;
    const point = map.current.project([lng, lat]);

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
{/* Toggle switch */}
<div className="absolute top-4 left-4 z-30 flex items-center space-x-2">
  <span className="text-white font-semibold">Color by Value</span>
  <div
    className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
      colorByForecast ? "bg-pink-600" : "bg-gray-300"
    }`}
    onClick={() => setColorByForecast(!colorByForecast)}
  >
    <div
      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-300 ${
        colorByForecast ? "translate-x-6" : "translate-x-0"
      }`}
    />
  </div>
  <span className="text-white font-semibold">Color by Forecast</span>
</div>


      <div ref={mapContainer} className="flex-1 relative z-0" />
      <svg
        ref={svgRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{ zIndex: 10 }}
      />
      <div
  ref={infoBoxRef}
  className={`min-w-60 max-w-100 m-8 p-4 pb-16 border-1 border-gray-50 bg-black/80  absolute right-0 top-0 h-auto z-20
    transition-opacity duration-500 ease-out rounded-r-lg shadow-lg 
    ${selectedCounty ? "opacity-100" : "opacity-0"}`}
>
  {selectedCounty ? (
    <>
      <div className="p-2 bg-white/80 rounded-4xl mb-4">
        <h2 className="font-bold text-[#1869FF] text-2xl mb-2 text-center">
          {selectedCounty.NAME} County
        </h2>
      </div>

      {loadingInfo ? (
        <p className="text-white text-center">Loading info...</p>
      ) : countyInfo ? (
        <>
          {Object.entries(countyInfo).map(([title, content]) => (
            <div key={title} className="mb-4">
              <p className="text-[#E40878] font-bold text-center">{title}</p>
              <p className="text-white">{content}</p>
            </div>
          ))}
          <p className="text-white">Value: {selectedCounty.value.toFixed(2)}</p>
          {colorByForecast && (
            <p className="text-white">
              Forecast Change: {(forecastData[selectedCounty.GEOID] ?? 0) * 100}%
            </p>
          )}
        </>
      ) : (
        <p className="text-white text-center">No data available</p>
      )}
    </>
  ) : (
    <p>Click a county to see details</p>
  )}
</div>

    </div>
  );
}
