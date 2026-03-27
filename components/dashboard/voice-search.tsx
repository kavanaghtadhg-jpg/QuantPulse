"use client";

import { useSpeechContext } from "@speechly/react-client";
import { Mic, MicOff } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function VoiceSearch({ onSearch }: { onSearch: (value: string) => void }) {
  const [query, setQuery] = useState("");
  const { segment, start, stop, listening } = useSpeechContext();

  useEffect(() => {
    if (segment?.words?.length) {
      const text = segment.words.map((word) => word.value).join(" ");
      setQuery(text);
      onSearch(text);
    }
  }, [segment, onSearch]);

  const toggle = async () => {
    if (listening) {
      await stop();
      return;
    }
    await start();
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        value={query}
        onChange={(event) => {
          const value = event.target.value;
          setQuery(value);
          onSearch(value);
        }}
        placeholder="Voice or type ticker..."
      />
      <Button variant="outline" size="icon" onClick={toggle}>
        {listening ? <Mic className="size-4 text-emerald-300" /> : <MicOff className="size-4" />}
      </Button>
    </div>
  );
}
