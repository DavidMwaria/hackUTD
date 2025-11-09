from datetime import datetime

import geopandas as gp
import matplotlib
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
import os

from shapely.geometry import Point
from adjustText import adjust_text

def quarter_start(year: int, q: int) -> datetime:
    if not 1 <= q <= 4:
        raise ValueError("Quarter must be within [1, 2, 3, 4]")

    month = [1, 4, 7, 10]
    return datetime(year, month[q - 1], 1)


def get_tile_url(service_type: str, year: int, q: int) -> str:
    dt = quarter_start(year, q)

    base_url = "https://ookla-open-data.s3-us-west-2.amazonaws.com/shapefiles/performance"
    url = f"{base_url}/type%3D{service_type}/year%3D{dt:%Y}/quarter%3D{q}/{dt:%Y-%m-%d}_performance_{service_type}_tiles.zip"
    return url

county_url = "https://www2.census.gov/geo/tiger/TIGER2019/COUNTY/tl_2019_us_county.zip" 
counties = gp.read_file(county_url)

all_counties = counties.loc[:, ["GEOID", "STATEFP", "COUNTYFP", "NAMELSAD", "geometry"]].to_crs(4326)
all_counties.head()

import pandas as pd
import geopandas as gpd
import os
import time # Optional: To track time per file

# --- A. Environment Setup ---
# Required for anonymous S3 access
os.environ['AWS_NO_SIGN_REQUEST'] = 'YES'

# --- B. Define Iteration Schedule ---
YEARS = list(range(2019, 2025)) # 2019 through 2024
QUARTERS = [1, 2, 3, 4]

# --- C. Define Fixed Columns ---
BASE_URL = "s3://ookla-open-data/parquet/performance/type=mobile/year={year}/quarter={quarter}/"
FILENAME_PATTERN = "{year}-0{start_month}-01_performance_mobile_tiles.parquet"

# Columns to pull from Parquet (MINIMUM for spatial join and attributes)
COLUMNS_TO_PULL = [
    "tile_x", "tile_y",    # Coordinates for local geometry creation
    "avg_d_kbps", "tests", "avg_u_kbps", 
    "avg_lat_ms", "avg_lat_down_ms", "avg_lat_up_ms", "devices"
]

# ❗ UPDATED: Added new normalized columns here ❗
COLUMNS_TO_SAVE = [
    "GEOID", "NAMELSAD", # Added by spatial join
    "avg_d_kbps", "norm_d_kbps", # <-- NEW
    "avg_u_kbps", "norm_u_kbps", # <-- NEW
    "tests", 
    "avg_lat_ms", "avg_lat_down_ms", "avg_lat_up_ms", "devices",
]

# --- D. Main Loop ---
for year in YEARS:
    for quarter in QUARTERS:
        
        # 1. Determine the path for the current quarter
        start_month = (quarter * 3) - 2 # Q1=1, Q2=4, Q3=7, Q4=10
        
        # Ookla file names before 2023 Q3 sometimes used a different date pattern.
        # This structure works best for the newer data and is robust.
        # We need a robust file name that handles the variable structure of Ookla data:
        if year < 2023 or (year == 2023 and quarter <= 2):
            # Use a slightly older date format for older data
             date_part = f"{year}-0{start_month}-01"
        else:
             # This is the modern format, used in your example
             date_part = f"{year}-10-01" if (year == 2024 and quarter == 4) else f"{year}-0{start_month}-01"
        
        # Handle single-digit month formatting (e.g., Q4 is 10, not 010)
        if start_month == 10:
             date_part = f"{year}-10-01"

        filename = f"{date_part}_performance_mobile_tiles.parquet"
        
        # Final S3 path
        s3_path = f"s3://ookla-open-data/parquet/performance/type=mobile/year={year}/quarter={quarter}/{filename}"
        
        output_filename = f"mobile_data_{year}_Q{quarter}.csv"
        
        print(f"\n--- Starting {year} Q{quarter} ({s3_path}) ---")
        start_time = time.time()

        try:
            # --- 2. Fast Remote Load (Parquet) ---
            df_attributes_and_coords = pd.read_parquet(
                s3_path,
                columns=COLUMNS_TO_PULL, 
                storage_options={'anon': True} 
            )

            # --- 3. Local Geometry Creation ---
            full_tiles_gdf = gpd.GeoDataFrame(
                df_attributes_and_coords.drop(columns=['tile_x', 'tile_y']), 
                geometry=gpd.points_from_xy(
                    df_attributes_and_coords['tile_x'], 
                    df_attributes_and_coords['tile_y']
                ),
                crs=4326
            )
            
            # --- 4. Spatial Join ---
            merged_data = gpd.sjoin(
                full_tiles_gdf, 
                all_counties, 
                how="inner", 
                predicate="within" 
            )

            # --- 5. NORMALIZATION CALCULATION (NEW) ---
            
            def min_max_normalize(series: pd.Series) -> pd.Series:
                """Performs Min-Max normalization on a Pandas Series."""
                min_val = series.min()
                max_val = series.max()
                # Use np.where to handle division by zero (if max == min)
                return np.where(
                    max_val != min_val, 
                    (series - min_val) / (max_val - min_val), 
                    0
                )

            # Apply normalization to the download speed (avg_d_kbps)
            merged_data['norm_d_kbps'] = min_max_normalize(merged_data['avg_d_kbps'])
            
            # Apply normalization to the upload speed (avg_u_kbps)
            merged_data['norm_u_kbps'] = min_max_normalize(merged_data['avg_u_kbps'])
            
            # --- END NORMALIZATION ---

            # --- 6. Attribute Save ---
            # Now includes the new normalized columns
            attribute_df = merged_data[COLUMNS_TO_SAVE] 
            
            # Use relative path to avoid PermissionError
            attribute_df.to_csv(f"./{output_filename}", index=False)
            
            end_time = time.time()
            print(f"✅ Success! Data saved to {output_filename}. Time: {end_time - start_time:.2f} seconds.")

        except Exception as e:
            print(f"❌ Failed to process {year} Q{quarter}. Error: {e}")
            # This continues the loop if one file fails