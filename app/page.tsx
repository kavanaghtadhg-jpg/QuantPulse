"use client";

import type { ParseResult } from "papaparse";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Search, User2 } from "lucide-react";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { adjustRating, toSeason, type ModelCoefs, type RatingProfile } from "@/lib/rating-adjust";

type CsvMovieRow = {
  genres?: string;
  title?: string;
  movie?: string;
  rating100?: string;
  avg_rating?: string;
};

type MovieCard = {
  genres: string;
  title: string;
  movie: number;
  avg_rating: number;
};

type VisibleMovieCard = MovieCard & {
  adjusted: number;
  delta: number;
  base: number;
};

const STORAGE_KEY = "profile";
const AGE_OPTIONS = [18, 25, 35, 45, 50, 56] as const;
const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const STROKE_CIRCUMFERENCE = 251.2;

const GENRE_COLORS: Record<string, string> = {
  Action: "bg-[#4a9c9c]/30 text-[#a8ece3] border-[#4a9c9c]/60",
  Drama: "bg-[#b8733b]/25 text-[#ffd6b8] border-[#d79b67]/50",
  Comedy: "bg-[#7aa66f]/30 text-[#d6f7cb] border-[#7aa66f]/50",
  "Sci-Fi": "bg-[#5378b8]/25 text-[#c8dbff] border-[#5378b8]/50",
  Thriller: "bg-[#9c5e7d]/25 text-[#ffd1e4] border-[#9c5e7d]/50",
  Romance: "bg-[#aa5f64]/25 text-[#ffd2d5] border-[#aa5f64]/50",
  Animation: "bg-[#8869b8]/25 text-[#e5d3ff] border-[#8869b8]/50",
};

const FALLBACK_MOVIES: MovieCard[] = [
  { genres: "Action", title: "The Matrix (1999)", movie: 2571, avg_rating: 90 },
  { genres: "Drama", title: "The Shawshank Redemption (1994)", movie: 318, avg_rating: 96 },
  { genres: "Comedy", title: "Toy Story (1995)", movie: 1, avg_rating: 86 },
  { genres: "Sci-Fi", title: "Interstellar (2014)", movie: 157336, avg_rating: 92 },
  { genres: "Thriller", title: "Se7en (1995)", movie: 47, avg_rating: 91 },
  { genres: "Animation", title: "Spirited Away (2001)", movie: 5618, avg_rating: 94 },
];

