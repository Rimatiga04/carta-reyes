// Carta a los Reyes Magos — lee data/steam.json y data/extras.json y pinta la carta.

const euros = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

const imagenSteam = (appid) => [
  `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appid}/header.jpg`,
  `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/header.jpg`,
];

function crear(tag, props = {}, ...hijos) {
  const el = document.createElement(tag);
  Object.assign(el, props);
  hijos.flat().forEach((h) => h != null && el.append(h));
  return el;
}

function tarjetaJuego(juego, puesto) {
  const fuentes = juego.image ? [juego.image, ...imagenSteam(juego.appid)] : imagenSteam(juego.appid);
  let intento = 0;
  const img = crear("img", { src: fuentes[0], alt: juego.name, loading: "lazy" });
  img.addEventListener("error", () => {
    intento++;
    if (intento < fuentes.length) img.src = fuentes[intento];
    else img.replaceWith(crear("div", { className: "sin-imagen", textContent: "🎮" }));
  });

  const precio = crear("div", { className: "precio" });
  if (juego.price && typeof juego.price.final === "number") {
    precio.append(juego.price.final === 0 ? "Gratis" : euros.format(juego.price.final / 100));
    if (juego.price.discount > 0) {
      precio.append(
        crear("span", { className: "descuento", textContent: `-${juego.price.discount}%` }),
        crear("span", { className: "tachado", textContent: euros.format(juego.price.initial / 100) })
      );
    }
  } else {
    precio.textContent = juego.coming_soon ? "Próximamente" : "Ver precio en Steam";
  }

  return crear("li", { className: "juego" },
    crear("span", { className: "puesto", textContent: puesto }),
    crear("a", {
      href: `https://store.steampowered.com/app/${juego.appid}/`,
      target: "_blank",
      rel: "noopener",
    },
      img,
      crear("div", { className: "cuerpo" },
        crear("div", { className: "titulo", textContent: juego.name }),
        precio
      )
    )
  );
}

function tarjetaExtra(extra) {
  const meta = [extra.tienda, extra.precio != null ? euros.format(extra.precio) : null]
    .filter(Boolean).join(" · ");
  return crear("li", { className: "extra" },
    crear("span", { className: "icono", textContent: extra.icono || "🎁" }),
    crear("div", { className: "info" },
      crear("div", { className: "nombre", textContent: extra.nombre }),
      meta && crear("div", { className: "meta", textContent: meta }),
      extra.nota && crear("div", { className: "meta", textContent: extra.nota })
    ),
    extra.url && crear("a", {
      className: "ver no-print", href: extra.url, target: "_blank", rel: "noopener", textContent: "Ver regalo →",
    })
  );
}

async function cargar(ruta) {
  const r = await fetch(ruta, { cache: "no-cache" });
  if (!r.ok) throw new Error(`No se pudo cargar ${ruta}`);
  return r.json();
}

async function iniciar() {
  const [steam, carta] = await Promise.all([cargar("data/steam.json"), cargar("data/extras.json")]);

  document.getElementById("mensaje").textContent = carta.mensaje;
  document.getElementById("firma").textContent = carta.remitente;

  document.getElementById("lista-extras").append(...carta.extras.map(tarjetaExtra));

  const juegos = [...steam.games].sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
  document.getElementById("lista-juegos").append(...juegos.map((j, i) => tarjetaJuego(j, i + 1)));

  // Total aproximado (solo lo que tiene precio conocido)
  const totalJuegos = juegos.reduce((s, j) => s + (j.price?.final ?? 0), 0) / 100;
  const totalExtras = carta.extras.reduce((s, e) => s + (e.precio ?? 0), 0);
  const total = totalJuegos + totalExtras;
  document.getElementById("total").textContent =
    `${juegos.length} juegos y ${carta.extras.length} regalos especiales` +
    (total > 0 ? ` · Total aproximado: ${euros.format(total)} (los Reyes pueden elegir 😉)` : "");

  if (steam.updated) {
    const fecha = new Date(steam.updated).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
    document.getElementById("actualizado").textContent = `Lista de Steam actualizada el ${fecha}`;
  }
}

// Filtros
document.querySelectorAll(".filtro").forEach((boton) => {
  boton.addEventListener("click", () => {
    document.querySelectorAll(".filtro").forEach((b) => b.classList.toggle("activo", b === boton));
    const f = boton.dataset.filtro;
    document.querySelectorAll(".seccion").forEach((s) => {
      s.classList.toggle("oculto", f !== "todo" && s.dataset.seccion !== f);
    });
  });
});

document.getElementById("imprimir").addEventListener("click", () => window.print());

iniciar().catch((e) => {
  console.error(e);
  document.getElementById("mensaje").textContent =
    "Ups, no se pudo cargar la lista. Si abres el index.html con doble clic, usa un servidor local (mira el README).";
});
