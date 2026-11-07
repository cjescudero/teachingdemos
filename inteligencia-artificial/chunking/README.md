# El mismo texto, distintos cortes

Demo estática de Carlos J. Escudero. Compara cinco estrategias calculadas sobre
el mismo Markdown de **AQU Catalunya, Marco general para la incorporación de la
perspectiva de género en la docencia universitaria (2019)**, aportado por el usuario.
Se mantienen sus metadatos, índice, tablas, notas y bibliografía. La autoría del
documento corresponde a AQU Catalunya; su aviso de licencia se conserva íntegro.

## Abrir e integrar

Abre `index.html`. Funciona sin servidor, claves, CDN ni conexión a modelos.
La carpeta completa sustituye `inteligencia-artificial/chunking/` en Teaching Demos.
La tarjeta del índice de IA debe indicar cinco estrategias y AQU, no seis y CRUE.

- **Explorar cortes** muestra cada carácter una vez. El inspector muestra el chunk
  completo y resalta el solapamiento; cambiar de método conserva el punto de lectura.
- **Comparar estrategias** enfrenta fragmentos que incorporan el mismo carácter
  como contenido nuevo e indica si también aparece en otros chunks por overlap.
- **Cómo funciona** presenta parámetros, diagnósticos calculados y procedencia.

## Métodos y límites

| Método | Regla | Límite total | Overlap |
|---|---|---:|---:|
| Tokens fijos | Ventanas con fronteras Unicode válidas | 600 | 0 |
| Tokens con overlap | Ventanas con contexto de la anterior | 600, incluido overlap | Hasta 80 |
| Agrupación de párrafos | Empaqueta bloques separados por líneas en blanco | Objetivo 600; un bloque indivisible puede superarlo | 0 |
| Recursiva | Desciende por párrafos, líneas, frases, espacios y tokens solo si hace falta | 600 | 0 |
| Estructural | Jerarquía Markdown y divisiones locales por tamaño | 600 | 0 |

El mínimo deseado del motor estructural es 200; una sección breve puede quedar
por debajo para conservar la estructura. El máximo de 600 incluye todo el texto
indexado. La variante estructural sin solapamiento permite aislar el efecto de
la estructura; el constructor admite activar su overlap por separado.

La agrupación de párrafos **no equivale a un chunk por párrafo**. En AQU hay dos
bloques de más de 600 tokens, uno de 2.207: conservarlos enteros es la excepción
declarada de este método. La recursiva sí los divide. Los cinco métodos dan cortes
distintos; los diagnósticos se calculan, no se presuponen en el HTML.

No hay resultado semántico con LLM para este Markdown. Se indica como no disponible;
no se reutiliza la captura de CRUE ni se atribuyen reglas locales a una IA.
La captura histórica CRUE permanece separada en el proyecto de origen.

La repetición es caracteres duplicados / caracteres indexados. No mide calidad
RAG. Todos los métodos cubren el 100 % del texto y sus intervalos de contenido
nuevo forman una partición exacta. Los offsets Python se convierten a UTF-16 en
el navegador para preservar caracteres no BMP.

## Reproducir desde chunking_jerarquico

```bash
uv run python scripts/build_chunking_demo.py --teaching-demos
# Otro Markdown, conservado sin normalizar saltos de línea:
uv run python scripts/build_chunking_demo.py --markdown documento.md
# Experimento histórico CRUE, con su captura LLM validada:
uv run python scripts/build_chunking_demo.py --document crue
# Estructural con overlap, sin cambiar el de las ventanas:
uv run python scripts/build_chunking_demo.py --structural-overlap-tokens 80
uv run pytest
uv run ruff check .
uv run mypy src
```

Salida: `build/pages/`. Fuente de interfaz: `docs/demo/`. Entradas: `assets/demo/`.
No se leen credenciales ni se llama a modelos durante el cálculo ni en la web.
Un JSON semántico opcional debe corresponder exactamente a la fuente y parámetros.
