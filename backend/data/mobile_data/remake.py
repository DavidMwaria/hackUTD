import pandas as pd
import os
import glob

# Directory where your CSV files are stored
DATA_DIR = "data"

# Pattern to match CSV files like mobile_data_2020_Q1.csv, Q2, Q3, Q4, etc.
pattern = os.path.join(DATA_DIR, "mobile_data_????_Q[1-4].csv")

# Loop through all matching CSVs
for file_path in glob.glob(pattern):
    print(f"Processing: {file_path}")
    
    # Read the CSV
    df = pd.read_csv(file_path, dtype={"GEOID": str})  # force GEOID to string
    
    # Ensure GEOID column exists
    if "GEOID" not in df.columns:
        print(f"  ⚠️ No GEOID column in {file_path}, skipping.")
        continue

    # Fix GEOID strings of length 13 by inserting a "0" after "US"
    df["GEOID"] = df["GEOID"].apply(
        lambda g: g[:g.index("US")+2] + "0" + g[g.index("US")+2:] if isinstance(g, str) and len(g) == 13 and "US" in g else g
    )

    # Save the updated file (overwrite)
    df.to_csv(file_path, index=False)
    print(f"  ✅ Updated and saved {file_path}")
