# DON'T DIE 💀 (v309)

**Brutal. Zero-Dependency. Pure TypeScript.**
100 levels of pixel-perfect platforming pain, now fully refactored and organized for maximum performance. This isn't your average browser game; it's a lean, mean, 60-FPS machine.

## The Mission
1. Get Hotdog and Fudge back to the show 2. Don't Die

## How to Play
1. Fire up `index.html` in any modern browser.
2. Smash **Enter** to start (if you've got the guts).
3. Stomp enemies, avoid obstacles. 
4. Reach the exit portal in each level before time runs out.
5. Don't Die.

### The Controls
*   **Move:** `W,A,S,D` or `Arrow Keys`
*   **Jump:** `Spacebar` (Double-tap for a mid-air boost)
*   **Enter:** Confirm your initials and claim your spot on the leaderboard.

---

## 5 Biomes, 100 Levels of Hell
We've built five distinct zones, each with its own special brand of misery:

1.  **Industrial Slums (LVL 00-19)**: The tutorial. Get used to the gravity and the bots. 
2.  **Toxic Sewers (LVL 20-39)**: Watch your step in the green sludge. This biome introduced our **Valve Purification** mechanics—clean the pipes or pay the price.
3.  **The Deep Mines (LVL 40-59)**: Verticality is the name of the game here. We pushed the engine to handle massive vertical scrolls and moving elevator platforms.
4.  **Virtual Mainframe (LVL 60-79)**: Neon-soaked digital madness. Watch out for specialized hazards and the **Glitch effects** that'll mess with your vision.
5.  **H311 (LVL 80-99)**: The final gauntlet. High heat, fast lasers, and no room for error.

---

## The Boss Logs (The Heavy Hitters)
We've hand-coded five major boss encounters that'll push any player to the limit:

*   **Masticator (Level 19)**: The gatekeeper of the Slums. This biting machine is your introduction to the boss engine—watch the teeth or get crunched.
*   **Septicus (Level 39)**: The Sewer King. You can't just jump on this guy. You'll need to use the environment, purify the valves, and avoid his toxic spray while he tries to drown the arena.
*   **Auh-Gr (Level 59)**: A massive construction mech that forces you into a high-speed vertical ascent. One slip and you're scrap metal.
*   **The Glitch (Level 79)**: The final digital nightmare. This fight breaks the physics engine—literally. Specialized arena-building logic and CPU-melting fiber effects make this the ultimate test.
*   **Baphometron (Level 99)**: The ultimate encounter. A colossal tank in the heart of H311. If you can survive this, you've earned your place among the legends.

---

## Under The Hood (For the Real Devs)
We've recently gutted the engine and rebuilt it from the ground up to be modular and blazing fast.

### The Architecture
*   **Modular Design**: Every logic and rendering file is kept under 150 lines to keep things lean.
*   **Logical Hierarchy**: 
    - [/src/core/](file:///e:/Dont%20Die/src/core/): The engine kernel and input systems.
    - [/src/physics/](file:///e:/Dont%20Die/src/physics/): Core movement, AABB collision, and Boss AI.
    - [/src/render/](file:///e:/Dont%20Die/src/render/): Categorized visual pipelines (Actors, Environment, Utils).
    - [/src/logic/](file:///e:/Dont%20Die/src/logic/): High-level game flow and spawning systems.

### Turbo-Charged Features
*   **Object Pooling**: We pre-allocate circular buffers for **500+ particles** and **50+ lasers**. No garbage collection spikes here—just smooth sprites.
*   **Spatial Grid Partitioning**: The engine handles 100+ entities by only checking collisions for nearby objects. Modern tech for a retro soul.
*   **Pre-rendered Map Cache**: We blit the static world geometry to an offscreen buffer. The browser only draws the tiles once per level change, keeping the draw calls near-zero during gameplay.
*   **Procedural Synth Engine**: All music and SFX are generated in real-time via the Web Audio API. No bulky assets—just pure math.
*   **Firebase Integration**: Secure global high-scores with integrity checksums to keep the cheaters at bay.


*Good luck, pilot. You're gonna need it.*
