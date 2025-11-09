'use client'; 

import { useEffect, useState, useCallback } from "react";
import NorthAmericaMap from "@/components/pages/overview";
import * as d3 from 'd3';

// --- TYPE DEFINITIONS ---
// Define the structure of a single row returned by your Flask API
interface ApiRow {
    GEOID: string;
    avg_d_kbps: number;
    norm_d_kbps: number;
    norm_u_kbps: number;
    // Include all other attributes you might need, like NAMELSAD, tests, etc.
}

// Data dictionary format: { GEOID: speedValue, ... }
type CountyDataDictionary = Record<string, number>;

// Configuration for the Flask API endpoint
const API_BASE_URL = 'http://localhost:5000/get-data-json';


export default function OverviewPage() {
    // State to hold the final speed data for the map
    const [countySpeedData, setCountySpeedData] = useState<CountyDataDictionary | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    
    // State to hold the user's selection
    const [selectedYear, setSelectedYear] = useState<number>(2024);
    const [selectedQuarter, setSelectedQuarter] = useState<number>(4);

    // Arrays for dropdown options
    const years = [2024, 2023, 2022, 2021, 2020, 2019];
    const quarters = [1, 2, 3, 4];


    // --- FUNCTION TO FETCH DATA FROM FLASK API ---
    // useCallback prevents unnecessary function recreation
    const fetchSpeedData = useCallback(async (year: number, quarter: number) => {
        setIsLoading(true);
        setCountySpeedData(null); // Clear previous data
        
        const url = `${API_BASE_URL}/${year}/${quarter}`;
        console.log(`Fetching data from: ${url}`);

        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`API call failed: ${response.status} ${response.statusText}`);
            }

            // Flask returns a JSON string *containing* the data object.
            // We need to parse the response text first, and then parse that text as JSON.
            // This handles the potential double-JSON encoding from Pandas->Flask.
            const rawJsonString = await response.json(); 
            const data: ApiRow[] = rawJsonString; 

            // --- DATA TRANSFORMATION ---
            const speedDictionary: CountyDataDictionary = {};
            const GEOID_PREFIX = "0500000US"; // Prefix used by your existing map component

            data.forEach((row: ApiRow) => {
                // Ensure GEOID is a string and avg_d_kbps is a number
                console.log(row.GEOID, typeof row.GEOID, typeof row.norm_d_kbps);
                let foo = row.GEOID + "";
                if ((foo).length < 5) {
                    foo = foo.padStart(5, '0');
                }
                if (foo && typeof row.norm_d_kbps === 'number') {
                    // Match the prefix required by the GeoJSON boundaries
                    const prefixedGEOID = GEOID_PREFIX + foo; 
                    
                    // We're using avg_d_kbps directly for the map color value
                    speedDictionary[prefixedGEOID] = row.norm_d_kbps; 
                }
            });

            console.log(`Successfully processed ${data.length} records.`);
            console.log(speedDictionary);
            setCountySpeedData(speedDictionary);

        } catch (error) {
            console.error("Error fetching or processing data:", error);
            alert(`Error loading data for ${year} Q${quarter}. Check console and Flask server.`);
        } finally {
            setIsLoading(false);
        }
    }, []); // Empty dependency array as this function doesn't depend on outside state

    
    // --- Initial Load and Dependency Management ---
    useEffect(() => {
        // Fetch data when the component mounts using the default selected values
        fetchSpeedData(selectedYear, selectedQuarter);
    }, [fetchSpeedData, selectedYear, selectedQuarter]); // Re-run whenever selection changes
    
    // Note: The GeoJSON file is assumed to be loaded and handled by the <NorthAmericaMap> component itself.


    // --- RENDER FUNCTION ---
    return (
        <div className="p-4">
            <h1>Mobile Network Speed Overview</h1>
            
            {/* Input Controls */}
            <div className="flex space-x-4 mb-6">
                
                <label className="flex items-center space-x-2">
                    <span>Year:</span>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="p-2 border rounded"
                    >
                        {years.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </label>

                <label className="flex items-center space-x-2">
                    <span>Quarter:</span>
                    <select
                        value={selectedQuarter}
                        onChange={(e) => setSelectedQuarter(parseInt(e.target.value))}
                        className="p-2 border rounded"
                    >
                        {quarters.map(q => (
                            <option key={q} value={q}>{`Q${q}`}</option>
                        ))}
                    </select>
                </label>
            </div>


            {/* Map and Loading State */}
            {isLoading && (
                <div className="text-blue-600 text-lg">
                    Loading data for {selectedYear} Q{selectedQuarter} from API...
                </div>
            )}
            
            {countySpeedData && (
                <NorthAmericaMap countyData={countySpeedData} forecastData={{}} />
            )}
            
            {!isLoading && !countySpeedData && (
                 <div className="text-red-600 text-lg">
                    Failed to load map data. Please check console.
                </div>
            )}
        </div>
    );
}

// Original GeoJSON loading logic removed as <NorthAmericaMap> should handle its own boundaries.
// If the GeoJSON logic MUST remain here, you'd need to fetch and store it outside of the speed data logic.
