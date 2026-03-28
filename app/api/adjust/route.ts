import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";

import {
  adjustRating,
  toSeason,
  type ModelCoefs,
  type MovieRatingRow,
  type RatingProfile,
} from "@/lib/rating-adjust";

type AdjustPayload = {
  profile?: Partial<RatingProfile>;
  hour?: number;
  weekday?: number;
  season?: number;
  movie_row?: Partial<MovieRatingRow>;
};

function safeNumber(input: unknown, fallback = 0): number {
  const parsed = Number(input);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function readModelCoefs(): Promise<ModelCoefs> {
  const coefsPath = path.join(process.cwd(), "public", "model_coefs.json");
  const raw = await fs.readFile(coefsPath, "utf-8");
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(parsed).map(([key, value]) => [key, safeNumber(value, 0)]),
  );
}

function normalizePayload(payload: AdjustPayload) {
  const now = new Date();
  const hour = safeNumber(payload.hour, now.getHours());
  const weekday = safeNumber(payload.weekday, now.getDay());
  const season = safeNumber(payload.season, toSeason(now.getMonth() + 1));

  const ageBucket = safeNumber(payload.profile?.age_bucket, 25);
  const gender = payload.profile?.gender === "M" ? "M" : "F";
  const profile: RatingProfile = {
    age_bucket: [18, 25, 35, 45, 50, 56].includes(ageBucket) ? ageBucket : 25,
    gender,
    gender_M: gender === "M" ? 1 : 0,
  };

  const movie_row: MovieRatingRow = {
    title: String(payload.movie_row?.title ?? "Unknown"),
    genres: String(payload.movie_row?.genres ?? "Unknown"),
    movie: safeNumber(payload.movie_row?.movie, 0),
    avg_rating: safeNumber(payload.movie_row?.avg_rating, 0),
  };

  return { hour, weekday, season, profile, movie_row };
}

async function handleAdjust(payload: AdjustPayload) {
  const coefs = await readModelCoefs();
  const normalized = normalizePayload(payload);
  const result = adjustRating({
    row: normalized.movie_row,
    coefs,
    profile: normalized.profile,
    hour: normalized.hour,
    weekday: normalized.weekday,
    season: normalized.season,
  });

  return NextResponse.json({
    ...result,
    movie_row: normalized.movie_row,
    profile: normalized.profile,
    hour: normalized.hour,
    weekday: normalized.weekday,
    season: normalized.season,
  });
}

export async function GET(req: NextRequest) {
  try {
    const payloadRaw = req.nextUrl.searchParams.get("payload");
    const payload = payloadRaw ? (JSON.parse(payloadRaw) as AdjustPayload) : {};
    return await handleAdjust(payload);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to compute adjustment", detail: (error as Error).message },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as AdjustPayload;
    return await handleAdjust(payload);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to compute adjustment", detail: (error as Error).message },
      { status: 500 },
    );
  }
}
