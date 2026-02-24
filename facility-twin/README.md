# Facility Digital Twin — Phase 1

Interactive 3D digital twin of a manufacturing facility, built with [Babylon.js](https://www.babylonjs.com/).

## Features

- **60m x 40m facility** with concrete floor, walls, windows, ceiling light fixtures, and a loading dock
- **8 equipment pieces** — CNC machines, conveyor line, storage racks, assembly workbenches — all procedurally generated 3D geometry with billboard labels
- **Animated forklift** following a perimeter path with flashing beacon light
- **Animated worker** walking between stations with hard hat and walking-bob animation
- **Dual cameras** — first-person (WASD) and top-down orthographic overview
- **Click-to-select** equipment with highlight glow and info panel
- **HUD** with FPS counter, camera mode, simulation pause/resume
- **Shadow mapping** with blurred exponential shadow maps
- **Industrial lighting** — hemisphere fill + directional + 6 overhead point lights

## Quick Start

Serve the `facility-twin/` directory with any static HTTP server:

```bash
# Python
python3 -m http.server 8000 --directory facility-twin

# Node (npx)
npx serve facility-twin

# VS Code Live Server — open index.html
```

Open `http://localhost:8000` in a browser.

## Controls

| Input | Action |
|-------|--------|
| **WASD** | Move (first-person camera) |
| **Mouse** | Look around |
| **C** | Toggle camera (FPS / Overview) |
| **Space** | Pause / resume simulation |
| **Click** | Select equipment → info panel |

## Project Structure

```
facility-twin/
├── index.html              # HTML shell + Babylon.js CDN imports
├── app.js                  # Main entry (also inlined in index.html)
├── data/
│   └── layout.json         # Facility dimensions, equipment, paths, sim config
└── systems/
    ├── scene.js            # Scene, cameras, lighting, shadows, environment
    ├── floor.js            # Floor, walls, windows, ceiling, loading dock
    ├── equipment.js        # Procedural equipment meshes + selection highlight
    ├── pathFollower.js     # Forklift & worker waypoint animation
    └── gui.js              # HUD overlay, info panel, controls
```

## Configuration

Edit `data/layout.json` to change:
- `facility` — width/depth/height of the building
- `equipment[]` — add, remove, or reposition equipment
- `paths` — waypoints for forklift and worker routes
- `simulation` — movement speeds, pause durations

## Dependencies

All loaded via CDN (no build step):
- Babylon.js 7.x (core + GUI + loaders)

## Phase 2 Ideas

- Real-time sensor data via WebSocket
- Equipment status indicators (running/idle/fault)
- Heat map overlays
- Timeline playback with historical data
- Multi-floor support
