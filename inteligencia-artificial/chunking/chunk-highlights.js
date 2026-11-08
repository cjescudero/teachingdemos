/* Highlight ownership is relative to one selected chunk, never the whole corpus. */
"use strict";

((root) => {
  function rangesFor(chunks, index) {
    const chunk = chunks[index];
    if (!chunk) return [];
    const clip = (spans, start, end, kind) => spans
      .filter((span) => span.role === "overlap")
      .map((span) => ({ start: Math.max(start, span.start), end: Math.min(end, span.end), kind }))
      .filter((span) => span.start < span.end);
    const incoming = clip(chunk.source_spans, chunk.start, chunk.end, "borrowed");
    const next = chunks[index + 1];
    const outgoing = next ? chunk.source_spans.filter((span) => span.role === "core")
      .flatMap((span) => clip(next.source_spans, Math.max(chunk.start, span.start), Math.min(chunk.end, span.end), "reused-next")) : [];
    return [...incoming, ...outgoing];
  }

  function segments(start, end, ranges) {
    if (start >= end) return [];
    const points = new Set([start, end]);
    for (const range of ranges) {
      if (range.end > start && range.start < end) {
        points.add(Math.max(start, range.start));
        points.add(Math.min(end, range.end));
      }
    }
    const sorted = [...points].sort((a, b) => a - b);
    return sorted.slice(0, -1).map((a, i) => {
      const b = sorted[i + 1];
      return { start: a, end: b, kind: ranges.find((range) => range.start <= a && range.end >= b)?.kind || null };
    });
  }

  function panelFor(chunks, index, selected) {
    const chunk = chunks[index];
    return {
      start: chunk.start,
      end: chunk.end,
      parts: segments(chunk.start, chunk.end, index === selected ? rangesFor(chunks, index) : []),
    };
  }

  function legendFor(chunks, index) {
    if (!chunks[index]) return [];
    const kinds = new Set(panelFor(chunks, index, index).parts.map((part) => part.kind));
    return [
      { kind: null, label: "Contenido propio del chunk seleccionado", color: "var(--selected, #eef0ff)" },
      { kind: "borrowed", label: "Solapamiento tomado del anterior", color: "var(--overlap, #fff0cd)" },
      { kind: "reused-next", label: "Texto que reutilizará el siguiente", color: "var(--reused-next, #b8c9dc)" },
    ].filter((item) => kinds.has(item.kind));
  }

  root.ChunkHighlights = { rangesFor, segments, panelFor, legendFor };
})(typeof window === "undefined" ? module.exports : window);
