"use client";

import { Mic, MicOff } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionEventLike = {
  results: {
    length: number;
    [index: number]: {
      [wordIndex: number]: { transcript: string } | undefined;
      length?: number;
    };
  };
};

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  }
}

export function VoiceSearch({ onSearch }: { onSearch: (value: string) => void }) {
  const [query, setQuery] = useState("");
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const supported = useMemo(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  }, []);

  useEffect(() => {
    if (!supported || typeof window === "undefined") {
      return;
    }

    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) {
      return;
    }

    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      const allResults = Array.from({ length: event.results.length }).map(
        (_, idx) => event.results[idx],
      );
      const text = allResults
        .map((result) => {
          const token = result?.[0];
          return token?.transcript ?? "";
        })
        .join(" ")
        .trim();

      if (!text) {
        return;
      }

      const normalized = text.toUpperCase();
      setQuery(normalized);
      onSearch(normalized);
      setVoiceError(null);
    };

    recognition.onerror = (event) => {
      setVoiceError(event?.error ? `Voice error: ${event.error}` : "Voice recognition error.");
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, [onSearch, supported]);

  const toggle = () => {
    if (!supported || !recognitionRef.current) {
      return;
    }

    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }

    try {
      setVoiceError(null);
      recognitionRef.current.start();
      setListening(true);
    } catch {
      setVoiceError("Unable to start microphone. Check browser permissions.");
      setListening(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input
          value={query}
          onChange={(event) => {
            const value = event.target.value.toUpperCase();
            setQuery(value);
            onSearch(value);
          }}
          placeholder="Voice or type ticker..."
        />
        <Button variant="outline" size="icon" onClick={toggle} disabled={!supported}>
          {listening ? <Mic className="size-4 text-emerald-300" /> : <MicOff className="size-4" />}
        </Button>
      </div>
      <p className="text-[11px] text-slate-400">
        Voice works in Chrome/Edge via Web Speech API. Fallback: type in the search bar.
      </p>
      {voiceError ? <p className="text-[11px] text-amber-300">{voiceError}</p> : null}
    </div>
  );
}
