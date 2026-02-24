/**
 * Floor & Walls System
 * Builds the facility shell: floor, walls, ceiling, windows, loading dock, light fixtures.
 * All dimensions driven by the facility config from layout.json.
 */

export function buildFacility(scene, facilityConfig) {
    const { width, depth, height } = facilityConfig;
    const wallThickness = 0.3;
    const wallColor = new BABYLON.Color3(0.55, 0.55, 0.55);
    const shadowGen = scene._shadowGenerator;

    // ==================== FLOOR ====================
    const floor = BABYLON.MeshBuilder.CreateGround(
        "floor",
        { width, height: depth, subdivisions: 4 },
        scene
    );
    floor.position = new BABYLON.Vector3(width / 2, 0, depth / 2);
    floor.receiveShadows = true;

    // Procedural grid/concrete material
    const floorMat = new BABYLON.StandardMaterial("floorMat", scene);
    const floorTexture = new BABYLON.DynamicTexture("floorDynTex", 512, scene, true);
    const ctx = floorTexture.getContext();
    // Draw concrete-like grid
    ctx.fillStyle = "#6b6b6b";
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = "#5a5a5a";
    ctx.lineWidth = 2;
    const gridSize = 32;
    for (let x = 0; x < 512; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 512);
        ctx.stroke();
    }
    for (let y = 0; y < 512; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(512, y);
        ctx.stroke();
    }
    // Add some noise-like speckles
    for (let i = 0; i < 2000; i++) {
        const rx = Math.random() * 512;
        const ry = Math.random() * 512;
        const brightness = 90 + Math.floor(Math.random() * 30);
        ctx.fillStyle = `rgb(${brightness},${brightness},${brightness})`;
        ctx.fillRect(rx, ry, 2, 2);
    }
    floorTexture.update();
    floorMat.diffuseTexture = floorTexture;
    floorMat.diffuseTexture.uScale = width / 4;
    floorMat.diffuseTexture.vScale = depth / 4;
    floorMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    floor.material = floorMat;

    // ==================== WALLS ====================
    const wallMat = new BABYLON.StandardMaterial("wallMat", scene);
    wallMat.diffuseColor = wallColor;
    wallMat.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05);

    function createWall(name, w, h, d, pos) {
        const wall = BABYLON.MeshBuilder.CreateBox(name, { width: w, height: h, depth: d }, scene);
        wall.position = new BABYLON.Vector3(pos[0], pos[1], pos[2]);
        wall.material = wallMat;
        wall.receiveShadows = true;
        return wall;
    }

    // Back wall (z = 0)
    createWall("wallBack", width, height, wallThickness, [width / 2, height / 2, 0]);
    // Front wall (z = depth) — with loading dock opening
    // Left section of front wall
    createWall("wallFrontLeft", width * 0.35, height, wallThickness, [width * 0.175, height / 2, depth]);
    // Right section of front wall
    createWall("wallFrontRight", width * 0.35, height, wallThickness, [width - width * 0.175, height / 2, depth]);
    // Top section above loading dock
    createWall("wallFrontTop", width * 0.3, height * 0.35, wallThickness, [width / 2, height * 0.825, depth]);

    // Left wall (x = 0) — the window wall
    // Build left wall in sections with window openings
    const windowCount = 4;
    const windowWidth = 3;
    const windowHeight = 3;
    const windowBottom = 2;
    const wallSectionWidth = depth / (windowCount + 1);
    // Bottom strip
    createWall("leftWallBottom", wallThickness, windowBottom, depth, [0, windowBottom / 2, depth / 2]);
    // Top strip
    const topStripH = height - windowBottom - windowHeight;
    createWall("leftWallTop", wallThickness, topStripH, depth, [0, windowBottom + windowHeight + topStripH / 2, depth / 2]);
    // Sections between windows
    for (let i = 0; i <= windowCount; i++) {
        const sectionZ = (i * depth) / windowCount;
        const sectionDepth = (depth / windowCount) - windowWidth;
        if (sectionDepth > 0) {
            createWall(
                `leftWallSection_${i}`,
                wallThickness,
                windowHeight,
                sectionDepth,
                [0, windowBottom + windowHeight / 2, sectionZ + sectionDepth / 2]
            );
        }
    }

    // Window panes (transparent)
    const windowMat = new BABYLON.StandardMaterial("windowMat", scene);
    windowMat.diffuseColor = new BABYLON.Color3(0.6, 0.75, 0.9);
    windowMat.alpha = 0.25;
    windowMat.specularColor = new BABYLON.Color3(0.8, 0.8, 0.8);
    windowMat.backFaceCulling = false;

    for (let i = 0; i < windowCount; i++) {
        const wz = ((i + 0.5) * depth) / windowCount;
        const windowPane = BABYLON.MeshBuilder.CreatePlane(
            `window_${i}`,
            { width: windowHeight, height: windowWidth },
            scene
        );
        windowPane.position = new BABYLON.Vector3(0.01, windowBottom + windowHeight / 2, wz);
        windowPane.rotation.y = Math.PI / 2;
        windowPane.material = windowMat;
    }

    // Right wall (x = width)
    createWall("wallRight", wallThickness, height, depth, [width, height / 2, depth / 2]);

    // ==================== CEILING ====================
    const ceiling = BABYLON.MeshBuilder.CreateGround(
        "ceiling",
        { width, height: depth },
        scene
    );
    ceiling.position = new BABYLON.Vector3(width / 2, height, depth / 2);
    ceiling.rotation.x = Math.PI; // Flip to face downward
    const ceilingMat = new BABYLON.StandardMaterial("ceilingMat", scene);
    ceilingMat.diffuseColor = new BABYLON.Color3(0.45, 0.45, 0.45);
    ceilingMat.specularColor = new BABYLON.Color3(0, 0, 0);
    ceiling.material = ceilingMat;

    // ==================== CEILING LIGHT FIXTURES ====================
    const fixtureMat = new BABYLON.StandardMaterial("fixtureMat", scene);
    fixtureMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
    fixtureMat.emissiveColor = new BABYLON.Color3(1, 0.95, 0.85);

    const fixtureCols = 3;
    const fixtureRows = 2;
    for (let i = 0; i < fixtureCols; i++) {
        for (let j = 0; j < fixtureRows; j++) {
            const fx = (width / (fixtureCols + 1)) * (i + 1);
            const fz = (depth / (fixtureRows + 1)) * (j + 1);
            const fixture = BABYLON.MeshBuilder.CreateBox(
                `fixture_${i}_${j}`,
                { width: 2.5, height: 0.15, depth: 0.6 },
                scene
            );
            fixture.position = new BABYLON.Vector3(fx, height - 0.1, fz);
            fixture.material = fixtureMat;
        }
    }

    // ==================== LOADING DOCK ====================
    // Recessed floor section at the front-center
    const dockWidth = width * 0.3;
    const dockDepth = 4;
    const dockRecess = 0.8;
    const dock = BABYLON.MeshBuilder.CreateGround(
        "loadingDock",
        { width: dockWidth, height: dockDepth },
        scene
    );
    dock.position = new BABYLON.Vector3(width / 2, -dockRecess, depth - dockDepth / 2);
    const dockMat = new BABYLON.StandardMaterial("dockMat", scene);
    dockMat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.45);
    dock.material = dockMat;
    dock.receiveShadows = true;

    // Dock ramp
    const ramp = BABYLON.MeshBuilder.CreateGround(
        "dockRamp",
        { width: dockWidth, height: 2 },
        scene
    );
    ramp.position = new BABYLON.Vector3(width / 2, -dockRecess / 2, depth - dockDepth - 1);
    ramp.rotation.x = Math.atan2(dockRecess, 2);
    ramp.material = dockMat;

    // Yellow safety striping on dock edge
    const stripeMat = new BABYLON.StandardMaterial("stripeMat", scene);
    stripeMat.diffuseColor = new BABYLON.Color3(0.9, 0.8, 0.1);
    stripeMat.emissiveColor = new BABYLON.Color3(0.3, 0.25, 0);
    const stripe = BABYLON.MeshBuilder.CreateBox(
        "dockStripe",
        { width: dockWidth, height: 0.05, depth: 0.2 },
        scene
    );
    stripe.position = new BABYLON.Vector3(width / 2, 0.02, depth - dockDepth);
    stripe.material = stripeMat;

    console.log("[Floor] Facility shell built: " +
        `${width}m × ${depth}m × ${height}m, ` +
        `${windowCount} windows, loading dock, ${fixtureCols * fixtureRows} ceiling fixtures`);

    return { floor, dock };
}
