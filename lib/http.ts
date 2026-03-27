type FetchWithTimeoutOptions = RequestInit & {
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 7000;
const DEFAULT_USER_AGENT = "QuantPulse/4.0 (+https://quantpulse.vercel.app)";

export async function fetchWithTimeout(
  url: string,
  options: FetchWithTimeoutOptions = {},
): Promise<Response> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, headers, ...init } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const mergedHeaders = new Headers(headers);
    if (!mergedHeaders.has("User-Agent")) {
      mergedHeaders.set("User-Agent", DEFAULT_USER_AGENT);
    }
    if (!mergedHeaders.has("Accept")) {
      mergedHeaders.set("Accept", "*/*");
    }

    return await fetch(url, {
      ...init,
      headers: mergedHeaders,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timed out after ${timeoutMs}ms: ${url}`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchTextWithTimeout(
  url: string,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  options: RequestInit = {},
): Promise<string | null> {
  try {
    const res = await fetchWithTimeout(url, {
      ...options,
      timeoutMs,
    });
    if (!res.ok) {
      return null;
    }
    return await res.text();
  } catch {
    return null;
  }
}
