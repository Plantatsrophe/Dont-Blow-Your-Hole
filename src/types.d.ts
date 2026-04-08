/**
 * Basic 2D Rectangle interface for collision math.
 */
export interface IRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Valid states for the top-level game controller.
 */
export type GameState = 'START' | 'INTRO' | 'INSTRUCTIONS' | 'PLAYING' | 'DYING' | 'LEVEL_CLEAR' | 'VALVE_CUTSCENE' | 'GAMEOVER' | 'WIN' | 'CREDITS' | 'ENTER_INITIALS' | 'CREDITS_CUTSCENE';

/**
 * Camera viewport coordinates in world-space.
 */
export interface ICamera {
    x: number;
    y: number;
}

/**
 * Main Player Entity Interface.
 * Tracks physics, input state, and lifecycle (lives/score).
 */
export interface IPlayer {
    x: number;
    y: number;
    startX: number; // Respawn location X
    startY: number; // Respawn location Y
    width: number;
    height: number;
    vx: number; // Horizontal velocity
    vy: number; // Vertical velocity
    speed: number; // Maximum horizontal speed
    jumpPower: number; // Initial vertical 'pop' on jump
    gravity: number; // Downward acceleration force
    walkTimer: number; // Animation state accumulator
    isOnGround: boolean;
    doubleJump: boolean; // Flag to permit mid-air jump
    isClimbing: boolean; // True if attached to a ladder/pipe
    riding: IPlatform | null; // Reference to the platform the player is currently standing on
    rideOffsetX: number; // Relative position on the moving platform
    lives: number;
    score: number;
    color: string;
    coyoteTimer: number; // Grace period for jumping after falling
    jumpBufferTimer: number; // Grace period for pre-landing jump inputs
    lastDir?: number; // Last-moved direction (-1 or 1) for sprite flipping
    dyingTimer?: number; // Accumulator for death animation
    portalX?: number; // Target X for level-clear warp
    portalY?: number; // Target Y for level-clear warp
    cutsceneTimer?: number; // Accumulator for cinematic sequences
    droppingThrough?: boolean; // Flag to ignore one-way floor collisions
    isInvincible?: boolean; // God mode toggle
}

/**
 * Moving or Static Platform Interface.
 */
export interface IPlatform {
    x: number;
    y: number;
    width: number;
    height: number;
    vx: number;
    vy: number;
    minX: number; // Left boundary for patrol
    maxX: number; // Right boundary for patrol
    minY: number; // Top boundary for patrol
    maxY: number; // Bottom boundary for patrol
    type: string; // e.g., 'moving', 'conveyor', 'one-way'
}

/**
 * Base Interface for any object that occupies 2D world space.
 */
export interface IEntity {
    x: number;
    y: number;
    width: number;
    height: number;
    active?: boolean;
    type: string;
}

/**
 * Mobile hazard or patrolling bot.
 */
export interface IEnemy extends IEntity {
    vx: number;
    vy: number;
    dir: number; // Movement direction (-1, 0, 1)
    cooldown: number; // AI action cooldown (e.g., shooting)
}

/**
 * Collectible loot or environmental trigger.
 */
export interface IItem extends IEntity {
    collected: boolean;
}

/**
 * Fast-moving projectile hazard.
 */
export interface ILaser extends IEntity {
    vx: number;
    vy?: number;
    hue?: number; // Dynamic rainbow color for Medusa Cyber Lasers
    timer: number;
    reflected?: boolean; // Has this laser been bounced by a reflector?
    reflectionPhase?: 'ABSORBING' | 'FIRING'; // Animation state for mirror reflection
    beamTimer?: number; // Universal accumulator for the phases
    targetX?: number; // Beam destination X
    targetY?: number; // Beam destination Y
    passThroughTiles?: boolean; // If true, projectile ignores wall geometry
}

/**
 * Environmental mirror that bounces lasers back at enemies.
 */
export interface IReflector extends IRect {
    active: boolean;
    isUsable: boolean; // Can this mirror currently reflect lasers?
}

/**
 * Visual-only effect with a limited lifespan.
 */
export interface IParticle extends IEntity {
    vx: number;
    vy: number;
    size: number;
    life: number;
    maxLife: number;
    color?: string;
    qx?: number; // Quad-split coordinate X (for destruction effects)
    qy?: number; // Quad-split coordinate Y
    flip?: boolean;
}

/**
 * Major boss encounter entity with multi-phase state.
 */
