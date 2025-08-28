
// Client-side helpers to call our Express backend.
const API_BASE = "/api";

export async function generateText(prompt) {
  const res = await fetch(`${API_BASE}/generate-text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`HTTP ${res.status}: ${t}`);
  }
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Request failed");
  return data.text;
}

// NEW: Streaming with Server-Sent Events (SSE)
// Usage: streamText(prompt, { onChunk, onDone, onError })
export function streamText(prompt, { onChunk, onDone, onError } = {}) {
  const url = `${API_BASE}/stream?prompt=${encodeURIComponent(prompt)}`;
  const es = new EventSource(url);

  es.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      if (data.delta) onChunk && onChunk(data.delta);
      if (data.done) {
        onDone && onDone(data.text || "");
        es.close();
      }
      if (data.error) {
        onError && onError(new Error(data.error));
        es.close();
      }
    } catch (err) {
      onError && onError(err);
      es.close();
    }
  };

  es.onerror = () => {
    onError && onError(new Error("Stream connection error"));
    es.close();
  };

  // return unsubscribe handle
  return () => es.close();
}
