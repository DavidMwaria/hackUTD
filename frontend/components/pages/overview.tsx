"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import * as d3 from "d3";
import * as turf from "@turf/turf";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

type CountyData = Record<string, number>;

interface SelectedCounty {
  GEOID: string;
  NAME: string;
  value: number;
  centroid: [number, number];
}

interface ApiData {
  reasoning: string | null;
  forecast: Record<string, number> | null;
  historical_data: any[] | null;
  status: string;
  error: string | null;
  timestamp: string | null;
}

interface CountyInfo {
  overallSentiment: string;
  problemsReported: string;
  futureOutlook: string;
  value: number;
  forecastChange?: number;
}
interface ForecastResults {
  reasoning: string | null;
  forecast: Record<string, number> | null;
  historical_data: any[] | null;
  status: string;
  error: string | null;
  timestamp: string | null;
}
export default function MapWithConnector({
  countyData,
  forecastData,
}: {
  countyData: CountyData;
  forecastData: Record<string, number>;
}) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const infoBoxRef = useRef<HTMLDivElement>(null);

  const [selectedCounty, setSelectedCounty] = useState<SelectedCounty | null>(null);
  const [countyInfo, setCountyInfo] = useState<CountyInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [colorByForecast, setColorByForecast] = useState(false);
  const [apiData, setApiData] = useState<ApiData | null>(null);

  
  const [data, setData] = useState<ForecastResults | null>(null);
  const [loading, setLoading] = useState(true);

  const API_BASE = "http://localhost:5000";

  function forecastResultsToCountyInfo(results: ForecastResults): CountyInfo[] {
    if (!results.forecast || !results.historical_data) return [];

    // Get last historical value
    const lastHistorical = results.historical_data[results.historical_data.length - 1]?.happiness_index ?? 0;

    return Object.entries(results.forecast).map(([month, value]) => {
      const forecastChange = lastHistorical ? value - lastHistorical : undefined;

      // You can generate sentiment / problems / outlook based on value
      const overallSentiment = value >= 7 ? "Positive" : value >= 4 ? "Neutral" : "Negative";
      const problemsReported = value < 5 ? "High" : value < 7 ? "Medium" : "Low";
      const futureOutlook = forecastChange && forecastChange > 0 ? "Improving" :
                            forecastChange && forecastChange < 0 ? "Declining" :
                            "Stable";

      return {
        overallSentiment,
        problemsReported,
        futureOutlook,
        value,
        forecastChange,
      } as CountyInfo;
    });
  }

  // Fetch forecast on mount

    useEffect(() => {
      /*if (!selectedCounty) {
        setCountyInfo(null);
        return;
      }*/
      const fetchForecast = async () => {
        setLoadingInfo(true);
        try {
          console.log("fetch")
          const res = await fetch("http://localhost:5001/api/forecast");
          if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
          const json: ForecastResults = await res.json();
          setData(json);
          
          console.log(json);
          const reasoning = json?.reasoning
          setCountyInfo(forecastResultsToCountyInfo(json)[0]);
          console.log(reasoning);
        } catch (err) {
          setCountyInfo(null);
          console.error("Failed to fetch forecast:", err);
        } finally {
          setLoadingInfo(false);
        }
      };

      fetchForecast();
  }, []);

  // Fetch county info when selectedCounty changes
  /*useEffect(() => {
    if (!selectedCounty) {
      setCountyInfo(null);
      return;
    }

    setLoadingInfo(true);
    console.log(`${API_BASE}/api/county-info?geoid=${selectedCounty.GEOID}`)
    fetch(`${API_BASE}/api/county-info?geoid=${selectedCounty.GEOID}`)
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setCountyInfo(data);
        setLoadingInfo(false);
      })
      .catch((e) => {
        console.error(e);
        console.log("Caught in Error");
        setCountyInfo(null);
        setLoadingInfo(false);
      });
  }, [selectedCounty]);*/

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


  // Initialize Mapbox
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
        const colorScale = d3.scaleSequential().domain([0, 1]).interpolator(d3.interpolateRgb("#ffffff", "#e40878"));

        map.current!.addLayer({
          id: "county-fills",
          type: "fill",
          source: "us-counties",
          paint: {
            "fill-color": [
              "match",
              ["get", "GEO_ID"],
              ...Object.entries(countyData).flatMap(([geoid, value]) => {
                let color = colorByForecast
                  ? (forecastData[geoid] ?? 0) >= 0
                    ? d3.interpolateGreens(Math.min(forecastData[geoid] ?? 0, 1))
                    : d3.interpolateReds(Math.min(-(forecastData[geoid] ?? 0), 1))
                  : colorScale(value);
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

      map.current!.on("click", (e) => {
        const features = map.current!.queryRenderedFeatures(e.point, { layers: ["county-fills"] });
        if (features.length > 0) {
          const keys: string[] = features[0].properties ? Object.keys(features[0].properties) : [];
          console.log(keys);
          const feature = features[0];
          const geoid = feature.properties?.GEO_ID as string;
          console.log("Selected: "+ geoid);
          const name = feature.properties?.NAME as string;
          const centroid = turf.centroid(feature as any).geometry.coordinates as [number, number];
          const value = countyData[geoid] ?? 0;
          console.log("Selected: "+ name, value, centroid);
          setSelectedCounty({ GEOID: geoid, NAME: name, value, centroid });
          setCountyInfo(  {overallSentiment: "string", problemsReported: "string", futureOutlook: "string", value: value} as CountyInfo)
        } else {
          setSelectedCounty(null);
        }
      });
    });
  }, [countyData, colorByForecast]);

  // Draw dotted lines from county centroid to info box
  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    if (!selectedCounty || !map.current || !infoBoxRef.current) return;

    const infoBoxRect = infoBoxRef.current.getBoundingClientRect();
    const mapRect = mapContainer.current!.getBoundingClientRect();
    const point = map.current.project(selectedCounty.centroid);

    const startX = point.x;
    const startY = point.y;

    const targets = [
      [infoBoxRect.left - mapRect.left, infoBoxRect.top - mapRect.top],
      [infoBoxRect.left - mapRect.left, infoBoxRect.bottom - mapRect.top],
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

  // Update county colors on toggle
  useEffect(() => {
    if (!map.current?.getLayer("county-fills")) return;

    const colorScale = d3.scaleSequential().domain([0, 1]).interpolator(d3.interpolateRgb("#ffffff", "#e40878"));

    map.current!.setPaintProperty(
      "county-fills",
      "fill-color",
      [
        "match",
        ["get", "GEO_ID"],
        ...Object.entries(countyData).flatMap(([geoid, value]) => {
          let color = colorByForecast
            ? (forecastData[geoid] ?? 0) >= 0
              ? d3.interpolateGreens(Math.min(forecastData[geoid] ?? 0, 1))
              : d3.interpolateReds(Math.min(-(forecastData[geoid] ?? 0), 1))
            : colorScale(value);
          return [geoid, color];
        }),
        "#ccc",
      ]
    );
  }, [colorByForecast, countyData, forecastData]);

  return (
    <div className="flex w-full h-screen relative">
      {/* Toggle switch */}
      <div className="absolute top-4 left-4 z-30 flex items-center space-x-2">
        <span className="text-white font-semibold">Color by Value</span>
        <div
          className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${colorByForecast ? "bg-pink-600" : "bg-gray-300"}`}
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
      <svg ref={svgRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 10 }} />

      <div
        ref={infoBoxRef}
        className={`min-w-60 max-w-100 m-8 p-4 pb-16 border-1 border-gray-50 bg-black/80 absolute right-0 top-0 h-auto z-20 transition-opacity duration-500 ease-out rounded-r-lg shadow-lg ${
          selectedCounty ? "opacity-100" : "opacity-0"
        }`}
      >
        {selectedCounty ? (
          <>
            <div className="p-2 bg-white/80 rounded-4xl mb-4">
              <h2 className="font-bold text-[#1869FF] text-2xl mb-2 text-center">{selectedCounty.NAME} County</h2>
            </div>

            {loadingInfo ? (
              <p className="text-white text-center">Loading info...</p>
            ) : countyInfo ? (
              <>
                {Object.entries(countyInfo)
    // 1. Filter: Keep only the entries where the key (title) matches the desired string
    .filter(([title, content]) => title === "value")
    
    // 2. Map: Render the filtered entries
    .map(([title, content]) => (
        <div key={title} className="mb-4">
            <p className="text-4xl text-[#E40878] font-bold text-center">
                Satisfaction
            </p>
            <p className="text-white text-2xl text-center">{content.toFixed(3)}</p>
        </div>
    ))
}
                <p className="text-white"></p>
                {apiData?.reasoning && (
                  <div className="mb-4">
                    <p className="text-[#E40878] font-bold text-center">Forecast Reasoning</p>
                    <p className="text-white  text-center">{apiData.reasoning}</p>
                  </div>
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
