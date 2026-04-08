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

// Cache-Busting Timestamp: 2026-04-08 13:09:27
const CACHE_NAME = 'platformer-cache-v322';

/**
 * Manifest of all static assets required for a full offline experience.
 * Each entry is appended with a version query (?v=) to force-refresh 
 * caches when the underlying source code changes.
 */
const ASSETS_TO_CACHE = [
/* --- MANIFEST START --- */
  './?v=322',
  './index.html?v=322',
  './manifest.json?v=322',
  './style.css?v=322',
  './src/assets/images/icon.svg?v=322',
  './src/assets/images/logo.png?v=322',
  './src/dist/assets/assets.js?v=322',
  './src/dist/assets/audio/audio_music.js?v=322',
  './src/dist/assets/audio/audio_sfx.js?v=322',
  './src/dist/assets/audio.js?v=322',
  './src/dist/assets/sprites/sprites_auhgr.js?v=322',
  './src/dist/assets/sprites/sprites_biomes.js?v=322',
  './src/dist/assets/sprites/sprites_bosses.js?v=322',
  './src/dist/assets/sprites/sprites_enemies.js?v=322',
  './src/dist/assets/sprites/sprites_glitch.js?v=322',
  './src/dist/assets/sprites/sprites_hero.js?v=322',
  './src/dist/core/game.js?v=322',
  './src/dist/core/globals.js?v=322',
  './src/dist/core/input/input.js?v=322',
  './src/dist/core/input/input_touch.js?v=322',
  './src/dist/core/input/input_utils.js?v=322',
  './src/dist/core/spatial_grid.js?v=322',
  './src/dist/data/db.js?v=322',
  './src/dist/data/levels.js?v=322',
  './src/dist/logic/game_logic.js?v=322',
  './src/dist/logic/game_ui.js?v=322',
  './src/dist/logic/spawning/entity_spawner.js?v=322',
  './src/dist/logic/spawning/spawner.js?v=322',
  './src/dist/logic/spawning/spawner_entities.js?v=322',
  './src/dist/logic/spawning/spawner_glitch_arena.js?v=322',
  './src/dist/logic/spawning/spawner_utils.js?v=322',
  './src/dist/main.js?v=322',
  './src/dist/physics/bosses/physics_boss.js?v=322',
  './src/dist/physics/bosses/physics_boss_auhgr.js?v=322',
  './src/dist/physics/bosses/physics_boss_baphometron.js?v=322',
  './src/dist/physics/bosses/physics_boss_glitch.js?v=322',
  './src/dist/physics/bosses/physics_boss_glitch_utils.js?v=322',
  './src/dist/physics/bosses/physics_boss_masticator.js?v=322',
  './src/dist/physics/bosses/physics_boss_septicus.js?v=322',
  './src/dist/physics/bosses/physics_boss_septicus_utils.js?v=322',
  './src/dist/physics/core/physics_core.js?v=322',
  './src/dist/physics/core/physics_utils.js?v=322',
  './src/dist/physics/hazards/physics_bombs.js?v=322',
  './src/dist/physics/hazards/physics_crumbling.js?v=322',
  './src/dist/physics/hazards/physics_geysers.js?v=322',
  './src/dist/physics/hazards/physics_imps.js?v=322',
  './src/dist/physics/hazards/physics_lasers.js?v=322',
  './src/dist/physics/hazards/physics_virtual_hazards.js?v=322',
  './src/dist/physics/states/physics_states.js?v=322',
  './src/dist/render/actors/render_entities.js?v=322',
  './src/dist/render/actors/render_player.js?v=322',
  './src/dist/render/biomes/render_biomes_h311.js?v=322',
  './src/dist/render/biomes/render_biomes_mine.js?v=322',
  './src/dist/render/biomes/render_biomes_sewer.js?v=322',
  './src/dist/render/biomes/render_biomes_slums.js?v=322',
  './src/dist/render/biomes/render_biomes_virtual.js?v=322',
  './src/dist/render/bosses/render_bosses.js?v=322',
  './src/dist/render/bosses/render_boss_auhgr.js?v=322',
  './src/dist/render/bosses/render_boss_glitch.js?v=322',
  './src/dist/render/bosses/render_boss_masticator.js?v=322',
  './src/dist/render/bosses/render_boss_septicus.js?v=322',
  './src/dist/render/elements/render_conduits.js?v=322',
  './src/dist/render/elements/render_geysers.js?v=322',
  './src/dist/render/elements/render_hazards_virtual.js?v=322',
  './src/dist/render/elements/render_imps.js?v=322',
  './src/dist/render/elements/render_particles.js?v=322',
  './src/dist/render/elements/render_projectiles.js?v=322',
  './src/dist/render/elements/render_reflectors.js?v=322',
  './src/dist/render/environment/render_biomes.js?v=322',
  './src/dist/render/environment/render_map_cache.js?v=322',
  './src/dist/render/environment/render_parallax.js?v=322',
  './src/dist/render/environment/render_world.js?v=322',
  './src/dist/render/render.js?v=322',
  './src/dist/render/screens/render_menus.js?v=322',
  './src/dist/render/screens/render_menu_instructions.js?v=322',
  './src/dist/render/screens/render_menu_intro.js?v=322',
  './src/dist/render/screens/render_ui.js?v=322',
  './src/dist/render/utils/render_utils.js?v=322',
  './src/dist/render/utils/render_utils_fiber.js?v=322'
/* --- MANIFEST END --- */
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
 * strings like ?v=322.
 */
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((response) => {
      return response || fetch(e.request);
    })
  );
});
