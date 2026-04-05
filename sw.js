// Cache-Busting Timestamp: 2026-04-05 15:35:39
const CACHE_NAME = 'platformer-cache-v136';
const ASSETS_TO_CACHE = [
  './?v=136',
  './index.html?v=136',
  './manifest.json?v=136',
  './src/assets/images/icon.svg?v=136',
  './style.css?v=136',
  './src/dist/assets/assets.js?v=136',
  './src/dist/assets/audio.js?v=136',
  './src/dist/data/db.js?v=136',
  './src/dist/core/globals.js?v=136',
  './src/dist/data/levels.js?v=136',
  './src/dist/core/physics.js?v=136',
  './src/dist/render/render.js?v=136',
  './src/dist/render/render_parallax.js?v=136',
  './src/dist/render/render_menus.js?v=136',
  './src/dist/render/render_world.js?v=136',
  './src/dist/render/render_entities.js?v=136',
  './src/dist/render/render_bosses.js?v=136',
  './src/dist/render/render_player.js?v=136',
  './src/dist/render/render_ui.js?v=136',
  './src/dist/render/render_utils.js?v=136',
  './src/dist/render/render_biomes.js?v=136',
  './src/dist/core/input.js?v=136',
  './src/dist/logic/spawner.js?v=136',
  './src/dist/logic/entity_spawner.js?v=136',
  './src/dist/core/game.js?v=136',
  './src/dist/main.js?v=136',
  './src/assets/images/logo.png?v=136',
  './src/dist/assets/sprites_hero.js?v=136',
  './src/dist/assets/sprites_enemies.js?v=136',
  './src/dist/assets/sprites_bosses.js?v=136',
  './src/dist/assets/sprites_biomes.js?v=136',
  './src/dist/core/physics_utils.js?v=136',
  './src/dist/core/physics_boss.js?v=136',
  './src/dist/core/input_utils.js?v=136',
  './src/dist/core/input_touch.js?v=136',
  './src/dist/assets/audio_music.js?v=136',
  './src/dist/assets/audio_sfx.js?v=136',
  './src/dist/core/spatial_grid.js?v=136'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((response) => {
      return response || fetch(e.request);
    })
  );
});
