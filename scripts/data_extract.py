from __future__ import annotations

import io
from pathlib import Path
from typing import Iterable

import pandas as pd
import requests


RATINGS_URLS = [
    "https://files.grouplens.org/datasets/movielens/ml-1m/ratings.dat",
    "https://dlsun.github.io/pods/data/ml-1m/ratings.dat",
]
USERS_URLS = [
    "https://files.grouplens.org/datasets/movielens/ml-1m/users.dat",
    "https://dlsun.github.io/pods/data/ml-1m/users.dat",
]
MOVIES_URLS = [
    "https://files.grouplens.org/datasets/movielens/ml-1m/movies.dat",
    "https://dlsun.github.io/pods/data/ml-1m/movies.dat",
]


def fetch_first_success(urls: Iterable[str]) -> str:
    last_error: Exception | None = None
    for url in urls:
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            print(f"Fetched from: {url}")
            return response.text
        except Exception as error:  # noqa: BLE001 - keep fallback loop simple.
            print(f"Failed {url}: {error}")
            last_error = error

    raise RuntimeError("All mirrors failed") from last_error


def read_dat(text: str, names: list[str]) -> pd.DataFrame:
    return pd.read_csv(
        io.StringIO(text),
        sep="::",
        engine="python",
        names=names,
        encoding="latin-1",
    )


def main() -> None:
    root = Path(__file__).resolve().parent.parent
    raw_dir = root / "public" / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)

    ratings_text = fetch_first_success(RATINGS_URLS)
    users_text = fetch_first_success(USERS_URLS)
    movies_text = fetch_first_success(MOVIES_URLS)

    ratings = read_dat(ratings_text, ["user", "movie", "rating", "ts"])
    users = read_dat(users_text, ["user", "gender", "age", "occupation", "zip"])
    movies = read_dat(movies_text, ["movie", "title", "genres"])

    ratings.to_csv(raw_dir / "ratings.csv", index=False)
    users.to_csv(raw_dir / "users.csv", index=False)
    movies.to_csv(raw_dir / "movies.csv", index=False)
    print("Saved raw CSV files to public/raw/")


if __name__ == "__main__":
    main()
