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
  const chunkIndex = window.ChunkIndex;
  const highlights = window.ChunkHighlights;
  let explorerIndex;
  const comparisonIndexes = new Map();
  let active = data.methods.find((method) => method.id === "semantic") || data.methods[0];
  let selected = 0;
  let view = "explore";

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function core(chunk) { return chunk.source_spans.find((span) => span.role === "core"); }
  function boundaryLabel(chunk) {
    if (chunk.boundary_before === "artificial") return "Corte por tamaño (reglas locales)";
    if (chunk.semantic_label && chunk.boundary_before === "semantic") return "Cambio temático (LLM)";
    if (chunk.boundary_before) return "Frontera natural de estructura o bloque";
    return "Inicio del documento";
  }
  function semanticNote(chunk, method = active) {
    if (!chunk.semantic_label) return "";
    const group = method.semantic_groups?.[chunk.semantic_group_index];
    const reason = group && chunk.size_fragment_count > 1
      ? ` Se subdivide porque el grupo tiene ${fmt(group.token_count)} tokens y el máximo es ${fmt(method.parameters.limit_tokens)}. El solapamiento solo se aplica a estas subdivisiones.`
      : " Sin solapamiento entre grupos temáticos.";
    return `Tema ${chunk.semantic_group_index + 1}: ${chunk.semantic_label}. Fragmento ${chunk.size_fragment_order} de ${chunk.size_fragment_count} del grupo temático.${reason}`;
  }
  function selectChunk(index, scroll = true) {
    selected = Math.max(0, Math.min(index, active.chunks.length - 1));
    $("chunk-select").value = String(selected);
    document.querySelectorAll("#source .source-chunk").forEach((node) => {
      node.classList.toggle("active", Number(node.dataset.chunk) === selected);
    });
    explorerIndex?.setSelected(selected);
    renderSourceHighlights();
    renderInspector();
    if (scroll) {
      const node = $("source").querySelector(".borrowed") || $("source").querySelector(`[data-chunk="${selected}"]`);
      if (node) $("source").scrollTop += node.getBoundingClientRect().top - $("source").getBoundingClientRect().top;
    }
  }
  function setView(name) {
    view = name;
    for (const section of document.querySelectorAll(".view")) section.hidden = section.id !== `view-${name}`;
    for (const button of document.querySelectorAll("[data-view]")) button.setAttribute("aria-pressed", String(button.dataset.view === name));
    $("summary-title").parentElement.hidden = name === "guide";
    if (name === "compare") renderComparison();
    if (name === "explore") explorerIndex?.reveal();
  }
  function selectMethod(id) {
    const anchor = active.chunks[selected] ? core(active.chunks[selected]).start : 0;
    active = data.methods.find((method) => method.id === id) || active;
    selected = Math.max(0, active.chunks.findIndex((chunk) => {
      const span = core(chunk); return span.start <= anchor && anchor < span.end;
    }));
    for (const button of document.querySelectorAll(".method-button")) button.setAttribute("aria-pressed", String(button.dataset.method === id));
    $("method-description").textContent = active.description;
    $("chunk-select").replaceChildren(...active.chunks.map((_, index) => {
      const option = element("option", "", String(index + 1).padStart(2, "0"));
      option.value = String(index);
      return option;
    }));
    explorerIndex = chunkIndex.create($("source-map"), active, (index) => selectChunk(index));
    renderSource();
    selectChunk(selected);
    for (const row of $("metrics").children) row.classList.toggle("active", row.dataset.method === id);
    const p = active.parameters;
    $("method-budget").replaceChildren();
    for (const [label, value] of [[p.hard_limit ? "Límite total" : "Objetivo flexible", `${fmt(p.limit_tokens)} tokens`], ["Overlap máximo", `${fmt(p.overlap_tokens)} tokens`]]) {
      $("method-budget").append(element("dt", "", label), element("dd", "", value));
    }
    $("method-warning").textContent = active.metrics.over_limit_count
      ? `${fmt(active.metrics.over_limit_count)} chunks superan el objetivo para mantener bloques completos.`
      : "Todos los chunks cumplen el límite de esta estrategia.";
  }
  function markedSource(start, end, ranges) {
    const fragment = document.createDocumentFragment();
    for (const part of highlights.segments(start, end, ranges)) {
      const text = sourceSlice(part.start, part.end);
      if (!part.kind) { fragment.append(document.createTextNode(text)); continue; }
      const mark = element("span", part.kind, text);
      mark.title = part.kind === "borrowed" ? "Solapamiento tomado del chunk anterior" : "Este texto será reutilizado por el siguiente chunk";
      fragment.append(mark);
    }
    return fragment;
  }
  function renderSourceHighlights() {
    const ranges = highlights.rangesFor(active.chunks, selected);
    for (const node of $("source").children) {
      const span = core(active.chunks[Number(node.dataset.chunk)]);
      const marked = ranges.some((range) => range.start < span.end && range.end > span.start);
      // Clear old selection marks as well as painting the current ones.
      if (marked || node.dataset.highlighted === "true") {
        node.querySelector(".source-text").replaceChildren(markedSource(span.start, span.end, ranges));
      }
      node.dataset.highlighted = String(marked);
    }
  }
  function renderSource() {
    const children = active.chunks.map((chunk, index) => {
      const span = core(chunk);
      const section = element("section", "source-chunk");
      section.dataset.chunk = String(index);
      section.style.setProperty("--chunk-bg", index % 2 === 0 ? "#f5f7fb" : "#fbfcff");
      const label = element("button", "chunk-label", `Chunk ${index + 1}`);
      label.type = "button";
      label.setAttribute("aria-label", `Seleccionar chunk ${index + 1}`);
      const text = element("div", "source-text");
      text.textContent = sourceSlice(span.start, span.end);
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
    if ("boundary_before" in chunk) {
      const row = element("div"); row.append(element("dt", "", "Inicio del chunk"), element("dd", "", boundaryLabel(chunk))); facts.append(row);
    }
    const ranges = highlights.rangesFor(active.chunks, selected);
    const preview = element("pre", "inspector-text");
    preview.append(markedSource(chunk.start, Math.min(chunk.end, chunk.start + 650), ranges));
    const details = element("details");
    const full = element("pre", "inspector-text");
    full.append(markedSource(chunk.start, chunk.end, ranges));
    details.append(element("summary", "", "Ver fragmento completo"), full);
    const sectionPath = element("p", "span-note", chunk.section_path.length
      ? `Sección: ${chunk.section_path.join(" › ")}` : "Sin una sección asignada por esta estrategia.");
    const offsets = element("p", "span-note", `Caracteres ${fmt(chunk.start)}–${fmt(chunk.end)}. Intervalo con final excluido.`);
    const topic = element("p", "span-note", semanticNote(chunk));
    topic.hidden = !chunk.semantic_label;
    $("inspector").replaceChildren(counter, topic, facts, sectionPath, preview, details, offsets);
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
      for (const value of [fmt(metrics.count), fmt(metrics.mean_tokens, 1), `${fmt(metrics.min_tokens)} / ${fmt(metrics.max_tokens)}`, `${fmt(metrics.redundancy_percent, 1)} %`, fmt(metrics.over_limit_count)]) row.append(element("td", "", value));
      return row;
    }));
  }
  function renderComparison() {
    const position = Math.min(Number($("position").value), sourceLength - 1);
    $("position-label").textContent = `${fmt(position)} / ${fmt(sourceLength)} caracteres`;
    $("position-context").textContent = `…${sourceSlice(Math.max(0, position - 55), position)}▏${sourceSlice(position, position + 90)}…`;
    const comparedMethods = ["compare-a", "compare-b"].map((id) => data.methods.find((item) => item.id === $(id).value));
    const scale = chunkIndex.sizeScale(comparedMethods);
    for (const id of ["compare-a", "compare-b"]) {
      const method = data.methods.find((item) => item.id === $(id).value);
      const found = method.chunks.findIndex((chunk) => {
        const span = core(chunk); return span.start <= position && position < span.end;
      });
      const index = found < 0 ? 0 : found;
      const chunk = method.chunks[index];
      let entry = comparisonIndexes.get(id);
      if (!entry || entry.method !== method.id || entry.scale !== scale) {
        const controller = chunkIndex.create($(`${id}-index`), method, (chosen) => {
          const span = core(method.chunks[chosen]);
          $("position").value = String(Math.floor((span.start + span.end) / 2));
          renderComparison();
        }, { label: `Chunks · ${id === "compare-a" ? "A" : "B"}`, scale });
        entry = { method: method.id, scale, controller };
        comparisonIndexes.set(id, entry);
      }
      entry.controller.setSelected(index);
      const stats = element("p", "compare-stat", `Chunk ${index + 1} de ${method.chunks.length} · ${fmt(chunk.token_count)} tokens · ${fmt(chunk.overlap_tokens)} tokens de overlap`);
      const text = element("pre", "comparison-text");
      const ranges = highlights.rangesFor(method.chunks, index);
      text.append(markedSource(chunk.start, position, ranges), element("mark", "", sourceSlice(position, position + 1)), markedSource(position + 1, chunk.end, ranges));
      const parameters = element("p", "span-note", `${fmt(chunk.start)}–${fmt(chunk.end)} caracteres · ${chunk.analysis_mode}`);
      const matches = method.chunks.filter((item) => item.start <= position && position < item.end);
      const overlapNote = element("p", "span-note", matches.length > 1
        ? `Este carácter aparece en ${matches.length} chunks (${matches.map((item) => item.index + 1).join(", ")}) por el solapamiento. Se muestra el que lo incorpora como contenido nuevo.`
        : "Este carácter aparece en un único chunk.");
      const topic = element("p", "span-note", chunk.semantic_label ? `${semanticNote(chunk, method)} ${boundaryLabel(chunk)}.` : "");
      topic.hidden = !chunk.semantic_label;
      $(`${id}-content`).replaceChildren(stats, topic, text, parameters, overlapNote);
    }
  }
  $("experiment-intro").textContent = `Explora cómo ${data.methods.length} estrategias dividen el mismo documento y qué contexto conserva cada fragmento.`;
  $("footer-methods").textContent = `Un documento, ${data.methods.length} estrategias precalculadas. La web no llama a modelos.`;
  $("source-description").textContent = data.document.source_description;
  const cfg = data.config;
  $("budget-explanation").textContent = `Tokenizador: ${data.tokenizer}. Ventanas, párrafos y recursiva: ${fmt(cfg.target_tokens)} tokens. Motor estructural: máximo ${fmt(cfg.max_tokens)}, incluido el contexto prestado; mínimo deseado ${fmt(cfg.min_tokens)} (una sección breve puede quedar por debajo). Overlap: hasta ${fmt(cfg.overlap_tokens)} tokens en ventanas y ${fmt(cfg.structural_overlap_tokens)} en estructura. La agrupación de párrafos permite superar el objetivo si un bloque indivisible es mayor.`;
  const diagnostic = data.diagnostics;
  $("diagnostics").textContent = `${fmt(diagnostic.heading_count)} encabezados Markdown y ${fmt(diagnostic.paragraph_count)} bloques separados por líneas en blanco. ${fmt(diagnostic.oversized_paragraph_count)} bloques superan el objetivo: la recursiva los divide con separadores menores; la agrupación de párrafos los conserva completos.`;
  $("method-equality").textContent = diagnostic.identical_pairs.length
    ? `Coinciden exactamente: ${diagnostic.identical_pairs.map((pair) => pair.map((id) => data.methods.find((m) => m.id === id).label).join(" y ")).join("; ")}. La coincidencia depende del documento, no de que sean el mismo algoritmo.`
    : "Todas las estrategias producen cortes diferentes en este documento.";
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
    ? semantic.provenance.execution_mode === "conversation_llm"
      ? `El agente LLM de ChatGPT analizó el Markdown íntegro el ${semantic.provenance.created_at} y registró ${semantic.semantic_groups.length} grupos temáticos. Al aplicar el máximo se obtienen ${semantic.chunks.length} chunks. Fue un análisis en la conversación de preparación, no una llamada a la API configurada ni un cálculo de embeddings. El identificador exacto del modelo no está expuesto. Se guardan las instrucciones, etiquetas y fronteras; el constructor reproduce esas decisiones y aplica las restricciones de tamaño. La huella SHA-256 verifica que todas las estrategias usan el mismo texto. No se ha evaluado la calidad de recuperación de esta segmentación.`
      : `Se reutiliza la ejecución ${semantic.provenance.run}, de ${new Intl.DateTimeFormat("es-ES", { dateStyle: "long", timeZone: "Europe/Madrid" }).format(new Date(semantic.provenance.created_at))}. ${semantic.provenance.model ? `Modelo: ${semantic.provenance.model}.` : "El modelo concreto no quedó registrado."} Su huella SHA-256 coincide con la del Markdown de las otras estrategias.`
    : "No disponible para este Markdown: no hay una ejecución semántica guardada y verificada. No se reutiliza el resultado de otro documento ni se simula un LLM con reglas.";
  $("semantic-download").hidden = !data.semantic_decisions_available;
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
