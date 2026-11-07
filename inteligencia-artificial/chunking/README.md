# El mismo texto, distintos cortes

Demo estática de Carlos J. Escudero para comparar seis estrategias sobre una
única extracción Markdown de las recomendaciones de CRUE sobre lenguaje.

## Abrir

Abre `index.html` directamente. No necesita instalación, servidor, claves,
servicios externos ni conexión a Internet. La navegación de regreso conduce al
portal público de Teaching Demos. Se requiere JavaScript.

La vista **Explorar cortes** permite seleccionar estrategia y fragmento; muestra
la fuente completa una sola vez y resalta los solapamientos. **Comparar
estrategias** enfrenta los chunks que cubren el mismo punto del documento.
**Cómo funciona** explica los parámetros, la procedencia y las limitaciones.
Los resultados y el Markdown se pueden descargar.

## Publicación en Teaching Demos

Esta carpeta está preparada para copiarse completa como
`inteligencia-artificial/chunking/` dentro de `cjescudero/teachingdemos`.
Todos los recursos de la demo usan rutas relativas. No requiere recompilar el
portal ni ejecutar Python en GitHub Pages.

Al integrarla, añade una tarjeta «El mismo texto, distintos cortes» al índice de
Inteligencia artificial y revisa la portada, los demás índices y el README,
según las instrucciones de ese repositorio. No es necesario cambiar la
configuración existente de Pages.

## Reproducción del experimento

Desde el proyecto `chunking_jerarquico`:

```bash
uv run python scripts/build_chunking_demo.py
# Para el portal, con enlaces de regreso relativos:
uv run python scripts/build_chunking_demo.py --teaching-demos
uv run pytest
uv run ruff check .
uv run mypy src
```

La salida se escribe en `build/pages/`. Los recursos originales de interfaz
están en `docs/demo/`; los datos de entrada versionados, en `assets/demo/`.
El constructor solo usa dependencias del proyecto; no depende de
`demo_Chunking_RAG` ni lee `.env` ni llama a un modelo.

## Método y procedencia

- Fuente: `CRUE_Recomendaciones-para-uso-lenguaje-igualitario-en-las-universidades.pdf`,
  aprobado el 19 de julio de 2024. El texto pertenece a sus titulares; este
  experimento no atribuye a su autoría el documento de CRUE.
- Markdown: extracción conservada en la ejecución `20260724T052438978139Z`.
- Tokenizador: `cl100k_base`. Ventanas, párrafos y recursiva: objetivo 600.
  Motor jerárquico: mínimo 200, objetivo 600, máximo 1.000; overlap hasta 80.
- Comparación: tokens fijos; tokens con overlap; agrupación por párrafos;
  separadores recursivos; motor estructural sin LLM; semántica con LLM guardada.
- El resultado semántico es una captura real, no una simulación. No se conserva
  el nombre del modelo ni se promete reproducir idénticos cortes al llamarlo de
  nuevo. El constructor comprueba SHA-256, parámetros y recuentos de tokens.
- Se conserva la estructura imperfecta de la conversión, incluidos dos títulos
  Markdown, uno dudoso. Es una limitación de entrada, no una mejora del algoritmo.
- La repetición se mide por caracteres duplicados entre chunks divididos entre
  el total de caracteres indexados. No es una puntuación de calidad RAG.
- Las posiciones son caracteres de Python. El navegador calcula su equivalente
  UTF-16 antes de cortar cadenas, para preservar también caracteres no BMP.

Las únicas peticiones que realiza la página al servirse por HTTP son las de sus
propios recursos estáticos. No contiene analítica, CDN ni backend.
