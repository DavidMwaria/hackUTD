from flask import Flask, abort, jsonify
from flask_cors import CORS # <-- New: Import CORS
import os
import pandas as pd
import json # Used to parse Pandas JSON output

# --- Configuration ---
app = Flask(__name__)

# Enable CORS for all routes, allowing your front-end to access the API
CORS(app) 

DATA_FOLDER = 'mobile_data' 
# Resolve the full absolute path to the data directory
CSV_DIRECTORY = os.path.join(os.path.dirname(os.path.abspath(__file__)), DATA_FOLDER)


@app.route('/get-data-json/<int:year>/<int:quarter>', methods=['GET'])
def get_data_json(year, quarter):
    """
    Reads the specified CSV file using Pandas and returns the content as JSON.
    """
    
    # Input Validation
    if not (2019 <= year <= 2024 and 1 <= quarter <= 4):
        return "Invalid year or quarter provided. Must be between 2019-2024 and Q1-Q4.", 400
        
    filename = f"mobile_data_{year}_Q{quarter}.csv"
    file_path = os.path.join(CSV_DIRECTORY, filename) 
    
    if not os.path.exists(file_path):
        # 404 error if the expected file is missing
        print(f"File not found: {file_path}")
        abort(404, description=f"CSV file not found for {year} Q{quarter}: {filename}")

    try:
        # 1. Read the CSV file into a Pandas DataFrame
        df = pd.read_csv(file_path)
        
        # 2. Convert the DataFrame to JSON
        # orient='records' converts to a list of dictionaries: [{}, {}, ...]
        # This is the easiest format for TypeScript/JavaScript to consume.
        json_string = df.to_json(orient='records')
        
        # 3. Use json.loads to convert the JSON string into a Python object 
        # that jsonify() can properly serialize into the HTTP response body.
        data_object = json.loads(json_string)  # <-- Converts string to Python list/dict
        return jsonify(data_object)           # <-- Flask jsonify() converts Python list/dict to JSON response
        # 4. Return the data as a clean JSON response
        
    except Exception as e:
        app.logger.error(f"Error processing CSV {filename}: {e}")
        # 500 Internal Server Error
        return "An internal error occurred while processing the data.", 500


if __name__ == '__main__':
    # Ensure the data folder exists
    if not os.path.exists(CSV_DIRECTORY):
        os.makedirs(CSV_DIRECTORY)
        print(f"Created data directory at: {CSV_DIRECTORY}")
        
    # Run on a common port for front-end integration
    app.run(debug=True, port=5000)