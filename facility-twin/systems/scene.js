/**
 * Scene Setup System
 * Handles scene creation, lighting, cameras, and environment.
 */

export function createScene(engine, canvas, facilityConfig) {
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3(0.1, 0.1, 0.12);
    scene.ambientColor = new BABYLON.Color3(0.4, 0.38, 0.35);
    scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
    scene.fogColor = new BABYLON.Color3(0.1, 0.1, 0.12);
    scene.fogStart = 50;
    scene.fogEnd = 120;

    const { width, depth, height } = facilityConfig;

    // --- First-Person Free Camera (default) ---
    const fpsCamera = new BABYLON.FreeCamera(
        "fpsCamera",
        new BABYLON.Vector3(width / 2, height * 0.6, -5),
        scene
    );
    fpsCamera.setTarget(new BABYLON.Vector3(width / 2, 2, depth / 2));
    fpsCamera.attachControl(canvas, true);
    fpsCamera.speed = 0.8;
    fpsCamera.angularSensibility = 3000;
    fpsCamera.keysUp = [87];    // W
    fpsCamera.keysDown = [83];  // S
    fpsCamera.keysLeft = [65];  // A
    fpsCamera.keysRight = [68]; // D
    fpsCamera.minZ = 0.1;

    // --- Top-Down Orthographic Camera ---
    const orthoHalfWidth = width * 0.6;
    const orthoHalfDepth = depth * 0.6;
    const topCamera = new BABYLON.FreeCamera(
        "topCamera",
        new BABYLON.Vector3(width / 2, height * 4, depth / 2),
        scene
    );
    topCamera.setTarget(new BABYLON.Vector3(width / 2, 0, depth / 2));
    topCamera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
    topCamera.orthoLeft = -orthoHalfWidth;
    topCamera.orthoRight = orthoHalfWidth;
    topCamera.orthoTop = orthoHalfDepth;
    topCamera.orthoBottom = -orthoHalfDepth;
    topCamera.minZ = 0.1;
    // No controls attached — static overview

    scene.activeCamera = fpsCamera;

    // Camera state tracking
    scene._cameraMode = "fps"; // "fps" or "overview"
    scene._fpsCamera = fpsCamera;
    scene._topCamera = topCamera;

    scene.toggleCamera = function () {
        if (scene._cameraMode === "fps") {
            scene.activeCamera.detachControl(canvas);
            scene.activeCamera = topCamera;
            scene._cameraMode = "overview";
        } else {
            scene.activeCamera = fpsCamera;
            fpsCamera.attachControl(canvas, true);
            scene._cameraMode = "fps";
        }
    };

    // --- Lighting ---

    // Hemisphere (ambient fill)
    const hemiLight = new BABYLON.HemisphericLight(
        "hemiLight",
        new BABYLON.Vector3(0, 1, 0),
        scene
    );
    hemiLight.intensity = 0.4;
    hemiLight.diffuse = new BABYLON.Color3(1, 0.95, 0.9);
    hemiLight.groundColor = new BABYLON.Color3(0.2, 0.2, 0.25);

    // Directional light for shadows
    const dirLight = new BABYLON.DirectionalLight(
        "dirLight",
        new BABYLON.Vector3(-0.5, -1, 0.5),
        scene
    );
    dirLight.position = new BABYLON.Vector3(width / 2, height + 5, -5);
    dirLight.intensity = 0.3;

    // Shadow generator
    const shadowGenerator = new BABYLON.ShadowGenerator(1024, dirLight);
    shadowGenerator.useBlurExponentialShadowMap = true;
    shadowGenerator.blurKernel = 16;
    scene._shadowGenerator = shadowGenerator;

    // 6 overhead industrial point lights
    const lightSpacing = width / 4;
    const lightDepthSpacing = depth / 3;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 2; j++) {
            const px = lightSpacing * (i + 1);
            const pz = lightDepthSpacing * (j + 1);
            const pl = new BABYLON.PointLight(
                `overheadLight_${i}_${j}`,
                new BABYLON.Vector3(px, height - 0.5, pz),
                scene
            );
            pl.intensity = 0.6;
            pl.diffuse = new BABYLON.Color3(1, 0.95, 0.85);
            pl.range = 30;
        }
    }

    // --- Environment helper for sky / reflections ---
    scene.createDefaultEnvironment({
        createGround: false,
        createSkybox: true,
        skyboxSize: 200,
        skyboxColor: new BABYLON.Color3(0.05, 0.05, 0.08),
    });

    return scene;
}
