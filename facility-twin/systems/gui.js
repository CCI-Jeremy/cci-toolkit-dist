/**
 * GUI / HUD System
 * Builds Babylon.js GUI overlay: equipment info panel, camera toggle button,
 * simulation play/pause, and a heads-up status bar.
 */

export function buildGUI(scene, equipmentSystem, pathFollowers) {
    const advTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true, scene);

    // ==================== INFO PANEL (right side) ====================
    const infoPanel = new BABYLON.GUI.Rectangle("infoPanel");
    infoPanel.width = "280px";
    infoPanel.height = "220px";
    infoPanel.cornerRadius = 8;
    infoPanel.color = "#4af";
    infoPanel.thickness = 2;
    infoPanel.background = "rgba(0, 0, 0, 0.75)";
    infoPanel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    infoPanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    infoPanel.top = "20px";
    infoPanel.left = "-20px";
    infoPanel.isVisible = false;
    advTexture.addControl(infoPanel);

    const infoStack = new BABYLON.GUI.StackPanel();
    infoStack.paddingTop = "10px";
    infoStack.paddingLeft = "12px";
    infoStack.paddingRight = "12px";
    infoPanel.addControl(infoStack);

    const infoTitle = new BABYLON.GUI.TextBlock("infoTitle", "Equipment");
    infoTitle.color = "#4af";
    infoTitle.fontSize = 20;
    infoTitle.fontWeight = "bold";
    infoTitle.height = "30px";
    infoTitle.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    infoStack.addControl(infoTitle);

    const infoId = makeInfoLine("ID: —");
    const infoType = makeInfoLine("Type: —");
    const infoPos = makeInfoLine("Pos: —");
    const infoStatus = makeInfoLine("Status: Operational");
    infoStack.addControl(infoId);
    infoStack.addControl(infoType);
    infoStack.addControl(infoPos);
    infoStack.addControl(infoStatus);

    function makeInfoLine(text) {
        const tb = new BABYLON.GUI.TextBlock();
        tb.text = text;
        tb.color = "#ccc";
        tb.fontSize = 14;
        tb.height = "24px";
        tb.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        return tb;
    }

    function showEquipmentInfo(data) {
        infoPanel.isVisible = true;
        infoTitle.text = data.label || data.id;
        infoId.text = `ID: ${data.id}`;
        const type = data.id.split("-")[0];
        infoType.text = `Type: ${type.charAt(0).toUpperCase() + type.slice(1)}`;
        infoPos.text = `Pos: (${data.position[0]}, ${data.position[1]}, ${data.position[2]})`;
        infoStatus.text = "Status: Operational";
    }

    function hideEquipmentInfo() {
        infoPanel.isVisible = false;
    }

    // ==================== CLICK HANDLER ====================
    scene.onPointerDown = function (_evt, pickResult) {
        if (pickResult.hit && pickResult.pickedMesh) {
            const meta = pickResult.pickedMesh.metadata;
            if (meta && meta.equipmentId) {
                const eqData = equipmentSystem.selectEquipment(meta.equipmentId);
                if (eqData) showEquipmentInfo(eqData);
            } else {
                equipmentSystem.clearSelection();
                hideEquipmentInfo();
            }
        } else {
            equipmentSystem.clearSelection();
            hideEquipmentInfo();
        }
    };

    // ==================== BUTTON BAR (top-left) ====================
    const btnBar = new BABYLON.GUI.StackPanel("btnBar");
    btnBar.isVertical = false;
    btnBar.height = "44px";
    btnBar.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    btnBar.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    btnBar.top = "16px";
    btnBar.left = "16px";
    advTexture.addControl(btnBar);

    // Camera toggle
    const cameraBtn = makeButton("cameraBtn", "Camera: FPS", () => {
        scene.toggleCamera();
        cameraBtn.children[0].text =
            scene._cameraMode === "fps" ? "Camera: FPS" : "Camera: Overview";
    });
    btnBar.addControl(cameraBtn);

    // Play / Pause simulation
    let simRunning = true;
    const simBtn = makeButton("simBtn", "Pause Sim", () => {
        simRunning = !simRunning;
        simBtn.children[0].text = simRunning ? "Pause Sim" : "Resume Sim";
        if (pathFollowers) {
            Object.values(pathFollowers).forEach((f) => f.togglePause());
        }
    });
    btnBar.addControl(simBtn);

    function makeButton(name, label, onClick) {
        const btn = BABYLON.GUI.Button.CreateSimpleButton(name, label);
        btn.width = "140px";
        btn.height = "38px";
        btn.color = "#fff";
        btn.cornerRadius = 6;
        btn.background = "rgba(50,50,70,0.85)";
        btn.paddingRight = "8px";
        btn.fontSize = 14;
        btn.onPointerUpObservable.add(onClick);

        // Hover effect
        btn.onPointerEnterObservable.add(() => {
            btn.background = "rgba(70,140,255,0.85)";
        });
        btn.onPointerOutObservable.add(() => {
            btn.background = "rgba(50,50,70,0.85)";
        });

        return btn;
    }

    // ==================== STATUS BAR (bottom) ====================
    const statusBar = new BABYLON.GUI.Rectangle("statusBar");
    statusBar.width = 1;
    statusBar.height = "32px";
    statusBar.background = "rgba(0, 0, 0, 0.6)";
    statusBar.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    statusBar.thickness = 0;
    advTexture.addControl(statusBar);

    const statusText = new BABYLON.GUI.TextBlock("statusText", "Facility Digital Twin — Phase 1 | WASD to move | Click equipment for info");
    statusText.color = "#aaa";
    statusText.fontSize = 13;
    statusText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    statusBar.addControl(statusText);

    // Update FPS in status bar
    scene.onBeforeRenderObservable.add(() => {
        const fps = scene.getEngine().getFps().toFixed(0);
        statusText.text =
            `Facility Digital Twin — Phase 1  |  ${fps} FPS  |  ` +
            `Camera: ${scene._cameraMode.toUpperCase()}  |  ` +
            `WASD to move  |  Click equipment for info`;
    });

    // ==================== KEYBOARD SHORTCUTS ====================
    scene.onKeyboardObservable.add((kbInfo) => {
        if (kbInfo.type === BABYLON.KeyboardEventTypes.KEYDOWN) {
            switch (kbInfo.event.key.toLowerCase()) {
                case "c":
                    scene.toggleCamera();
                    cameraBtn.children[0].text =
                        scene._cameraMode === "fps" ? "Camera: FPS" : "Camera: Overview";
                    break;
                case " ":
                    simRunning = !simRunning;
                    simBtn.children[0].text = simRunning ? "Pause Sim" : "Resume Sim";
                    if (pathFollowers) {
                        Object.values(pathFollowers).forEach((f) => f.togglePause());
                    }
                    break;
            }
        }
    });

    console.log("[GUI] HUD initialized: info panel, camera toggle, sim controls, status bar");

    return {
        advTexture,
        showEquipmentInfo,
        hideEquipmentInfo,
    };
}
