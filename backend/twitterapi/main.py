import os
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TWITTERAPI_KEY = os.getenv("TWITTERAPI_KEY")

@app.get("/tweets")
def get_tweets(query: str = "T-mobile", limit: int = 10):
    url = "https://api.twitterapi.io/twitter/tweet/advanced_search"
    headers = {"X-API-Key": TWITTERAPI_KEY}
    params = {
        "query": "T-Mobile OR @TMobile lang:en",
        "queryType": "Latest",
        "limit": 3,
        "fromDate": "2000-10-01",
        "toDate": "2019-11-08"
    }

    response = requests.get(url, headers=headers, params=params)

    # If the API returns something, print and return it
    print(response.status_code)
    print(response.text)

    if response.status_code != 200:
        return {"detail": f"Error fetching tweets: {response.status_code} - {response.text}"}

    return response.json()


