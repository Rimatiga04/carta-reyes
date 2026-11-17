// Actualiza data/steam.json con la lista de deseados pública de Steam.
// Uso: node scripts/update-steam.mjs [steamid64]
// Necesita Node 18+ (usa fetch nativo). La lista de deseados debe ser PÚBLICA.

import { readFile, writeFile } from "node:fs/promises";

const RUTA = new URL("../data/steam.json", import.meta.url);
const anterior = JSON.parse(await readFile(RUTA, "utf8"));
const STEAMID = process.argv[2] || process.env.STEAMID || anterior.steamid;

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function json(url) {
  const r = await fetch(url, { headers: { "Accept-Language": "es-ES" } });
  if (!r.ok) throw new Error(`${r.status} en ${url}`);
  return r.json();
}

// 1) IDs de la lista de deseados (si falla, se reutilizan los que ya había)
let items;
try {
  const datos = await json(
    `https://api.steampowered.com/IWishlistService/GetWishlist/v1/?steamid=${STEAMID}`
  );
  items = (datos.response?.items ?? []).map((i) => ({ appid: i.appid, priority: i.priority }));
  if (!items.length) throw new Error("Lista vacía (¿es privada?)");
  console.log(`Lista de deseados: ${items.length} juegos`);
} catch (e) {
  console.warn(`No se pudo leer la lista (${e.message}). Uso los appids guardados.`);
  items = anterior.games.map((g, i) => ({ appid: g.appid, priority: g.priority ?? i }));
}

// 2) Detalles de cada juego (nombre, imagen y precio en euros)
const previos = new Map(anterior.games.map((g) => [g.appid, g]));
const games = [];
for (const { appid, priority } of items) {
  const base = previos.get(appid) ?? { appid, name: `App ${appid}`, price: null };
  try {
    const d = await json(
      `https://store.steampowered.com/api/appdetails?appids=${appid}&cc=es&l=spanish`
    );
    const info = d[appid]?.success ? d[appid].data : null;
    if (!info) throw new Error("sin datos");
    const p = info.price_overview;
    games.push({
      appid,
      priority,
      name: info.name,
      image: info.header_image,
      coming_soon: info.release_date?.coming_soon ?? false,
      release: info.release_date?.date ?? null,
      price: info.is_free
        ? { initial: 0, final: 0, discount: 0 }
        : p
        ? { initial: p.initial, final: p.final, discount: p.discount_percent }
        : null,
    });
    console.log(`✓ ${info.name}`);
  } catch (e) {
    console.warn(`✗ ${appid}: ${e.message}`);
    games.push({ ...base, priority });
  }
  await esperar(1500); // no saturar la API de Steam
}

games.sort((a, b) => a.priority - b.priority);
await writeFile(
  RUTA,
  JSON.stringify({ steamid: STEAMID, updated: new Date().toISOString(), games }, null, 2) + "\n"
);
console.log("data/steam.json actualizado");
