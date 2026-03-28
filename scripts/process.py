from __future__ import annotations

import json
from pathlib import Path

import pandas as pd
from sklearn.linear_model import LinearRegression


def main() -> None:
    root = Path(__file__).resolve().parent.parent
    raw_dir = root / "public" / "raw"
    public_dir = root / "public"
    public_dir.mkdir(parents=True, exist_ok=True)

    ratings = pd.read_csv(raw_dir / "ratings.csv").fillna(0)
    users = pd.read_csv(raw_dir / "users.csv").fillna(0)
    movies = pd.read_csv(raw_dir / "movies.csv").fillna("")

    df = ratings.merge(users, on="user").merge(movies, on="movie")

    age_map = {1: 1, 18: 18, 25: 25, 35: 35, 45: 45, 50: 50, 56: 56}
    df["age_bucket"] = df["age"].map(age_map).fillna(25)

    df["ts_dt"] = pd.to_datetime(df["ts"], unit="s", errors="coerce").fillna(
        pd.Timestamp("2000-01-01")
    )
    df["hour"] = df["ts_dt"].dt.hour.fillna(0)
    df["weekday"] = df["ts_dt"].dt.weekday.fillna(0)
    df["season"] = ((df["ts_dt"].dt.month.fillna(1) % 12) // 3 + 1).fillna(1)
    df["gender_M"] = (df["gender"] == "M").astype(int).fillna(0)

    df["rating100"] = (df["rating"].fillna(0) * 20).fillna(0)

    features = ["hour", "weekday", "season", "age_bucket", "gender_M"]
    X = pd.get_dummies(df[features].fillna(0), drop_first=True).fillna(0)
    model = LinearRegression().fit(X, df["rating100"])
    coefs = {col: round(float(c), 2) for col, c in zip(X.columns, model.coef_)}
    coefs["intercept"] = round(float(model.intercept_), 2)

    with (public_dir / "model_coefs.json").open("w", encoding="utf-8") as fp:
        json.dump(coefs, fp, indent=2)

    df["genres"] = df["genres"].fillna("Unknown").astype(str).str.split("|")
    exploded = df.explode("genres")
    exploded["genres"] = exploded["genres"].fillna("Unknown")

    sample = (
        exploded.groupby(["genres", "title", "movie"], as_index=False)["rating100"]
        .mean()
        .round(0)
        .sort_values("rating100", ascending=False)
        .groupby("genres")
        .head(100)
    )
    sample.to_csv(public_dir / "movie_ratings_sample.csv", index=False)
    print("Saved public/model_coefs.json and public/movie_ratings_sample.csv")


if __name__ == "__main__":
    main()
