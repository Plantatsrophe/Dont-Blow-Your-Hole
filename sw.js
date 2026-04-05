// Cache-Busting Timestamp: 2026-04-05 15:28:00
const CACHE_NAME = 'platformer-cache-v134';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './src/assets/images/icon.svg',
  './style.css',
  './src/dist/assets/assets.js',
  './src/dist/assets/audio.js',
  './src/dist/data/db.js',
  './src/dist/core/globals.js',
  './src/dist/data/levels.js',
  './src/dist/core/physics.js',
  './src/dist/render/render.js',
  './src/dist/render/render_parallax.js',
  './src/dist/render/render_menus.js',
  './src/dist/render/render_world.js',
  './src/dist/render/render_entities.js',
  './src/dist/render/render_bosses.js',
  './src/dist/render/render_player.js',
  './src/dist/render/render_ui.js',
  './src/dist/render/render_utils.js',
  './src/dist/render/render_biomes.js',
  './src/dist/core/input.js',
  './src/dist/logic/spawner.js',
  './src/dist/logic/entity_spawner.js',
  './src/dist/core/game.js',
  './src/dist/main.js',
  './src/assets/images/logo.png',
  './src/dist/assets/sprites_hero.js',
  './src/dist/assets/sprites_enemies.js',
  './src/dist/assets/sprites_bosses.js',
  './src/dist/assets/sprites_biomes.js',
  './src/dist/core/physics_utils.js',
  './src/dist/core/physics_boss.js',
  './src/dist/core/input_utils.js',
  './src/dist/core/input_touch.js',
  './src/dist/assets/audio_music.js',
  './src/dist/assets/audio_sfx.js',
  './src/dist/core/spatial_grid.js'
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
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});
