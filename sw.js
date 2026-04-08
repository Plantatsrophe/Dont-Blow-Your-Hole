/**
 * DONT DIE - SERVICE WORKER (PWA)
 * -------------------------------
 * This worker manages the offline lifecycle of the game.
 * It uses a "Cache-First" strategy with aggressive versioning to ensure 
 * that the game is playable without an internet connection while 
 * preventing stale asset bugs.
 * 
 * The Build Pipeline (scripts/version_sync.js) automatically updates the 
 * timestamps and v-params in this file upon every successful build.
 */

// Cache-Busting Timestamp: 2026-04-08 12:26:26
const CACHE_NAME = 'platformer-cache-v315';

/**
 * Manifest of all static assets required for a full offline experience.
 * Each entry is appended with a version query (?v=) to force-refresh 
 * caches when the underlying source code changes.
 */
const ASSETS_TO_CACHE = [
  './?v=315',
  './index.html?v=315',
  './manifest.json?v=315',
  './src/assets/images/icon.svg?v=315',
  './style.css?v=315',
  './src/dist/assets/assets.js?v=315',
  './src/dist/assets/audio.js?v=315',
  './src/dist/data/db.js?v=315',
  './src/dist/core/globals.js?v=315',
  './src/dist/data/levels.js?v=315',
  './src/dist/core/physics.js?v=315',
  './src/dist/render/render.js?v=315',
  './src/dist/render/render_parallax.js?v=315',
  './src/dist/render/render_menus.js?v=315',
  './src/dist/render/render_world.js?v=315',
  './src/dist/render/render_entities.js?v=315',
  './src/dist/render/render_bosses.js?v=315',
  './src/dist/render/render_player.js?v=315',
  './src/dist/render/render_ui.js?v=315',
  './src/dist/render/render_utils.js?v=315',
  './src/dist/render/render_biomes.js?v=315',
  './src/dist/core/input.js?v=315',
  './src/dist/logic/spawner.js?v=315',
  './src/dist/logic/entity_spawner.js?v=315',
  './src/dist/core/game.js?v=315',
  './src/dist/main.js?v=315',
  './src/assets/images/logo.png?v=315',
  './src/dist/assets/sprites_hero.js?v=315',
  './src/dist/assets/sprites_enemies.js?v=315',
  './src/dist/assets/sprites_bosses.js?v=315',
  './src/dist/assets/sprites_biomes.js?v=315',
  './src/dist/core/physics_utils.js?v=315',
  './src/dist/core/physics_boss.js?v=315',
  './src/dist/core/input_utils.js?v=315',
  './src/dist/core/input_touch.js?v=315',
  './src/dist/assets/audio_music.js?v=315',
  './src/dist/assets/audio_sfx.js?v=315',
  './src/dist/core/spatial_grid.js?v=315'
];

/**
 * INSTALL EVENT
 * Pre-fetches all assets in ASSETS_TO_CACHE and stores them in the Cache Storage.
 * skipWaiting() ensures the new worker takes control immediately without 1-refresh delay.
 */
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

/**
 * ACTIVATE EVENT
 * Cleans up legacy caches from previous versions to save user disk space.
 * self.clients.claim() allows the worker to take control of open tabs immediately.
 */
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

/**
 * FETCH EVENT
 * Intercepts network requests.
 * It follows a "Cache-First" approach: if a file is in the cache, it's served instantly.
 * The 'ignoreSearch: true' flag is critical to match URLs that have versioned query 
 * strings like ?v=315.
 */
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((response) => {
      return response || fetch(e.request);
    })
  );
});
