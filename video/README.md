# Video demo 3D de Kaibu

Anuncio hecho con código: [Remotion](https://www.remotion.dev) (React → video) y Three.js para el 3D.
Es un proyecto aparte: no forma parte de la app ni de su compilación.

- **4 versiones:** horizontal 16:9 (60 s) y vertical 9:16 (30 s), cada una con 2 temas musicales.
- **Ritmo:** los cortes caen en los golpes de cada tema y el logo aparece justo en el "drop" (`src/ritmo.ts`).
- **Pantallas reales:** `scripts/capturar.mjs` recorre la app en modo local con datos de ejemplo
  (navegador temporal) y guarda las capturas en `public/capturas/`.
- **Resultado:** `entregas/*.mp4`.

## Comandos (dentro de `video/`)

| Comando | Para qué |
|---|---|
| `npm ci` | Instala las dependencias del video |
| `npm run estudio` | Abre el editor de Remotion para ver y ajustar las escenas |
| `npm run tipos` | Revisa los tipos |
| `npm run capturar` | Vuelve a capturar las pantallas (requiere la app en `http://localhost:4173`) |
| `npm run render` | Renderiza las 4 versiones en `entregas/` |

La música (Pixabay) va en `public/musica/club.mp3` y `public/musica/workout.mp3`. No se sube al
repositorio porque su licencia no permite redistribuir el archivo suelto; dentro del video sí se puede usar.

> Licencia de Remotion: gratis para personas y empresas de hasta 3 personas.