function safeNumber(input: unknown, fallback = 0): number {
  const parsed = Number(input);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeMovieRow(row: CsvMovieRow): MovieCard {
  return {
    genres: row.genres || "Unknown",
    title: row.title || "Untitled",
    movie: safeNumber(row.movie, 0),
    avg_rating: safeNumber(row.avg_rating ?? row.rating100, 0),
  };
}

function scoreColor(score: number): string {
  if (score >= 90) return "#4a9c9c";
  if (score >= 80) return "#7aa66f";
  if (score >= 70) return "#d49a57";
  return "#d17070";
}

function genreClass(genre: string): string {
  return GENRE_COLORS[genre] ?? "bg-white/10 text-slate-100 border-white/20";
}

export default function TempoRatePage() {
  const [movies, setMovies] = useState<MovieCard[]>([]);
  const [coefs, setCoefs] = useState<ModelCoefs>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [search, setSearch] = useState("");
  const [profile, setProfile] = useState<RatingProfile | null>(null);
  const [profileDraft, setProfileDraft] = useState<RatingProfile>({
    age_bucket: 25,
    gender: "F",
    gender_M: 0,
  });
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    try {
      const existing = localStorage.getItem(STORAGE_KEY);
      if (!existing) {
        setProfileOpen(true);
        return;
      }

      const parsed = JSON.parse(existing) as Partial<RatingProfile>;
      const age = AGE_OPTIONS.includes(parsed.age_bucket as (typeof AGE_OPTIONS)[number])
        ? (parsed.age_bucket as (typeof AGE_OPTIONS)[number])
        : 25;
      const gender = parsed.gender === "M" ? "M" : "F";
      const normalized: RatingProfile = { age_bucket: age, gender, gender_M: gender === "M" ? 1 : 0 };
      setProfile(normalized);
      setProfileDraft(normalized);
    } catch {
      setProfileOpen(true);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const [papaparseModule, coefsResponse] = await Promise.all([
          import("papaparse"),
          fetch("/model_coefs.json", { cache: "no-store" }),
        ]);

        const modelData = (await coefsResponse.json()) as Record<string, unknown>;
        const safeCoefs = Object.fromEntries(
          Object.entries(modelData).map(([key, value]) => [key, safeNumber(value, 0)]),
        );
        if (active) {
          setCoefs(safeCoefs);
        }

        const Papa = papaparseModule.default;
        Papa.parse<CsvMovieRow>("/movie_ratings_sample.csv", {
          download: true,
          header: true,
          complete: (results: ParseResult<CsvMovieRow>) => {
            if (!active) {
              return;
            }

            const parsedMovies = (results.data ?? [])
              .filter((row) => row && row.title)
              .map(normalizeMovieRow)
              .map((row) => ({ ...row, avg_rating: safeNumber(row.avg_rating, 0) }));

            setMovies(parsedMovies.length ? parsedMovies : FALLBACK_MOVIES);
            setIsLoading(false);
          },
          error: () => {
            if (!active) {
              return;
            }
            setMovies(FALLBACK_MOVIES);
            setIsLoading(false);
          },
        });
      } catch {
        if (!active) {
          return;
        }
        setMovies(FALLBACK_MOVIES);
        setCoefs({ hour: 0, weekday: 0, season: 0, age_bucket: 0, gender_M: 0, intercept: 0 });
        setIsLoading(false);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, []);

  const now = new Date();
  const liveHour = now.getHours();
  const liveWeekday = now.getDay();
  const liveSeason = toSeason(now.getMonth() + 1);

  const genres = useMemo(() => {
    const unique = Array.from(new Set(movies.map((movie) => movie.genres))).sort();
    return ["All", ...unique];
  }, [movies]);

  const visibleMovies = useMemo<VisibleMovieCard[]>(() => {
    const activeProfile = profile ?? profileDraft;
    const normalizedSearch = search.trim().toLowerCase();

    return movies
      .filter((movie) => selectedGenre === "All" || movie.genres === selectedGenre)
      .filter((movie) => movie.title.toLowerCase().includes(normalizedSearch))
      .map((movie) => {
        const { adjusted, delta, base } = adjustRating({
          row: movie,
          coefs,
          profile: activeProfile,
          hour: liveHour,
          weekday: liveWeekday,
          season: liveSeason,
        });
        return { ...movie, adjusted, delta, base };
      })
      .sort((a, b) => b.adjusted - a.adjusted);
  }, [coefs, liveHour, liveSeason, liveWeekday, movies, profile, profileDraft, search, selectedGenre]);

  function saveProfile() {
    const gender = profileDraft.gender === "M" ? "M" : "F";
    const normalized: RatingProfile = {
      age_bucket: AGE_OPTIONS.includes(profileDraft.age_bucket as (typeof AGE_OPTIONS)[number])
        ? profileDraft.age_bucket
        : 25,
      gender,
      gender_M: gender === "M" ? 1 : 0,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    setProfile(normalized);
    setProfileDraft(normalized);
    setProfileOpen(false);
  }

  function startEditProfile() {
    const current = profile ?? profileDraft;
    setProfileDraft(current);
    setProfileOpen(true);
  }

  const activeProfile = profile ?? profileDraft;
  const profileLabel = `Adjusted for ${activeProfile.age_bucket} ${activeProfile.gender} | ${liveHour}:00 ${WEEKDAY_LABELS[liveWeekday]}`;

  return (
    <main className="min-h-screen bg-[#2a2a2a] px-4 py-8 font-[SF_Pro_Display,Inter,ui-sans-serif,system-ui] text-slate-100 md:px-8">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-12 top-12 h-72 w-72 rounded-full bg-[#4a9c9c]/20 blur-3xl" />
        <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-[#d49a57]/20 blur-3xl" />
      </div>

      <section className="mx-auto w-full max-w-7xl space-y-6">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-3xl border border-white/15 bg-white/5 p-5 backdrop-blur-xl"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="font-serif text-4xl tracking-tight text-white">TempoRate</h1>
              <p className="text-sm text-slate-300">Luxury minimal movie ratings with live personal adjustments</p>
            </div>
            <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
              <div className="relative min-w-[260px] md:min-w-[340px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search titles"
                  className="h-10 rounded-xl border-white/20 bg-black/20 pl-9 text-slate-100 placeholder:text-slate-400"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-10 rounded-xl border-white/20 bg-black/20 text-slate-100 hover:bg-white/10"
                  >
                    <User2 className="h-4 w-4" />
                    Profile
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={startEditProfile}>Edit profile</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="mt-4">
            <Badge className="rounded-full border-[#4a9c9c]/60 bg-[#4a9c9c]/20 px-3 py-1 text-xs text-[#c6f3ec]">
              {profileLabel}
            </Badge>
          </div>
        </motion.header>

        <section className="rounded-3xl border border-white/15 bg-white/5 p-4 backdrop-blur-xl">
          <Tabs value={selectedGenre} onValueChange={setSelectedGenre}>
            <TabsList className="h-auto w-full flex-wrap justify-start gap-2 rounded-xl bg-black/20 p-2">
              {genres.map((genre) => (
                <TabsTrigger
                  key={genre}
                  value={genre}
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-wide text-slate-200 data-[state=active]:border-[#d49a57]/50 data-[state=active]:bg-[#d49a57]/20 data-[state=active]:text-[#ffe7cf]"
                >
                  {genre}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </section>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {isLoading &&
            Array.from({ length: 6 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="h-[520px] animate-pulse rounded-3xl border border-white/10 bg-white/5" />
            ))}

          {!isLoading &&
            visibleMovies.map((movie, index) => {
              const score = movie.adjusted;
              const delta = movie.delta;
              const stroke = Math.max(0, Math.min(STROKE_CIRCUMFERENCE, (score / 100) * STROKE_CIRCUMFERENCE));
              const ringColor = scoreColor(score);
              const posterText = encodeURIComponent(movie.title.slice(0, 8) || "Movie");
              const odd = index % 2 === 1;

              return (
                <motion.article
                  key={`${movie.movie}-${movie.title}`}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.025 }}
                  className={[
                    "group relative overflow-hidden rounded-[28px] border border-white/15 bg-white/5 p-4 backdrop-blur-xl transition duration-300",
                    odd ? "md:translate-y-4" : "",
                    "hover:scale-[1.05] hover:border-amber-400/50",
                  ].join(" ")}
                >
                  <div className="pointer-events-none absolute -right-14 -top-10 h-40 w-40 rounded-full bg-[#4a9c9c]/20 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-[#d49a57]/20 blur-3xl" />

                  <div className="relative flex gap-4">
                    <div className="relative w-[42%] overflow-hidden rounded-2xl border border-white/10">
                      <Image
                        src={`https://via.placeholder.com/300x450/4a9c9c/000?text=${posterText}`}
                        alt={`${movie.title} poster`}
                        width={300}
                        height={450}
                        className="h-full w-full object-cover"
                        unoptimized
                      />
                    </div>

                    <div className="flex flex-1 flex-col justify-between gap-3">
                      <div>
                        <h2 className="line-clamp-2 text-lg font-semibold text-white">{movie.title}</h2>
                        <Badge className={`mt-2 rounded-full border px-3 py-1 text-[11px] ${genreClass(movie.genres)}`}>
                          {movie.genres}
                        </Badge>
                      </div>

                      <div
                        className="rounded-2xl border border-white/15 bg-black/25 p-3"
                        data-tooltip-id="score-tooltip"
                        data-tooltip-content={`Base ${movie.base.toFixed(0)} • Delta ${delta >= 0 ? "+" : ""}${delta.toFixed(1)}`}
                      >
                        <div className="flex items-center gap-3">
                          <svg width="98" height="98" viewBox="0 0 100 100" aria-label="Adjusted score ring">
                            <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.16)" strokeWidth="8" fill="none" />
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              stroke={ringColor}
                              strokeWidth="8"
                              fill="none"
                              strokeDasharray={`${stroke} ${STROKE_CIRCUMFERENCE - stroke}`}
                              strokeLinecap="round"
                              transform="rotate(-90 50 50)"
                            />
                          </svg>
                          <div>
                            <p className="text-2xl font-semibold leading-none text-white">{score.toFixed(0)}/100</p>
                            <p className={`mt-1 text-xs ${delta >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                              {delta >= 0 ? "+" : ""}
                              {delta.toFixed(1)} adjusted
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })}
        </section>
      </section>

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="border-white/20 bg-[#2a2a2a]/95">
          <DialogHeader>
            <DialogTitle>Set your profile</DialogTitle>
            <DialogDescription>We personalize scores by age and gender for contextual ranking.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-3">
            <div className="space-y-2">
              <p className="text-sm text-slate-300">Age bucket</p>
              <div className="flex flex-wrap gap-2">
                {AGE_OPTIONS.map((age) => (
                  <Button
                    key={age}
                    variant={profileDraft.age_bucket === age ? "default" : "outline"}
                    className={
                      profileDraft.age_bucket === age
                        ? "rounded-full bg-[#4a9c9c] text-[#102423] hover:bg-[#62b8b8]"
                        : "rounded-full border-white/20 bg-transparent text-slate-100 hover:bg-white/10"
                    }
                    onClick={() => setProfileDraft((prev) => ({ ...prev, age_bucket: age }))}
                  >
                    {age}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-slate-300">Gender</p>
              <div className="flex gap-2">
                {(["M", "F"] as const).map((gender) => (
                  <Button
                    key={gender}
                    variant={profileDraft.gender === gender ? "default" : "outline"}
                    className={
                      profileDraft.gender === gender
                        ? "rounded-full bg-[#d49a57] text-[#2a1b06] hover:bg-[#e9af6d]"
                        : "rounded-full border-white/20 bg-transparent text-slate-100 hover:bg-white/10"
                    }
                    onClick={() =>
                      setProfileDraft((prev) => ({ ...prev, gender, gender_M: gender === "M" ? 1 : 0 }))
                    }
                  >
                    {gender}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button className="rounded-xl bg-[#4a9c9c] text-[#102423] hover:bg-[#62b8b8]" onClick={saveProfile}>
              Save profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Tooltip
        id="score-tooltip"
        className="!rounded-md !border !border-white/20 !bg-black/85 !px-2 !py-1 !text-xs !text-slate-100"
        opacity={1}
      />
    </main>
  );
}
