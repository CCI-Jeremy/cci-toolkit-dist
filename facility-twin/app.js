/**
 * Facility Digital Twin — Main Entry Point
 * Orchestrates scene creation, facility construction, equipment placement,
 * path followers, and GUI initialization.
 */

import { createScene } from "./systems/scene.js";
import { buildFacility } from "./systems/floor.js";
import { setupEquipment } from "./systems/equipment.js";
import { createPathFollowers } from "./systems/pathFollower.js";
import { buildGUI } from "./systems/gui.js";

async function main() {
    // Load layout data
    const layoutResp = await fetch("./data/layout.json");
    const layout = await layoutResp.json();

    // Canvas and engine
    const canvas = document.getElementById("renderCanvas");
    const engine = new BABYLON.Engine(canvas, true, {
        preserveDrawingBuffer: true,
        stencil: true,
    });

    // 1. Scene
    const scene = createScene(engine, canvas, layout.facility);

    // 2. Facility shell (floor, walls, ceiling)
    buildFacility(scene, layout.facility);

    // 3. Equipment
    const equipmentSystem = setupEquipment(scene, layout.equipment);

    // 4. Path followers (forklift, worker)
    const pathFollowers = createPathFollowers(
        scene,
        layout.paths,
        layout.simulation
    );

    // 5. GUI / HUD
    buildGUI(scene, equipmentSystem, pathFollowers);

    // --- Render loop ---
    engine.runRenderLoop(() => {
        scene.render();
    });

    // --- Resize handling ---
    window.addEventListener("resize", () => {
        engine.resize();
    });

    console.log("[App] Facility Digital Twin initialized successfully.");
}

main().catch((err) => {
    console.error("[App] Fatal error during initialization:", err);
    document.getElementById("loadingOverlay").innerHTML =
        `<div style="color:#f44;font-size:18px;padding:40px;">
            Error: ${err.message}<br><br>
            <small>Check the browser console for details.</small>
        </div>`;
});
