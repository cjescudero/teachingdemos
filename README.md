# Teaching Demos

Portal de demostraciones interactivas para docencia. La navegación se organiza en tres niveles: **portada → índice del apartado → demostración**.

**Sitio de GitHub Pages:** [Teaching Demos](https://cjescudero.github.io/teachingdemos/).

## Apartados

- **[Teoría de la Información](teoria-de-la-informacion/index.html):** conserva el índice de TI_GCED y sus seis recursos sobre circunferencia unidad, periodicidad espectral, aliasing, cuantificación, series de Fourier y bins de la DFT. Incorpora la demostración de polos, ceros y respuesta en frecuencia.
- **[Inteligencia artificial](inteligencia-artificial/index.html):** simulador de embeddings y recuperación RAG; vídeo demostrativo sobre la ventana de contexto.
- **[Redes inalámbricas](redes-inalambricas/index.html):** laboratorio de espectro doméstico, canales y coexistencia entre tecnologías inalámbricas (`EspectroyRedes.html`).

## Estructura

```text
index.html                       Portada de temas
assets/site.css                  Estilos de la portada y los nuevos índices
teoria-de-la-informacion/         Índice TI_GCED y siete demos
inteligencia-artificial/         Índice, simulador RAG y vídeo de ventana de contexto
redes-inalambricas/               Índice y laboratorio de espectro doméstico
```

Cada apartado tiene su propio `index.html`. Las demos mantienen su HTML, CSS y JavaScript autocontenidos. En la raíz solo se conserva `index.html`, la portada general.

## Desarrollo local

No se necesita instalación ni compilación. Abre `index.html` en el navegador o sirve la raíz con Python 3:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Visita <http://127.0.0.1:8000/>. Para comprobar la ruta de proyecto que utiliza Pages, ejecuta el servidor desde el directorio padre y visita `/teachingdemos/`.

Se requiere JavaScript. Las fuentes de Google y las bibliotecas p5.js y math.js del simulador de polos y ceros se cargan desde servicios externos; estas bibliotecas requieren conexión a internet.

## Publicación en GitHub Pages

1. Revisa `git status --short --branch` y `git diff --check`. Comprueba siempre la portada y todos los índices; actualiza los afectados junto con el README.
2. Consulta el estado remoto con `git fetch origin`, revisa cualquier divergencia y crea un commit con los archivos revisados, incluidos los nuevos. Envía el commit a la rama publicada (por ejemplo, `git push origin main` si Pages usa `main`).
3. En GitHub, abre **Settings → Pages → Build and deployment**.
4. Selecciona **Deploy from a branch**, la rama correspondiente y **/(root)**.
5. Guarda y espera a que finalice la publicación; comprueba el enlace del sitio indicado arriba.

Los cambios locales y los commits sin enviar no aparecen en GitHub Pages. Después del envío, confirma que el despliegue finaliza correctamente y comprueba en la web pública la portada, los índices y las demos modificadas. Un `push` correcto no garantiza por sí solo que Pages se haya actualizado.

Los enlaces internos son relativos para funcionar bajo `/teachingdemos/`. No se necesita un generador de sitio ni un proceso de compilación. Esta reorganización no modifica la configuración ni el contenido del sitio original TI_GCED.

## Comprobaciones y contribuciones

Antes de enviar cambios, ejecuta `git diff --check`. Recorre portada, índices y demos, comprueba enlaces de regreso, y revisa la consola del navegador. Prueba los controles de las demos modificadas y la presentación de los índices en móvil, escritorio y con teclado. No hay una suite automatizada de pruebas instalada.

Añade cada nueva demo al índice de su apartado. Describe en la solicitud de cambios el comportamiento modificado, el navegador y las comprobaciones realizadas; adjunta capturas si hay cambios visuales.

## Procedencia y licencia

Los seis recursos y el índice de Teoría de la Información se importaron de [TI_GCED](https://github.com/cjescudero/TI_GCED), revisión `cdfb2023ed7bb4c68bf3472a6b24a259681d5b4b`. El repositorio y sitio originales permanecen independientes. Se conserva la presentación y el orden del índice, añadiendo polos y ceros y el regreso a la portada; los enlaces de navegación y licencia se adaptan a su nueva ubicación.

Copyright © 2025–2026 Carlos J. Escudero. Distribuido bajo la [licencia MIT](LICENSE).
