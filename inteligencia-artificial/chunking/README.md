# El mismo texto, distintos cortes

Demo estática de Carlos J. Escudero. Compara seis estrategias sobre el mismo
Markdown de **AQU Catalunya, Marco general para la incorporación de la perspectiva
de género en la docencia universitaria (2019)**. Se conservan los metadatos,
índice, tablas, notas, bibliografía y aviso de licencia del documento aportado.

## Abrir e integrar

Abre `index.html`. Funciona sin servidor, claves, CDN ni conexión a modelos.
La carpeta completa sustituye `inteligencia-artificial/chunking/` en Teaching Demos.
La tarjeta del índice de IA debe indicar seis estrategias y AQU.

- **Explorar cortes** muestra cada chunk completo, con su contexto repetido al
  principio. El inspector muestra el mismo contenido y resalta el solapamiento; cambiar de método conserva la posición.
  En semántica se muestra tema, fragmento del grupo y motivo de la frontera.
- **Comparar estrategias** enfrenta los chunks que incorporan el mismo carácter
  como contenido nuevo e indica si también aparece en otros por solapamiento.
- **Cómo funciona** explica las reglas, parámetros, diagnósticos y procedencia.

### Índice de chunks

El índice usa tarjetas grandes de anchura fija, con desplazamiento horizontal
mediante trackpad, gesto táctil o barra de desplazamiento. Cada tarjeta muestra
número, tokens totales, barra de tamaño y cantidad de solapamiento. Las tarjetas
no se estrechan cuando aumenta el número de chunks. Solo la seleccionada se
destaca en morado y con una marca ✓; los demás colores no codifican categorías.

La longitud de la barra es proporcional al tamaño en tokens, incluido el contexto
prestado. La escala se indica debajo; la marca vertical señala el límite u objetivo.
Si un párrafo supera el objetivo, la escala se amplía y aparece un aviso explícito.
En la comparación, ambas columnas comparten escala para permitir comparar tamaños.

«Anterior» y «Siguiente», el selector numérico y las tarjetas mantienen sincronizados
documento, índice e inspector. El índice se desplaza para mostrar la selección.
Con teclado: Tab entra en la tarjeta seleccionada; flechas izquierda/derecha cambian
de chunk; Inicio/Fin van a los extremos; Re Pág/Av Pág avanzan cinco. Desplazarse
por la tira sin pulsar una tarjeta no cambia la selección.

### Solapamientos relativos a la selección

Solo se resaltan dos relaciones del chunk seleccionado: en amarillo, el contexto
que toma del anterior; con un fondo azul grisáceo más oscuro, su contenido nuevo
que reutilizará el siguiente. No se colorean los solapamientos de chunks futuros.
La leyenda se calcula para el chunk seleccionado: muestra solo los fondos que
están presentes (uno, dos o tres). Sus muestras son rectángulos SVG con tamaño
explícito, borde y el mismo color del texto. Al cambiar de selección se borran las
marcas anteriores. Cada bloque del panel contiene el chunk completo: el contexto
tomado del anterior se repite al comienzo de ese propio bloque y se resalta ahí,
no dentro del bloque anterior. Solo el bloque seleccionado tiene marcas. El
inspector y la comparación aplican la misma distinción entre recibido y cedido.

Los enlaces a los estilos y scripts incluyen una huella de su contenido para
que una actualización no conserve por caché estilos de una versión anterior.

La semántica no solapa temas independientes ni grupos que caben enteros, incluso
si alcanzan exactamente 600 tokens. Solo cuatro grupos AQU superan ese máximo:
sus subdivisiones generan los 16 chunks que toman contexto del anterior. El
inspector explica el tamaño del grupo original y el motivo de la subdivisión.

## Métodos y límites

| Método | Regla | Límite total | Solapamiento |
|---|---|---:|---:|
| Tokens fijos | Ventanas con fronteras Unicode válidas | 600 | 0 |
| Tokens con overlap | Ventanas con contexto de la anterior | 600 | Hasta 80 |
| Párrafos completos | Agrupa bloques consecutivos separados por líneas en blanco | Objetivo 600; un bloque mayor se conserva entero | 0 |
| Recursiva | Párrafos → líneas → frases → espacios → tokens; desciende solo donde hace falta | 600 | 0 |
| Estructural | Jerarquía Markdown → subdivisión local de unidades demasiado grandes | 600 | Hasta 80, solo en cortes por tamaño |
| Semántica con LLM | Temas decididos por el LLM → subdivisión recursiva si no caben | 600 | Hasta 80, solo dentro del mismo grupo temático |

