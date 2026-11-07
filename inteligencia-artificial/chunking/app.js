/* Static results only. No model calls, external libraries or network requests. */
"use strict";

(() => {
  const data = window.CHUNKING_EXPERIMENT;
  const $ = (id) => document.getElementById(id);
  if (!data || !Array.isArray(data.methods) || data.methods.length === 0) {
    $("loading").textContent = "No se han encontrado los resultados. Genera la demo con scripts/build_chunking_demo.py y abre build/pages/index.html.";
    return;
  }
  const offsets = [0];
  for (const character of data.markdown) offsets.push(offsets.at(-1) + character.length);
  const sourceLength = offsets.length - 1;
  const sourceSlice = (start, end = sourceLength) => data.markdown.slice(offsets[Math.max(0, start)], offsets[Math.min(end, sourceLength)]);
  const fmt = (number, digits = 0) => new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: digits, maximumFractionDigits: digits,
  }).format(number);
  const colors = ["#dee3ff", "#ddedfc", "#dcf3e6", "#fff3cd", "#ffe6d3", "#f8dfe9", "#eedeff", "#e0f2ef"];
  let active = data.methods.find((method) => method.id === "semantic") || data.methods[0];
  let selected = 0;
  let view = "explore";

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function sourceText(chunk) { return sourceSlice(chunk.start, chunk.end); }
  function core(chunk) { return chunk.source_spans.find((span) => span.role === "core"); }
  function selectChunk(index, scroll = true) {
    selected = Math.max(0, Math.min(index, active.chunks.length - 1));
    $("chunk-select").value = String(selected);
    document.querySelectorAll("#source .source-chunk").forEach((node) => {
      node.classList.toggle("active", Number(node.dataset.chunk) === selected);
    });
    document.querySelectorAll("#source-map .map-chunk").forEach((node) => {
      node.setAttribute("aria-pressed", String(Number(node.dataset.chunk) === selected));
    });
    renderInspector();
    if (scroll) {
      const node = $("source").querySelector(`[data-chunk="${selected}"]`);
      if (node) $("source").scrollTop = node.offsetTop - $("source").offsetTop;
    }
  }
  function setView(name) {
    view = name;
    for (const section of document.querySelectorAll(".view")) section.hidden = section.id !== `view-${name}`;
    for (const button of document.querySelectorAll("[data-view]")) button.setAttribute("aria-pressed", String(button.dataset.view === name));
    $("summary-title").parentElement.hidden = name === "guide";
    if (name === "compare") renderComparison();
  }
  function selectMethod(id) {
    active = data.methods.find((method) => method.id === id) || active;
    selected = 0;
    for (const button of document.querySelectorAll(".method-button")) button.setAttribute("aria-pressed", String(button.dataset.method === id));
    $("method-description").textContent = active.description;
    $("chunk-select").replaceChildren(...active.chunks.map((_, index) => {
      const option = element("option", "", String(index + 1).padStart(2, "0"));
      option.value = String(index);
      return option;
    }));
    renderMap($("source-map"), active, (index) => selectChunk(index));
    renderSource();
    selectChunk(0, false);
    for (const row of $("metrics").children) row.classList.toggle("active", row.dataset.method === id);
    $("source").scrollTop = 0;
  }
  function renderMap(container, method, onSelect, position) {
    container.replaceChildren();
    for (const [index, chunk] of method.chunks.entries()) {
      const span = core(chunk);
      const button = element("button", "map-chunk", String(index + 1));
      button.type = "button";
      button.dataset.chunk = String(index);
      button.style.width = `${100 * (span.end - span.start) / sourceLength}%`;
      button.style.background = colors[index % colors.length];
      button.title = `Chunk ${index + 1} · ${fmt(chunk.token_count)} tokens`;
      button.setAttribute("aria-label", button.title);
      button.setAttribute("aria-pressed", String(method === active && selected === index && position === undefined));
      button.addEventListener("click", () => onSelect(index));
      container.append(button);
    }
    for (const chunk of method.chunks) for (const span of chunk.source_spans) {
      if (span.role !== "overlap") continue;
      const stripe = element("span", "map-overlap");
      stripe.style.left = `${100 * span.start / sourceLength}%`;
      stripe.style.width = `${100 * (span.end - span.start) / sourceLength}%`;
      stripe.setAttribute("aria-hidden", "true");
      container.append(stripe);
    }
    if (position !== undefined) {
      const cursor = element("span", "map-cursor");
      cursor.style.left = `${Math.min(99.8, 100 * position / sourceLength)}%`;
      cursor.setAttribute("aria-hidden", "true");
      container.append(cursor);
    }
  }
  function markedSource(start, end, overlaps) {
    const fragment = document.createDocumentFragment();
    const points = new Set([start, end]);
    for (const span of overlaps) {
      if (span.end > start && span.start < end) {
        points.add(Math.max(start, span.start)); points.add(Math.min(end, span.end));
      }
    }
    const sorted = [...points].sort((a, b) => a - b);
    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i], b = sorted[i + 1];
      const borrowed = overlaps.some((span) => span.start <= a && span.end >= b);
      const text = sourceSlice(a, b);
      fragment.append(borrowed ? element("span", "borrowed", text) : document.createTextNode(text));
    }
    return fragment;
  }
  function renderSource() {
    const overlaps = active.chunks.flatMap((chunk) => chunk.source_spans.filter((span) => span.role === "overlap"));
    const children = active.chunks.map((chunk, index) => {
      const span = core(chunk);
      const section = element("section", "source-chunk");
      section.dataset.chunk = String(index);
      section.style.setProperty("--chunk-bg", index % 2 === 0 ? "#f5f7fb" : "#fbfcff");
      const label = element("button", "chunk-label", `Chunk ${index + 1}`);
      label.type = "button";
      label.setAttribute("aria-label", `Seleccionar chunk ${index + 1}`);
      const text = element("div", "source-text");
      text.append(markedSource(span.start, span.end, overlaps));
      section.append(label, text);
      section.addEventListener("click", () => selectChunk(index, false));
      return section;
    });
    $("source").replaceChildren(...children);
  }
  function renderInspector() {
    const chunk = active.chunks[selected];
    if (!chunk) return;
    const counter = element("p", "chunk-counter", `${String(selected + 1).padStart(2, "0")} / ${String(active.chunks.length).padStart(2, "0")}`);
    const facts = element("dl", "chunk-facts");
    for (const [label, value] of [["Tokens", fmt(chunk.token_count)], ["Método", chunk.split_method], ["Análisis", chunk.analysis_mode], ["Solapamiento", `${fmt(chunk.overlap_tokens)} tokens`]]) {
      const row = element("div"); row.append(element("dt", "", label), element("dd", "", String(value))); facts.append(row);
    }
    const preview = element("pre", "inspector-text", sourceText(chunk).slice(0, 650));
    const details = element("details");
    details.append(element("summary", "", "Ver fragmento completo"), element("pre", "inspector-text", sourceText(chunk)));
    const offsets = element("p", "span-note", `Caracteres ${fmt(chunk.start)}–${fmt(chunk.end)}. Intervalo con final excluido.`);
    $("inspector").replaceChildren(counter, facts, preview, details, offsets);
  }
  function renderMetrics() {
    $("metrics").replaceChildren(...data.methods.map((method, index) => {
      const row = element("tr"); row.dataset.method = method.id;
      const label = element("td");
      const button = element("button", "table-link", `${String(index + 1).padStart(2, "0")}  ${method.label}`);
      button.type = "button";
      button.addEventListener("click", () => { selectMethod(method.id); setView("explore"); });
      label.append(button); row.append(label);
      const metrics = method.metrics;
      for (const value of [fmt(metrics.count), fmt(metrics.mean_tokens, 1), `${fmt(metrics.min_tokens)} / ${fmt(metrics.max_tokens)}`, `${fmt(metrics.redundancy_percent, 1)} %`]) row.append(element("td", "", value));
      return row;
    }));
  }
  function renderComparison() {
    const position = Math.min(Number($("position").value), sourceLength - 1);
    $("position-label").textContent = `${fmt(position)} / ${fmt(sourceLength)} caracteres`;
    $("position-context").textContent = `…${sourceSlice(Math.max(0, position - 55), position)}▏${sourceSlice(position, position + 90)}…`;
    for (const id of ["compare-a", "compare-b"]) {
      const method = data.methods.find((item) => item.id === $(id).value);
      const found = method.chunks.findIndex((chunk) => {
        const span = core(chunk); return span.start <= position && position < span.end;
      });
      const index = found < 0 ? 0 : found;
      const chunk = method.chunks[index];
      const map = element("div", "coverage-map");
      renderMap(map, method, (chosen) => {
        const span = core(method.chunks[chosen]);
        $("position").value = String(Math.floor((span.start + span.end) / 2));
        renderComparison();
      }, position);
      const stats = element("p", "compare-stat", `Chunk ${index + 1} de ${method.chunks.length} · ${fmt(chunk.token_count)} tokens · ${fmt(chunk.overlap_tokens)} tokens de overlap`);
      const text = element("pre", "comparison-text");
      text.append(document.createTextNode(sourceSlice(chunk.start, position)), element("mark", "", sourceSlice(position, position + 1)), document.createTextNode(sourceSlice(position + 1, chunk.end)));
      const parameters = element("p", "span-note", `${fmt(chunk.start)}–${fmt(chunk.end)} caracteres · ${chunk.analysis_mode}`);
      $(`${id}-content`).replaceChildren(map, stats, text, parameters);
    }
  }
  $("document-title").textContent = data.document.title;
  $("document-meta").textContent = `${fmt(data.methods[0].metrics.source_tokens)} tokens · Mismo Markdown para todas las técnicas`;
  $("methods").replaceChildren(...data.methods.map((method, index) => {
    const button = element("button", "method-button"); button.type = "button";
    button.dataset.method = method.id;
    button.append(element("span", "method-number", String(index + 1).padStart(2, "0")), element("span", "", method.label));
    button.addEventListener("click", () => selectMethod(method.id));
    return button;
  }));
  $("technique-notes").replaceChildren(...data.methods.map((method) => {
    const section = element("section", "technique-note");
    section.append(element("h3", "", method.label), element("p", "", method.description));
    return section;
  }));
  $("extraction-note").textContent = data.document.extraction_note;
  const semantic = data.methods.find((method) => method.id === "semantic");
  $("provenance").textContent = semantic
    ? `Se reutiliza la ejecución ${semantic.provenance.run}, de ${new Intl.DateTimeFormat("es-ES", { dateStyle: "long", timeZone: "Europe/Madrid" }).format(new Date(semantic.provenance.created_at))}. El modelo concreto no quedó registrado. Su huella SHA-256 coincide con la del Markdown de las otras estrategias.`
    : "Este experimento no contiene un resultado con LLM.";
  $("source-hash").textContent = `SHA-256: ${data.markdown_sha256}`;
  for (const id of ["compare-a", "compare-b"]) {
    $(id).replaceChildren(...data.methods.map((method) => { const option = element("option", "", method.label); option.value = method.id; return option; }));
    $(id).addEventListener("change", renderComparison);
  }
  $("compare-a").value = "fixed";
  $("compare-b").value = semantic ? "semantic" : data.methods.at(-1).id;
  $("position").max = String(Math.max(0, sourceLength - 1));
  $("position").value = String(Math.min(5800, sourceLength - 1));
  $("position").addEventListener("input", renderComparison);
  $("chunk-select").addEventListener("change", () => selectChunk(Number($("chunk-select").value)));
  for (const button of document.querySelectorAll("[data-view]")) button.addEventListener("click", () => setView(button.dataset.view));
  renderMetrics(); selectMethod(active.id); setView(view); $("loading").hidden = true;
})();
