import requests
import pandas as pd

# URL of your FastAPI/Flask endpoint
url = "http://127.0.0.1:5000/api/forecast"

# Fetch the data
response = requests.get(url)
data = response.json()  # Parse JSON into a Python list/dict

# Convert historical data to DataFrame
historical_df = pd.DataFrame(data["historical_data"])
historical_df["month"] = historical_df["month"]
historical_df["happiness_index"] = historical_df["happiness_index"].astype(float)

forecast_list = [{"month": k, "happiness_index": v} for k, v in data["forecast"].items()]
forecast_df = pd.DataFrame(forecast_list)
forecast_df["month"] = pd.to_datetime(forecast_df["month"])

'''
print("Historical Data:")
print(historical_df.head())

print("\nForecast Data:")
print(forecast_df.head())
'''
