/**
 * Path Follower System
 * Animates a forklift and worker along waypoint paths defined in layout.json.
 * Uses procedural meshes for both entities.
 */

export function createPathFollowers(scene, pathsConfig, simConfig) {
    const followers = {};

    // ============ FORKLIFT ============
    if (pathsConfig.forklift) {
        const forklift = buildForklift(scene);
        const follower = new WaypointFollower(
            forklift,
            pathsConfig.forklift,
            simConfig.forkliftSpeed || 3.0,
            scene
        );
        followers.forklift = follower;
        if (scene._shadowGenerator) {
            scene._shadowGenerator.addShadowCaster(forklift, true);
        }
    }

    // ============ WORKER ============
    if (pathsConfig.worker) {
        const worker = buildWorker(scene);
        const follower = new WaypointFollower(
            worker,
            pathsConfig.worker,
            simConfig.workerSpeed || 1.2,
            scene,
            simConfig.workerPauseTime || 2.0
        );
        followers.worker = follower;
        if (scene._shadowGenerator) {
            scene._shadowGenerator.addShadowCaster(worker, true);
        }
    }

    console.log(`[PathFollower] Created ${Object.keys(followers).length} path followers`);
    return followers;
}

// ======================== WAYPOINT FOLLOWER ========================
class WaypointFollower {
    constructor(mesh, waypoints, speed, scene, pauseTime = 0) {
        this.mesh = mesh;
        this.waypoints = waypoints.map(
            (p) => new BABYLON.Vector3(p[0], p[1], p[2])
        );
        this.speed = speed;
        this.scene = scene;
        this.pauseTime = pauseTime;

        this._currentIndex = 0;
        this._t = 0;
        this._paused = false;
        this._pauseTimer = 0;
        this._running = true;

        // Place at first waypoint
        if (this.waypoints.length > 0) {
            this.mesh.position.copyFrom(this.waypoints[0]);
        }

        // Register update
        this._observer = scene.onBeforeRenderObservable.add(() => this.update());
    }

    update() {
        if (!this._running || this.waypoints.length < 2) return;
        const dt = this.scene.getEngine().getDeltaTime() / 1000;

        // Handle pause at waypoints
        if (this._paused) {
            this._pauseTimer -= dt;
            if (this._pauseTimer <= 0) {
                this._paused = false;
            }
            return;
        }

        const from = this.waypoints[this._currentIndex];
        const to = this.waypoints[(this._currentIndex + 1) % this.waypoints.length];
        const segmentLength = BABYLON.Vector3.Distance(from, to);

        if (segmentLength < 0.01) {
            this._advance();
            return;
        }

        this._t += (this.speed * dt) / segmentLength;

        if (this._t >= 1) {
            this._t = 0;
            this._advance();
            return;
        }

        // Interpolate position
        BABYLON.Vector3.LerpToRef(from, to, this._t, this.mesh.position);
        // Keep Y grounded
        this.mesh.position.y = from.y;

        // Face direction of travel
        const dir = to.subtract(from);
        if (dir.length() > 0.01) {
            const angle = Math.atan2(dir.x, dir.z);
            this.mesh.rotation.y = angle;
        }
    }

    _advance() {
        this._currentIndex = (this._currentIndex + 1) % this.waypoints.length;
        this._t = 0;

        // Pause at waypoint if configured
        if (this.pauseTime > 0) {
            this._paused = true;
            this._pauseTimer = this.pauseTime;
        }
    }

    /** Pause/resume the follower */
    togglePause() {
        this._running = !this._running;
    }

    get isRunning() {
        return this._running;
    }

    dispose() {
        if (this._observer) {
            this.scene.onBeforeRenderObservable.remove(this._observer);
        }
    }
}

