# Grounded Enemies Rule

To maintain game integrity and visual realism, all enemies inside level map data must be grounded. Floating enemies are strictly prohibited.

## Core Requirement
Every enemy character in a level's `map` array must be placed directly on top of a solid tile.

- **Enemy Characters**: `8` (Bot), `L` (Laser Bot).
- **Solid Tiles**: `1` (Wall/Platform), `6` (Solid Biome Tile), `9` (Ladder+Platform).

## Validation Logic
For any enemy at `map[row][col]`, the tile at `map[row+1][col]` **MUST** be a solid tile.

## Examples
### ✅ Correct (Grounded)
```typescript
"000080000",
"000111000", // Solid platform below '8'
```

### ❌ Incorrect (Floating / Illegal)
```typescript
"000080000",
"000000000", // NO tile below '8'
```

```typescript
"000080000",
"000020000", // Ladder below '8' (Enemies cannot walk on ladders)
```

```typescript
"000080000",
"0000U0000", // Moving platform below '8' (Spawn point is static, enemy will the fall)
```

## Maintenance
- When updating `levels.ts` manually, always double-check the column alignment.
- When updating level generation scripts (e.g. `super_chaotic_boss_level.py`), explicitly validate `rows[r][c]` before placing an enemy at `rows[r-1][c]`.
