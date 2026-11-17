# 👑 Carta a los Reyes Magos

Web estática con mi carta a los Reyes: los juegos de mi lista de deseados de Steam y algunos regalos extra.

## Estructura

```
index.html                  → la carta
styles.css                  → estilos (también para imprimir)
app.js                      → pinta la carta a partir de los JSON
data/steam.json             → juegos de Steam (se genera con el script)
data/extras.json            → regalos extra, mensaje y firma (edítalo a mano)
scripts/update-steam.mjs    → descarga la lista de deseados, los precios en € y las imágenes
.github/workflows/...       → GitHub Action que actualiza steam.json cada día
```

## Probar en local

`fetch` no funciona abriendo el HTML con doble clic, así que hay que usar un servidor:

```bash
npx serve .          # o:  python -m http.server
```

Para actualizar los juegos y precios a mano:

```bash
node scripts/update-steam.mjs
```

## Publicar en GitHub Pages

1. Crea un repositorio y sube todos los archivos (incluida la carpeta `.github`).
2. **Settings → Pages → Source: Deploy from a branch → `main` / root**.
3. **Settings → Actions → General → Workflow permissions → Read and write**.
4. En la pestaña **Actions**, ejecuta "Actualizar lista de Steam" una vez (botón *Run workflow*) para cargar los precios.
5. Pásale a tus padres el enlace `https://TU_USUARIO.github.io/NOMBRE_REPO/`.

> La lista de deseados de Steam tiene que estar en **Pública** para que el script la lea.
