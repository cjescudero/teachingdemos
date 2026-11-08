/* Shared, dependency-free chunk navigation for exploration and comparison. */
"use strict";

((root) => {
  function sizeScale(methods) {
    return Math.max(1, ...methods.flatMap((method) => [
      method.parameters.limit_tokens, ...method.chunks.map((chunk) => chunk.token_count),
    ]));
  }

  function nextIndex(index, key, count) {
    const destinations = {
      ArrowLeft: index - 1, ArrowRight: index + 1,
      Home: 0, End: count - 1, PageUp: index - 5, PageDown: index + 5,
    };
    return key in destinations && count > 0
      ? Math.max(0, Math.min(count - 1, destinations[key])) : null;
  }

  function scrollOffset(left, width, itemLeft, itemWidth, totalWidth) {
    let next = left;
    if (itemLeft < left + 8) next = itemLeft - 8;
    else if (itemLeft + itemWidth > left + width - 8) next = itemLeft + itemWidth - width + 8;
    return Math.max(0, Math.min(Math.max(0, totalWidth - width), next));
  }

  function create(container, method, onSelect, { label = "Índice de chunks", scale = sizeScale([method]) } = {}) {
    const doc = container.ownerDocument;
    const fmt = (value) => new Intl.NumberFormat("es-ES").format(value);
    const make = (tag, className, text) => {
      const node = doc.createElement(tag);
      node.className = className;
      if (text !== undefined) node.textContent = text;
      return node;
    };
    let selected = 0;
    const toolbar = make("div", "chunk-index-toolbar");
    const heading = make("strong", "chunk-index-title", label);
    const controls = make("div", "chunk-index-controls");
    const previous = make("button", "chunk-step", "← Anterior");
    const next = make("button", "chunk-step", "Siguiente →");
    const status = make("span", "chunk-index-status");
    previous.type = next.type = "button";
    previous.setAttribute("aria-label", `${label}: chunk anterior`);
    next.setAttribute("aria-label", `${label}: chunk siguiente`);
    controls.append(previous, status, next);
    toolbar.append(heading, controls);
    const track = make("div", "chunk-track");
    track.setAttribute("role", "group");
    track.setAttribute("aria-label", `${label}. Usa flechas izquierda y derecha, Inicio o Fin.`);
    const limit = method.parameters.limit_tokens;
    const buttons = method.chunks.map((chunk, index) => {
      const button = make("button", "chunk-card");
      button.type = "button";
      button.dataset.chunk = String(index);
      const exceeds = chunk.token_count > limit;
      button.classList.toggle("over-budget", exceeds);
      const name = make("span", "chunk-card-name", `Chunk ${index + 1}`);
      const check = make("span", "chunk-card-check", "✓");
      check.setAttribute("aria-hidden", "true");
      name.append(check);
      const count = make("span", "chunk-card-tokens", `${fmt(chunk.token_count)} tokens`);
      const meter = make("span", "chunk-size-bar");
      meter.setAttribute("aria-hidden", "true");
      const fill = make("span", "chunk-size-fill");
      fill.style.width = `${100 * chunk.token_count / scale}%`;
      const marker = make("span", "chunk-size-limit");
      marker.style.left = `${100 * limit / scale}%`;
      meter.append(fill, marker);
      const repeat = make("span", "chunk-card-overlap", chunk.overlap_tokens
        ? `${fmt(chunk.overlap_tokens)} t de solapamiento` : "Sin solapamiento");
      const warning = make("span", "chunk-card-warning", exceeds ? "Supera el objetivo" : "");
      const context = chunk.semantic_label || chunk.section_path?.join(" › ") || "";
      button.title = [`Chunk ${index + 1}`, `${fmt(chunk.token_count)} tokens`, context].filter(Boolean).join(" · ");
      button.setAttribute("aria-label", `${button.title}. ${repeat.textContent}.${exceeds ? " Supera el objetivo." : ""}`);
      button.append(name, count, meter, repeat, warning);
      button.addEventListener("click", () => choose(index));
      return button;
    });
    track.append(...buttons);
    const help = make("p", "chunk-index-help", `Desliza horizontalmente para explorar. Barra: 0–${fmt(scale)} tokens totales; marca: ${method.parameters.hard_limit ? "límite" : "objetivo"} de ${fmt(limit)}. Morado y ✓: seleccionado.`);
    container.classList.add("chunk-index");
    container.replaceChildren(toolbar, track, help);

    function reveal() {
      const button = buttons[selected];
      if (!button || !track.clientWidth) return;
      const itemLeft = button.getBoundingClientRect().left - track.getBoundingClientRect().left + track.scrollLeft;
      track.scrollLeft = scrollOffset(track.scrollLeft, track.clientWidth, itemLeft, button.offsetWidth, track.scrollWidth);
    }
    function setSelected(index) {
      selected = Math.max(0, Math.min(buttons.length - 1, index));
      buttons.forEach((button, i) => {
        button.setAttribute("aria-pressed", String(i === selected));
        button.tabIndex = i === selected ? 0 : -1;
      });
      previous.disabled = selected <= 0;
      next.disabled = selected >= buttons.length - 1;
      status.textContent = `${selected + 1} / ${buttons.length}`;
      reveal();
      // Also reveal after switching from a hidden view to a visible one.
      doc.defaultView.requestAnimationFrame(reveal);
    }
    function choose(index, focus = false) {
      setSelected(index);
      onSelect(selected);
      if (focus) buttons[selected].focus({ preventScroll: true });
    }
    previous.addEventListener("click", () => choose(selected - 1));
    next.addEventListener("click", () => choose(selected + 1));
    track.addEventListener("keydown", (event) => {
      const destination = nextIndex(selected, event.key, buttons.length);
      if (destination === null || event.altKey || event.ctrlKey || event.metaKey) return;
      event.preventDefault();
      choose(destination, true);
    });
    setSelected(0);
    return { setSelected, reveal };
  }

  root.ChunkIndex = { create, sizeScale, nextIndex, scrollOffset };
})(typeof window === "undefined" ? module.exports : window);
