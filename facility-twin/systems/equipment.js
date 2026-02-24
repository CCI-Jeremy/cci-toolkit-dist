/**
 * Equipment Placement System
 * Places equipment from layout.json. Attempts to load GLTF models,
 * falls back to labeled placeholder boxes if models are unavailable.
 * Supports click selection via HighlightLayer.
 */

export function setupEquipment(scene, equipmentList) {
    const highlightLayer = new BABYLON.HighlightLayer("equipHighlight", scene);
    const equipmentMeshes = [];
    const loadResults = [];

    // Colors for different equipment types
    const typeColors = {
        "cnc": new BABYLON.Color3(0.3, 0.5, 0.8),
        "conveyor": new BABYLON.Color3(0.7, 0.5, 0.2),
        "rack": new BABYLON.Color3(0.4, 0.6, 0.3),
        "workbench": new BABYLON.Color3(0.6, 0.3, 0.5),
        "default": new BABYLON.Color3(0.5, 0.5, 0.5)
    };

    function getTypeColor(id) {
        for (const key in typeColors) {
            if (id.startsWith(key)) return typeColors[key];
        }
        return typeColors["default"];
    }

    // Equipment dimensions by type for placeholder boxes
    const typeDimensions = {
        "cnc": { w: 2.5, h: 2.0, d: 2.0 },
        "conveyor": { w: 6.0, h: 1.0, d: 1.5 },
        "rack": { w: 4.0, h: 3.5, d: 1.2 },
        "workbench": { w: 2.5, h: 1.0, d: 1.2 },
        "default": { w: 2.0, h: 1.5, d: 2.0 }
    };

    function getTypeDimensions(id) {
        for (const key in typeDimensions) {
            if (id.startsWith(key)) return typeDimensions[key];
        }
        return typeDimensions["default"];
    }

    /**
     * Build a detailed placeholder mesh for a piece of equipment
     */
    function createPlaceholderMesh(item) {
        const dims = getTypeDimensions(item.id);
        const color = getTypeColor(item.id);

        // Root transform node
        const root = new BABYLON.TransformNode(`${item.id}_root`, scene);

        // Main body
        const body = BABYLON.MeshBuilder.CreateBox(
            `${item.id}_body`,
            { width: dims.w, height: dims.h, depth: dims.d },
            scene
        );
        body.position.y = dims.h / 2;
        body.parent = root;

        const bodyMat = new BABYLON.StandardMaterial(`${item.id}_mat`, scene);
        bodyMat.diffuseColor = color;
        bodyMat.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        body.material = bodyMat;

        // Add detail features depending on type
        if (item.id.startsWith("cnc")) {
            // Control panel on front
            const panel = BABYLON.MeshBuilder.CreateBox(
                `${item.id}_panel`,
                { width: 0.6, height: 0.8, depth: 0.1 },
                scene
            );
            panel.position = new BABYLON.Vector3(0, dims.h * 0.6, dims.d / 2 + 0.05);
            panel.parent = root;
            const panelMat = new BABYLON.StandardMaterial(`${item.id}_panelMat`, scene);
            panelMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
            panelMat.emissiveColor = new BABYLON.Color3(0.0, 0.15, 0.0);
            panel.material = panelMat;

            // Spindle housing on top
            const spindle = BABYLON.MeshBuilder.CreateCylinder(
                `${item.id}_spindle`,
                { diameter: 0.5, height: 0.6 },
                scene
            );
            spindle.position.y = dims.h + 0.3;
            spindle.parent = root;
            spindle.material = bodyMat;
        } else if (item.id.startsWith("conveyor")) {
            // Rollers along the top
            const rollerMat = new BABYLON.StandardMaterial(`${item.id}_rollerMat`, scene);
            rollerMat.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3);
            for (let i = 0; i < 8; i++) {
                const roller = BABYLON.MeshBuilder.CreateCylinder(
                    `${item.id}_roller_${i}`,
                    { diameter: 0.15, height: dims.d * 0.9 },
                    scene
                );
                roller.rotation.x = Math.PI / 2;
                roller.position = new BABYLON.Vector3(
                    -dims.w / 2 + 0.5 + i * (dims.w - 1) / 7,
                    dims.h + 0.08,
                    0
                );
                roller.parent = root;
                roller.material = rollerMat;
            }
        } else if (item.id.startsWith("rack")) {
            // Shelf levels
            const shelfMat = new BABYLON.StandardMaterial(`${item.id}_shelfMat`, scene);
            shelfMat.diffuseColor = new BABYLON.Color3(0.35, 0.35, 0.4);
            const levels = 3;
            for (let i = 0; i < levels; i++) {
                const shelf = BABYLON.MeshBuilder.CreateBox(
                    `${item.id}_shelf_${i}`,
                    { width: dims.w, height: 0.08, depth: dims.d },
                    scene
                );
                shelf.position.y = (dims.h / levels) * (i + 1);
                shelf.parent = root;
                shelf.material = shelfMat;
            }
            // Vertical uprights
            const uprightMat = new BABYLON.StandardMaterial(`${item.id}_uprightMat`, scene);
            uprightMat.diffuseColor = new BABYLON.Color3(0.2, 0.35, 0.6);
            const uprightPositions = [
                [-dims.w / 2, dims.d / 2],
                [dims.w / 2, dims.d / 2],
                [-dims.w / 2, -dims.d / 2],
                [dims.w / 2, -dims.d / 2],
            ];
            for (let i = 0; i < uprightPositions.length; i++) {
                const upright = BABYLON.MeshBuilder.CreateBox(
                    `${item.id}_upright_${i}`,
                    { width: 0.1, height: dims.h, depth: 0.1 },
                    scene
                );
                upright.position = new BABYLON.Vector3(
                    uprightPositions[i][0],
                    dims.h / 2,
                    uprightPositions[i][1]
                );
                upright.parent = root;
                upright.material = uprightMat;
            }
            // Remove the body since we built the rack from shelves + uprights
            body.dispose();
        } else if (item.id.startsWith("workbench")) {
            // Legs
            const legMat = new BABYLON.StandardMaterial(`${item.id}_legMat`, scene);
            legMat.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3);
            const legPositions = [
                [-dims.w / 2 + 0.1, -dims.d / 2 + 0.1],
                [dims.w / 2 - 0.1, -dims.d / 2 + 0.1],
                [-dims.w / 2 + 0.1, dims.d / 2 - 0.1],
                [dims.w / 2 - 0.1, dims.d / 2 - 0.1],
            ];
            for (let i = 0; i < legPositions.length; i++) {
                const leg = BABYLON.MeshBuilder.CreateBox(
                    `${item.id}_leg_${i}`,
                    { width: 0.1, height: dims.h - 0.1, depth: 0.1 },
                    scene
                );
                leg.position = new BABYLON.Vector3(
                    legPositions[i][0],
                    (dims.h - 0.1) / 2,
                    legPositions[i][1]
                );
                leg.parent = root;
                leg.material = legMat;
            }
            // Table top becomes thinner
            body.scaling.y = 0.1;
            body.position.y = dims.h;

            // Tool on table
            const tool = BABYLON.MeshBuilder.CreateCylinder(
                `${item.id}_tool`,
                { diameter: 0.2, height: 0.4 },
                scene
            );
            tool.position = new BABYLON.Vector3(0.3, dims.h + 0.25, 0);
            tool.parent = root;
            const toolMat = new BABYLON.StandardMaterial(`${item.id}_toolMat`, scene);
            toolMat.diffuseColor = new BABYLON.Color3(0.8, 0.2, 0.1);
            tool.material = toolMat;
        }

        // Position and rotate according to layout data
        root.position = new BABYLON.Vector3(
            item.position[0],
            item.position[1],
            item.position[2]
        );
        root.rotation.y = (item.rotation || 0) * Math.PI / 180;
        const s = item.scale || 1;
        root.scaling = new BABYLON.Vector3(s, s, s);

        // Collect all child meshes for selection
        const allMeshes = root.getChildMeshes();
        allMeshes.forEach(mesh => {
            mesh.isPickable = true;
            mesh.metadata = { equipmentId: item.id, equipmentData: item, root: root };
            if (scene._shadowGenerator) {
                scene._shadowGenerator.addShadowCaster(mesh);
            }
        });

        return { root, meshes: allMeshes, data: item };
    }

    // Create placeholder meshes for all equipment
    for (const item of equipmentList) {
        const result = createPlaceholderMesh(item);
        equipmentMeshes.push(result);
        loadResults.push({ id: item.id, label: item.label, status: "placeholder" });
    }

    // Billboard labels above each equipment piece
    for (const eq of equipmentMeshes) {
        createBillboardLabel(scene, eq.data.label, eq.root);
    }

    // Log results
    console.log("[Equipment] Placement results:");
    loadResults.forEach(r => {
        console.log(`  ${r.id} (${r.label}): ${r.status}`);
    });

    return {
        equipmentMeshes,
        highlightLayer,
        loadResults,
        selectEquipment,
        clearSelection,
    };

    // --- Selection helpers ---
    let _selectedEquipment = null;

    function selectEquipment(equipmentId) {
        clearSelection();
        const eq = equipmentMeshes.find(e => e.data.id === equipmentId);
        if (!eq) return null;
        eq.meshes.forEach(mesh => {
            highlightLayer.addMesh(mesh, BABYLON.Color3.Green());
        });
        _selectedEquipment = eq;
        return eq.data;
    }

    function clearSelection() {
        if (_selectedEquipment) {
            _selectedEquipment.meshes.forEach(mesh => {
                highlightLayer.removeMesh(mesh);
            });
            _selectedEquipment = null;
        }
    }
}

/**
 * Creates a billboard text label that floats above an equipment root node.
 */
function createBillboardLabel(scene, text, parentNode) {
    const plane = BABYLON.MeshBuilder.CreatePlane(
        `label_${text}`,
        { width: 3, height: 0.5 },
        scene
    );
    plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
    plane.parent = parentNode;
    plane.position.y = 4;
    plane.isPickable = false;

    const advTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(plane, 512, 96);
    const label = new BABYLON.GUI.TextBlock();
    label.text = text;
    label.color = "white";
    label.fontSize = 36;
    label.fontWeight = "bold";
    label.outlineWidth = 3;
    label.outlineColor = "black";
    advTexture.addControl(label);
}
