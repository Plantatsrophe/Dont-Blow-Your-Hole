/**
 * HERO SPRITES & GLOBAL PALETTE
 * ----------------------------
 * Contains the visual definitions for the player character and
 * the master color palette used by the entire rendering engine.
 */
/**
 * MASTER PALETTE
 * Map of numerical IDs to CSS hex colors.
 * Every sprite in the game uses these indices.
 */
export const pal = {
    0: null, 1: '#f1c27d', 2: '#ff2222', 3: '#f1c40f', 4: '#5c4033',
    5: '#888888', 6: '#444444', 7: '#2ecc71', 8: '#ffffff', 9: '#00ffff',
    10: '#000000', 11: '#3366cc', 12: '#8b4513', 13: '#222222', 14: '#3ee855', 15: '#1e90ff', 16: '#5e4533'
};
/** Standard hero idle/walking sprite. */
export const sprHero = [
    0, 0, 0, 3, 3, 3, 3, 3, 3, 0, 0, 0, 0, 0, 3, 3, 3, 2, 2, 2, 2, 3, 0, 0, 0, 3, 3, 3, 3, 1, 1, 1, 1, 3, 0, 0,
    3, 3, 3, 3, 1, 10, 1, 10, 1, 1, 0, 0, 3, 3, 3, 1, 1, 1, 4, 4, 1, 1, 0, 0, 0, 3, 3, 1, 1, 4, 4, 4, 4, 1, 0, 0,
    0, 0, 3, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 10, 10, 1, 1, 1, 0, 0, 0, 0, 0, 1, 10, 1, 1, 10, 1, 0, 0, 0, 0,
    0, 0, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 2, 2, 0, 0, 0
];
/** Ghostly/faded version of the hero used upon death. */
export const sprHeroDead = [
    0, 0, 0, 3, 3, 3, 3, 3, 3, 0, 0, 0, 0, 0, 3, 3, 3, 2, 2, 2, 2, 3, 0, 0, 0, 3, 3, 3, 3, 1, 1, 1, 1, 3, 0, 0,
    3, 3, 3, 3, 1, 4, 1, 4, 1, 1, 0, 0, 3, 3, 3, 1, 1, 1, 4, 4, 1, 1, 0, 0, 0, 3, 3, 1, 1, 4, 4, 4, 4, 1, 0, 0,
    0, 0, 3, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 10, 10, 1, 1, 1, 0, 0, 0, 0, 0, 1, 10, 1, 1, 10, 1, 0, 0, 0, 0,
    0, 0, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 2, 2, 0, 0, 0
];
