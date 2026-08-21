/* ==========================================================================
   ThesAgreg — Service worker
   ---------------------------------------------------------------------
   Mise en cache de l'app shell pour un usage hors-ligne (réviser sans
   connexion, ex. dans le métro). Stratégie : on sert le cache en priorité
   pour un affichage instantané, tout en rafraîchissant le cache en tâche de
   fond dès qu'une connexion est disponible ("stale-while-revalidate").
   Bump CACHE_NAME à chaque changement de contenu de l'app shell pour forcer
   le renouvellement du cache chez les utilisateurs.
========================================================================== */
const CACHE_NAME = "thesagreg-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./data.js",
  "./manifest.json",
  "./accueil.jpg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-192.png",
  "./icons/icon-maskable-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  // On ne gère que les requêtes GET same-origin ; le reste (POST, autres
  // origines) part directement au réseau sans passer par le cache.
  if(req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((response) => {
          if(response && response.ok){
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return response;
        })
        .catch(() => cached || caches.match("./index.html"));
      return cached || network;
    })
  );
});