export interface IBoss extends IEntity {
    hp: number;
    maxHp?: number;
    phase: number;
    timer: number;
    hurtTimer: number; // Visual feedback window for taking damage
    vibrateX: number; // Shake offset for damage feedback
    isSinking?: boolean; // Death-spiral state for Septicus
    isDying?: boolean; // Final explosion state
    triggered?: boolean; // Has the player entered the arena?
    throwsLeft?: number; // Masticator bomb count
    startX?: number;
    startY?: number;
    vx: number;
    vy: number;
    hasSeenPlayer: boolean;
    squash: number; // Scale factor for landing impact
    squashTimer: number;
    projs?: any[]; // Dynamic list of secondary boss hazards
    hairTrail1?: { x: number, y: number }[]; // Movement history for rider hair (Pony Tail 1)
    hairTrail2?: { x: number, y: number }[]; // Movement history for rider hair (Pony Tail 2)
    maneTrail?: { x: number, y: number }[]; // Movement history for steed mane
    tailTrail?: { x: number, y: number }[]; // Movement history for steed tail
    hairX1?: number; // Persisted lerp position for head hair anchor 1
    hairX2?: number; // Persisted lerp position for head hair anchor 2
    hairY1?: number; // Persisted lerp Y for head hair anchor 1
    hairY2?: number; // Persisted lerp Y for head hair anchor 2
    maneX?: number; // Persisted lerp X for mane anchor
    maneY?: number; // Persisted lerp Y for mane anchor
    tailX?: number; // Persisted lerp X for tail anchor
    tailY?: number; // Persisted lerp Y for tail anchor
    lastFlipped?: boolean; // Tracking for direction flip events
    state?: string; // AI State for combat logic (IDLE, DASH, etc.)
    facingDir?: number; // Current facing direction (-1 or 1) for combat target lock
}

/**
 * Destructible block hazard used in Masticator fight.
 */
export interface IBomb extends IEntity {
    active: boolean;
    vx: number;
    vy: number;
    col: number; // Grid coordinate X in the level map
    row: number; // Grid coordinate Y in the level map
}

/**
 * Corrupted Memory Sector hazard for the Virtual biome.
 * Toggles between active (deadly) and inactive states.
 */
export interface ICorruptedSector extends IEntity {
    isActive: boolean;
    timer: number;
    toggleInterval: number;
}

/**
 * Malware Node hazard for the Virtual biome.
 * Expands a deadly circle when the player gets too close.
 */
export interface IMalwareNode extends IEntity {
    radius: number;
    maxRadius: number;
    state: 'IDLE' | 'EXPANDING' | 'COOLDOWN';
    triggerDistance: number;
    cooldownTimer: number;
}

/**
 * Metadata for a level definition.
 */
export interface ILevel {
    level: number;
    biome: string; // 'sewer', 'mine', 'virtual', etc.
    isBoss: boolean;
    bossName?: string;
    map: string[]; // Raw ASCII or string-encoded tile data
}

/**
 * THE UNIVERSAL DATA STORE
 * IGlobals defines the shape of the 'G' object used for shared state.
 */
export interface IGlobals {
    gameState: GameState;
    activeValvePos: { x: number, y: number } | null;
    purifiedValves: { x: number, y: number }[];
    valveCutsceneTimer: number;
    introY: number; // Global scroll position for the intro sequence
    timer: number;
    timerAcc: number;
    winTimer: number;
    enemyWalkTimer: number; // Shared timer to sync bot animation frames
    currentLevel: number;
    initials: string[]; // High score name input buffer
    initialIndex: number; // Cursor in initials input
    gameStartTime: number;
    highScores: { name: string, score: number }[];
    isMusicPlaying: boolean;
    spacePressed: boolean;
    mapRows: number;
    mapCols: number;
    map: number[][]; // Decoded tile ID grid
    items: IItem[];
    enemies: IEnemy[];
    lasers: ILaser[];
    particles: IParticle[];
    platforms: IPlatform[];
    bombs: IBomb[];
    boss: IBoss;
    camera: ICamera;
    isMapCached: boolean;
    acidPurified: boolean;
    cleanedPipes: any[]; 
    audioCtx: AudioContext | null;
    _chk: number; // Score integrity check sum
    nextLaserIndex: number; // Cursor for circular projectile buffer
    nextParticleIndex: number; // Cursor for circular particle buffer
    checkpointPos: { x: number, y: number } | null;
    corruptedSectors: ICorruptedSector[];
    malwareNodes: IMalwareNode[];
    reflectors: IReflector[]; // Environmental mirror nodes
}

/**
 * Window augmentations for global engine access and development tools.
 */
declare global {
    interface Window {
        G: IGlobals;
        player: IPlayer;
        refreshLeaderboard: () => Promise<void>;
        saveScore: () => Promise<void>;
        parseMap: (fullReset?: boolean) => void;
        resetPlayerPosition: () => void;
        
        // Debug/Cheat Hooks:
        skipLevel: (n: number) => void;
        goToLevel: (n: number) => void;
        nextLevel: () => void;
        addLives: (n: number) => void;
        godMode: (on?: boolean) => void;
        
        staticLevels: ILevel[];
        logoImg?: HTMLImageElement;
        logoOsc?: HTMLCanvasElement;
        fetchHighScores?: () => Promise<{ initials: string, score: number }[]>;
        submitHighScore?: (initials: string, score: number, playtime: number) => Promise<void>;
    }
}