**Párrafos completos no llena a toda costa ni corta los párrafos.** Añade el
siguiente si cabe; en otro caso empieza un chunk. Si llevas unos 400 tokens y
el siguiente añade 300, abre otro fragmento. Si uno solo tiene 900, lo conserva
entero y avisa. En AQU ocurre con dos bloques de 1.350 y 2.207 tokens (tablas).
Aquí «párrafo» significa bloque entre líneas en blanco, no párrafo editorial.

**Recursiva añade el descenso a separadores menores.** También conserva las
unidades pequeñas; solo subdivide las demasiado grandes. En el ejemplo de 900
busca líneas, frases y espacios; si no basta, usa ventanas de tokens. No interpreta
temas ni encabezados. Las cifras del ejemplo son orientativas: se cuenta el texto
completo porque el tokenizador no es estrictamente aditivo en las fronteras.

**Estructural empieza por encabezados y subsecciones.** Si una unidad no cabe,
usa cortes locales por bloques, líneas, frases o tokens. Añade contexto únicamente
en fronteras artificiales; no entre secciones naturales. El máximo incluye el
solapamiento. Una sección breve puede quedar por debajo del mínimo deseado de 200.
El motor se ejecuta sin LLM; su etiqueta `fallback` identifica reglas de respaldo,
no un fallo de una llamada a IA en esta demo.

## Semántica: inferencia previa, reproducción local

El agente LLM de ChatGPT leyó los 742 bloques del Markdown íntegro en nueve tandas
y decidió **124 grupos temáticos** el 8 de noviembre de 2026. Las tandas de lectura
no imponen cortes. Las decisiones pueden separar temas que cabrían juntos o unir
continuaciones aunque cambie un encabezado. El análisis se realizó en esta
conversación, no mediante la API configurada ni mediante embeddings; no está
expuesto el identificador exacto del modelo, por lo que se conserva `model: null`.

`aqu_semantic_decisions.json` guarda instrucciones, etiquetas, grupos, procedencia
y huella de la fuente. `scripts/build_semantic_snapshot.py` valida esas decisiones
y aplica el máximo: produce **140 chunks**. No realiza una nueva inferencia ni
deduce los temas con reglas. El resultado está guardado en `aqu_llm.json`.

- `llm`: grupo decidido por el modelo que cabe entero.
- `hybrid`: grupo del modelo subdividido con reglas locales por tamaño.
- Frontera `semantic`: comienza otro grupo; sin solapamiento.
- Frontera `artificial`: continuación del mismo grupo; hasta 80 tokens prestados.

La bibliografía completa es un grupo temático y necesita varios cortes por tamaño.
Sus fronteras internas no se atribuyen al LLM. El mínimo de 200 es deseado, no
obligatorio: se mantienen temas breves. Las decisiones registradas se reproducen
exactamente; otra ejecución del modelo podría producir otras agrupaciones.
La demo no evalúa ni garantiza que estos cortes mejoren la recuperación RAG.

## Reproducir desde chunking_jerarquico

```bash
# Reproducir el análisis guardado, sin llamar a modelos:
uv run python scripts/build_semantic_snapshot.py
uv run python scripts/build_chunking_demo.py --teaching-demos
# Solo las cinco estrategias locales:
uv run python scripts/build_chunking_demo.py --without-semantic
# Otro Markdown: sin importar automáticamente el análisis de AQU:
uv run python scripts/build_chunking_demo.py --markdown documento.md
# Experimento histórico CRUE, con su captura independiente:
uv run python scripts/build_chunking_demo.py --document crue
# Aislar el efecto de los títulos desactivando el overlap estructural:
uv run python scripts/build_chunking_demo.py --structural-overlap-tokens 0
uv run pytest
uv run ruff check .
uv run mypy src
# Pruebas de navegación, escala y desplazamiento, sin dependencias npm:
node --test tests/test_chunk_index.cjs tests/test_chunk_highlights.cjs
```

Salida: `build/pages/`. Interfaz: `docs/demo/`. Entradas: `assets/demo/`.
El constructor y la web no leen credenciales ni llaman a modelos. Para otro texto
o parámetros distintos se necesita un análisis guardado compatible, o usar
`--without-semantic`. La captura histórica CRUE se conserva separada.

Todos los métodos cubren el 100 % del Markdown; los intervalos de contenido nuevo
forman una partición exacta. La repetición es caracteres duplicados / caracteres
indexados. Los offsets Python se convierten a UTF-16 para preservar emojis y otros
caracteres no BMP en el navegador. No se evalúan embeddings, búsqueda ni respuestas.
