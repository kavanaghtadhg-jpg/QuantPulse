export type RatingProfile = {
  age_bucket: number;
  gender: "M" | "F";
  gender_M: number;
};

export type MovieRatingRow = {
  title: string;
  genres: string;
  movie: number;
  avg_rating: number;
};

export type ModelCoefs = Record<string, number>;

function safeNumber(input: unknown, fallback = 0): number {
  const parsed = Number(input);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function valueForKey(
  key: string,
  profile: RatingProfile,
  hour: number,
  weekday: number,
  season: number,
): number {
  const primitives: Record<string, number> = {
    hour: safeNumber(hour),
    weekday: safeNumber(weekday),
    season: safeNumber(season),
    age_bucket: safeNumber(profile.age_bucket),
    gender_M: safeNumber(profile.gender_M),
  };

  if (key in primitives) {
    return primitives[key] ?? 0;
  }

  // Supports one-hot columns produced by pd.get_dummies, e.g. "hour_18".
  if (key.startsWith("hour_")) {
    return hour === safeNumber(key.replace("hour_", "")) ? 1 : 0;
  }
  if (key.startsWith("weekday_")) {
    return weekday === safeNumber(key.replace("weekday_", "")) ? 1 : 0;
  }
  if (key.startsWith("season_")) {
    return season === safeNumber(key.replace("season_", "")) ? 1 : 0;
  }
  if (key.startsWith("age_bucket_")) {
    return profile.age_bucket === safeNumber(key.replace("age_bucket_", "")) ? 1 : 0;
  }
  if (key.startsWith("gender_M_")) {
    const target = safeNumber(key.replace("gender_M_", ""));
    return profile.gender_M === target ? 1 : 0;
  }

  return 0;
}

export function toSeason(monthOneIndexed: number): number {
  const month = Math.min(12, Math.max(1, safeNumber(monthOneIndexed, 1)));
  return Math.floor((month % 12) / 3) + 1;
}

export function adjustRating(args: {
  row: MovieRatingRow;
  coefs: ModelCoefs;
  profile: RatingProfile;
  hour: number;
  weekday: number;
  season: number;
}): { adjusted: number; delta: number; base: number } {
  const { row, coefs, profile, hour, weekday, season } = args;
  const base = safeNumber(row.avg_rating, 0);

  let delta = 0;
  for (const [key, value] of Object.entries(coefs)) {
    if (key === "intercept") {
      continue;
    }
    const coef = safeNumber(value, 0);
    const featureValue = valueForKey(key, profile, hour, weekday, season);
    delta += coef * featureValue;
  }

  const adjusted = Math.min(100, Math.max(0, base + delta));
  return { adjusted, delta, base };
}
