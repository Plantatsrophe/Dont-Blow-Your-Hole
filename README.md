# Don't Blow Your Hole - A GRFC™ Game

A completely native, zero-dependency, intense 8-bit web browser platformer scaling across an incredible 100 hand-crafted static maps, featuring dynamically generated Synthwave audio, tracking Laser Bots, and a classic arcade High-Score structure natively persisting to your browser's local storage.

## Setup & Play
All you need is a browser. There are no Webpack builds or Node modules required. 
Simply open `index.html` natively inside Chrome, Edge, or Firefox and press **Enter** to start!

## Controls
* **Movement:** `W,A,S,D` or `Arrow Keys`
* **Jump:** `Spacebar` (Tap twice to gracefully Execute a Double-Jump) 
* **UI Navigation:** `Arrow Keys` to scroll initials, `Enter` to lock them in! 

## Core Mechanics
- **100 Dynamic Levels**: The game structurally scales over 100 grueling gauntlets mapped physically to 15x100 column arrays. The density of lethal Floor Spikes, Platform jumps, and Vertical ladders organically scales the longer you survive mathematically!
- **Enemies & Combat**: Features standard roaming Bots and heavily armed, stationary Laser Bots that natively track your geographical coordinates firing lethal energy beams. Stomp them exclusively from directly overhead to critically score `+200pts`.
- **Items**: Snag Cash (`+1000pts`) floating near vertical platforms, or discover Hotdogs securely giving you `+1` Life buff to your structural reserves.

## Codebase Architecture
The engine explicitly separates raw game logic natively across multiple structural script imports cleanly:

* `index.html` - The Master DOM entry point declaring the `gameCanvas` mathematically.
* `game.js` - Global Event Listeners, State Transitions, and the native Object Engine mechanically pushing AI processing cleanly.
* `physics.js` - Sweeping AABB geometries securely managing dynamic gravity, momentum checking natively verifying `map` boundaries.
* `render.js` - Highly optimized array mappings natively executing sub-pixel renders dynamically spanning Parallax gradients linearly.
* `assets.js` - Lightweight native index arrays mathematically storing pure CSS hex codes to draw pixel graphics securely natively entirely without external image packages. 
* `audio.js` - Fully custom `125BPM` Web Audio API Sequence Synthesizer mechanically playing Castlevania-style tracker hooks natively directly using deep sine/square oscillators cleanly.
* `globals.js` - Dedicated memory bounds locally referencing universal engine arrays. 
* `levels.js` - 100 generated massive 15x100 exact raw string structures actively parsed exactly block by block correctly structurally initializing maps.
* `style.css` - Raw web typography logic structurally.

## Generating Custom Maps
If you want to edit the structural layout of the entire 100 map gauntlet organically, do not manually edit the raw `levels.js` variables securely! Instead, natively deploy the custom Python map engine:
```bash
python generate_levels.py
```
This stochastically generates entirely fresh maps injecting hazards and  Bots  