// Cache-Busting Timestamp: 2026-04-04 16:11:00
const CACHE_NAME = 'platformer-cache-v127';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './src/assets/images/icon.svg',
  './style.css',
  './src/assets/assets.js',
  './src/assets/audio.js',
  './src/data/db.js',
  './src/core/globals.js',
  './src/data/levels.js',
  './src/core/physics.js',
  './src/render/render.js',
  './src/render/render_parallax.js',
  './src/render/render_menus.js',
  './src/render/render_world.js',
  './src/render/render_entities.js',
  './src/render/render_bosses.js',
  './src/render/render_player.js',
  './src/render/render_ui.js',
  './src/render/render_utils.js',
  './src/render/render_biomes.js',
  './src/core/input.js',
  './src/logic/spawner.js',
  './src/logic/entity_spawner.js',
  './src/core/game.js',
  './src/main.js',
  './src/assets/images/logo.png',
  './src/assets/sprites_hero.js',
  './src/assets/sprites_enemies.js',
  './src/assets/sprites_bosses.js',
  './src/assets/sprites_biomes.js',
  './src/core/physics_utils.js',
  './src/core/physics_boss.js',
  './src/core/input_utils.js',
  './src/core/input_touch.js',
  './src/assets/audio_music.js',
  './src/assets/audio_sfx.js'
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
