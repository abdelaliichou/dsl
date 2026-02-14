import { MonacoLanguageClient } from 'monaco-languageclient';
import { BaseScene, Scene } from './simulator/scene.js';
import { Wall } from './lib/wall.js';
import { Robot } from './lib/robot.js';
import p5 from "./lib/sketch.js";

// DONE : call it in setupClassic.ts
/**
 * Function to setup the simulator and the different notifications exchanged between the client and the server.
 * @param client the Monaco client, used to send and listen notifications.
 * @param uri the URI of the document, useful for the server to know which document is currently being edited.
 */
export function setup(client: MonacoLanguageClient, uri: string) {
    const win = window as any;

    // Modals for TypeChecking
    var errorModal = document.getElementById("errorModal")! as HTMLElement;
    var validModal = document.getElementById("validModal")! as HTMLElement;
    var closeError = document.querySelector("#errorModal .close")! as HTMLElement;
    var closeValid = document.querySelector("#validModal .close")! as HTMLElement;
    closeError.onclick = function() {
        errorModal.style.display = "none";
    }
    closeValid.onclick = function() {
        validModal.style.display = "none";
    }
    window.onclick = function(event) {
        if (event.target == validModal) {
            validModal.style.display = "none";
        }
        if (event.target == errorModal) {
            errorModal.style.display = "none";
        }
    } 

    const typecheck = (async (payload: any) => {
        console.info('Validation result:', payload);
    
        if (payload.success) {
            // Show success modal
            const modal = document.getElementById("validModal")! as HTMLElement;
            const message = modal.querySelector("p");
            if (message) {
                message.textContent = payload.message || "✓ Program is valid!";
            }
            modal.style.display = "block";
        } else {
            // Show error modal
            const modal = document.getElementById("errorModal")! as HTMLElement;
            const message = modal.querySelector("p");
            
            if (payload.errors && payload.errors.length > 0) {
                // Show detailed errors
                let errorText = "Validation Errors:\n\n";
                payload.errors.forEach((err: any, index: number) => {
                    errorText += `${index + 1}. Line ${err.range?.start?.line + 1}: ${err.message}\n`;
                });
                if (message) {
                    message.textContent = errorText;
                    message.style.whiteSpace = "pre-wrap";
                }
            } else {
                if (message) {
                    message.textContent = payload.message || "Program contains errors.";
                }
            }
            
            modal.style.display = "block";
        }
    });

    const execute = (async (scene: Scene) => {
        console.log("=== SCENE RECEIVED ===");
        console.log("Scene:", scene);
        console.log("Timestamps:", scene.timestamps.length);
        console.log("Robot position:", scene.robot.pos);
        
        // Reset animation state
        (window as any).time = 0;
        (window as any).lastTimestamp = 0;
        
        setupSimulator(scene);
    });

    function setupSimulator(scene: Scene) {
        const wideSide = Math.max(scene.size.x, scene.size.y);
        let factor = 1000 / wideSide;

        win.scene = scene;

        scene.entities.forEach((entity) => {
            if (entity.type === "Wall") {
                win.entities.push(new Wall(
                    (entity.pos.x) * factor,
                    (entity.pos.y) * factor,
                    (entity.size.x) * factor,
                    (entity.size.y) * factor,
                    p5
                ));
            }
            if (entity.type === "Block") {
                win.entities.push(new Wall(
                    (entity.pos.x) * factor,
                    (entity.pos.y) * factor,
                    (entity.size.x) * factor,
                    (entity.size.y) * factor,
                    p5
                ));
            }
        });

        win.p5robot = new Robot(
            factor,
            scene.robot.pos.x,
            scene.robot.pos.y,
            scene.robot.size.x * factor,
            scene.robot.size.y * factor,
            scene.robot.rad,
            p5
        );
    }


    client.onNotification("roboml/validate", (payload: any) => {
        typecheck(payload)
    });

    client.onNotification("roboml/buildScene", (payload: any) => {
        console.log("=== BUILD SCENE RESPONSE ===");
        console.log("Payload:", payload);

        if (!payload.success) {
            console.error("Scene build failed:", payload.message);
            console.error("Stack:", payload.stack);
            
            const modal = document.getElementById("errorModal")!;
            const errorText = modal.querySelector("p");
            if (errorText) {
                errorText.textContent = `Error: ${payload.message || "Unknown error"}`;
            }
            modal.style.display = "block";
            return;
        }

        console.log("Scene received successfully!");
        const scene = payload.scene;
        console.log("Scene data:", scene);
        console.log("Timestamps:", scene.timestamps?.length);

        // Clear previous simulation
        (window as any).entities = [];

        execute(scene);
    });

    win.validate = () => {
        client.sendNotification("roboml/validate", uri);
    };

    win.run = () => {
        client.sendNotification("roboml/buildScene", uri);
    }


    win.resetSimulation = () => {
        win.entities = [];
        win.scene = new BaseScene();
        win.p5robot = undefined;
    };
}