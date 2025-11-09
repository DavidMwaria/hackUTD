import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error

print("1️⃣ Loading dataset...")
df = pd.read_csv("county_happiness_sample.csv", parse_dates=["Date"])

print("Sorting data by county and date...")
df = df.sort_values(by=["County", "Date"])

print("2️⃣ Creating lag features...")
def create_lag_features(df, n_lags=3):
    df_list = []
    for i, (county, group) in enumerate(df.groupby("County"), 1):
        print(f"  Creating lag features for {county} ({i}/{df['County'].nunique()})")
        group = group.copy()
        for lag in range(1, n_lags + 1):
            group[f"lag_{lag}"] = group["HappinessIndex"].shift(lag)
        df_list.append(group)
    return pd.concat(df_list)

df = create_lag_features(df, n_lags=3)
df = df.dropna()
print("Lag features created.\n")

print("3️⃣ Preparing features and target...")
feature_cols = [col for col in df.columns if col.startswith("lag_")]
X = df[feature_cols]
y = df["HappinessIndex"]
X = pd.get_dummies(df["County"]).join(X)
print(f"Features shape: {X.shape}, Target shape: {y.shape}\n")

print("4️⃣ Splitting data into train and test sets...")
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)
print(f"Training samples: {X_train.shape[0]}, Testing samples: {X_test.shape[0]}\n")

print("5️⃣ Training Random Forest model...")
model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train, y_train)
print("Model training complete.\n")

print("6️⃣ Evaluating model...")
y_pred = model.predict(X_test)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
print(f"Test RMSE: {rmse:.4f}\n")

print("7️⃣ Predicting next month for each county...")
predictions = {}
for i, (county, group) in enumerate(df.groupby("County"), 1):
    print(f"  Predicting for {county} ({i}/{df['County'].nunique()})")
    last_row = group.iloc[-1]
    lag_values = last_row[[f"lag_{i}" for i in range(1, 4)]].values.reshape(1, -1)
    county_dummy = pd.get_dummies(pd.Series([county]))
    for col in [c for c in X_train.columns if "County_" in c]:
        if col not in county_dummy:
            county_dummy[col] = 0
    county_dummy = county_dummy[X_train.columns.drop(feature_cols)]
    X_next = np.hstack([county_dummy.values, lag_values])
    pred = model.predict(X_next)[0]
    predictions[county] = pred

print("\nNext month predictions per county:")
for county, pred in predictions.items():
    print(f"{county}: {pred:.3f}")
print("\nAll done!")