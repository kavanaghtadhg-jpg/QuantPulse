# TempoRate

TempoRate is a full-stack movie rating experience with live personal adjustments based on profile and temporal context.
The UI follows a matte colorful glassmorphism direction with a mid-dark background, teal/amber accents, asymmetric cards, score rings, and minimal typography.

## Stack

- Next.js 15 App Router
- Tailwind CSS + shadcn/ui primitives
- Framer Motion transitions
- PapaParse loaded dynamically on the client
- Python scripts with pandas + scikit-learn for data generation

## Quick Start

```bash
npm install
pip3 install -r scripts/requirements.txt
npm run data
npm run dev
```

## Data pipeline

Run:

```bash
npm run data
```

This executes:

1. `scripts/data_extract.py`:
   - Pulls MovieLens `ratings.dat`, `users.dat`, `movies.dat` from mirrored URLs
   - Uses first successful response with `requests.get(..., timeout=10)`
   - Saves normalized raw CSVs to `public/raw/`

2. `scripts/process.py`:
   - Merges ratings/users/movies
   - Builds temporal + demographic feature set (`hour`, `weekday`, `season`, `age_bucket`, `gender_M`)
   - Trains a linear regression model and exports coefficients to `public/model_coefs.json`
   - Creates a genre-sliced top-movie sample CSV at `public/movie_ratings_sample.csv`

If remote data fetch fails, the frontend automatically uses a synthetic fallback dataset embedded in `app/page.tsx`.

## API

`/app/api/adjust/route.ts`

- `GET` and `POST` supported
- Accepts payload with `{ profile, hour, weekday, season, movie_row }`
- Loads `public/model_coefs.json` and returns computed adjusted score

## Legal note

MovieLens dataset usage is intended for research/non-commercial experimentation.