// ======================== FORKLIFT MESH ========================
function buildForklift(scene) {
    const root = new BABYLON.TransformNode("forklift", scene);

    const bodyMat = new BABYLON.StandardMaterial("forkliftBodyMat", scene);
    bodyMat.diffuseColor = new BABYLON.Color3(0.85, 0.6, 0.05);

    // Main body
    const body = BABYLON.MeshBuilder.CreateBox("forklift_body", {
        width: 1.2, height: 1.0, depth: 2.0
    }, scene);
    body.position = new BABYLON.Vector3(0, 0.7, 0);
    body.parent = root;
    body.material = bodyMat;

    // Driver cabin
    const cabin = BABYLON.MeshBuilder.CreateBox("forklift_cabin", {
        width: 1.1, height: 1.0, depth: 1.0
    }, scene);
    cabin.position = new BABYLON.Vector3(0, 1.4, -0.3);
    cabin.parent = root;
    cabin.material = bodyMat;

    // Cabin roof
    const roof = BABYLON.MeshBuilder.CreateBox("forklift_roof", {
        width: 1.3, height: 0.08, depth: 1.3
    }, scene);
    roof.position = new BABYLON.Vector3(0, 1.95, -0.3);
    roof.parent = root;

    const roofMat = new BABYLON.StandardMaterial("forkliftRoofMat", scene);
    roofMat.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3);
    roof.material = roofMat;

    // Forks (front)
    const forkMat = new BABYLON.StandardMaterial("forkMat", scene);
    forkMat.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4);
    forkMat.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);

    for (const offset of [-0.35, 0.35]) {
        // Vertical mast
        const mast = BABYLON.MeshBuilder.CreateBox(`forklift_mast_${offset}`, {
            width: 0.08, height: 1.8, depth: 0.08
        }, scene);
        mast.position = new BABYLON.Vector3(offset, 1.1, 1.05);
        mast.parent = root;
        mast.material = forkMat;

        // Fork tine
        const tine = BABYLON.MeshBuilder.CreateBox(`forklift_tine_${offset}`, {
            width: 0.1, height: 0.06, depth: 1.0
        }, scene);
        tine.position = new BABYLON.Vector3(offset, 0.25, 1.5);
        tine.parent = root;
        tine.material = forkMat;
    }

    // Wheels (4)
    const wheelMat = new BABYLON.StandardMaterial("forkliftWheelMat", scene);
    wheelMat.diffuseColor = new BABYLON.Color3(0.15, 0.15, 0.15);

    const wheelPositions = [
        [-0.65, 0.2, 0.7],
        [0.65, 0.2, 0.7],
        [-0.55, 0.2, -0.7],
        [0.55, 0.2, -0.7],
    ];
    for (let i = 0; i < wheelPositions.length; i++) {
        const wheel = BABYLON.MeshBuilder.CreateCylinder(`forklift_wheel_${i}`, {
            diameter: 0.4, height: 0.2
        }, scene);
        wheel.rotation.z = Math.PI / 2;
        wheel.position = new BABYLON.Vector3(...wheelPositions[i]);
        wheel.parent = root;
        wheel.material = wheelMat;
    }

    // Flashing light on top
    const flashLight = BABYLON.MeshBuilder.CreateSphere("forklift_flash", {
        diameter: 0.2
    }, scene);
    flashLight.position = new BABYLON.Vector3(0, 2.1, -0.3);
    flashLight.parent = root;

    const flashMat = new BABYLON.StandardMaterial("flashMat", scene);
    flashMat.diffuseColor = new BABYLON.Color3(1, 0.5, 0);
    flashMat.emissiveColor = new BABYLON.Color3(0.8, 0.4, 0);
    flashLight.material = flashMat;

    // Animate the flash
    let flashPhase = 0;
    scene.onBeforeRenderObservable.add(() => {
        flashPhase += scene.getEngine().getDeltaTime() / 1000 * 4;
        const v = (Math.sin(flashPhase) + 1) * 0.5;
        flashMat.emissiveColor = new BABYLON.Color3(v * 0.8, v * 0.4, 0);
    });

    root.metadata = { label: "Forklift", type: "vehicle" };
    return root;
}

// ======================== WORKER MESH ========================
function buildWorker(scene) {
    const root = new BABYLON.TransformNode("worker", scene);

    // Body (torso)
    const torsoMat = new BABYLON.StandardMaterial("workerTorsoMat", scene);
    torsoMat.diffuseColor = new BABYLON.Color3(0.1, 0.3, 0.7);

    const torso = BABYLON.MeshBuilder.CreateCylinder("worker_torso", {
        diameterTop: 0.3, diameterBottom: 0.35, height: 0.7
    }, scene);
    torso.position = new BABYLON.Vector3(0, 1.15, 0);
    torso.parent = root;
    torso.material = torsoMat;

    // Head
    const headMat = new BABYLON.StandardMaterial("workerHeadMat", scene);
    headMat.diffuseColor = new BABYLON.Color3(0.85, 0.7, 0.55);

    const head = BABYLON.MeshBuilder.CreateSphere("worker_head", {
        diameter: 0.3
    }, scene);
    head.position = new BABYLON.Vector3(0, 1.65, 0);
    head.parent = root;
    head.material = headMat;

    // Hard hat
    const hatMat = new BABYLON.StandardMaterial("workerHatMat", scene);
    hatMat.diffuseColor = new BABYLON.Color3(0.9, 0.8, 0.1);

    const hat = BABYLON.MeshBuilder.CreateCylinder("worker_hat", {
        diameterTop: 0.15, diameterBottom: 0.35, height: 0.12
    }, scene);
    hat.position = new BABYLON.Vector3(0, 1.82, 0);
    hat.parent = root;
    hat.material = hatMat;

    const hatBrim = BABYLON.MeshBuilder.CreateCylinder("worker_hatBrim", {
        diameterTop: 0.4, diameterBottom: 0.4, height: 0.03
    }, scene);
    hatBrim.position = new BABYLON.Vector3(0, 1.77, 0);
    hatBrim.parent = root;
    hatBrim.material = hatMat;

    // Legs
    const legMat = new BABYLON.StandardMaterial("workerLegMat", scene);
    legMat.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.25);

    for (const xOff of [-0.1, 0.1]) {
        const leg = BABYLON.MeshBuilder.CreateCylinder(`worker_leg_${xOff}`, {
            diameter: 0.14, height: 0.8
        }, scene);
        leg.position = new BABYLON.Vector3(xOff, 0.4, 0);
        leg.parent = root;
        leg.material = legMat;
    }

    // Walking bob animation
    let walkPhase = 0;
    scene.onBeforeRenderObservable.add(() => {
        walkPhase += scene.getEngine().getDeltaTime() / 1000 * 6;
        root.position.y = Math.abs(Math.sin(walkPhase)) * 0.05;
    });

    root.metadata = { label: "Worker", type: "person" };
    return root;
}
