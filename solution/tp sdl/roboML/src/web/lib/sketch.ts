import P5 from "p5";
import { Robot } from "./robot.js";
import { CustomWindow } from "./utils.js";
import { Wall } from "./wall.js";

const win = window as CustomWindow;

const sketch = (p: P5) => {
    p.setup = () => {
        const canvas = p.createCanvas(1000, 1000, document.getElementById("simulator") as HTMLCanvasElement);
        canvas.parent("simulator-wrapper");
        win.entities = [];
        win.time = 0;
        win.lastTimestamp = 0;
        win.scene = undefined;
        win.p5robot = new Robot(1, p.width / 2, p.height / 2, undefined, undefined, undefined, p);
    };

    p.draw = () => {
        p.background(0);
        
        // DEBUG INFO
        if (win.scene) {
            p.fill(255);
            p.noStroke();
            p.textSize(14);
            p.text(`Timestamps: ${win.scene.timestamps.length}`, 10, 20);
            p.text(`Current Time: ${win.time.toFixed(2)}`, 10, 40);
            p.text(`Last Timestamp: ${win.lastTimestamp}`, 10, 60);
            
            // Show if animation is playing
            if (win.lastTimestamp < win.scene.timestamps.length - 1) {
                p.text(`ANIMATING`, 10, 80);
            } else {
                p.text(`FINISHED`, 10, 80);
            }
        }
        
        p.stroke(255);
        p.strokeWeight(1);

        // Draw walls/entities
        for (let e = 0; e < win.entities.length; e++) {
            (win.entities[e] as unknown as Wall).show();
        }

        // Update robot position if animation is running
        if (win.scene && win.scene.timestamps.length > win.lastTimestamp + 1) {
            win.time += p.deltaTime; // deltaTime is in milliseconds
            updateRobot(p);
        }

        // Draw robot
        if (win.p5robot) {
            win.p5robot.show();
        }
    };
};

const p5 = new P5(sketch);

function updateRobot(p: P5) {
    if (!win.scene) return;
    
    const lastKnownState = win.scene.timestamps[win.lastTimestamp];
    const nextKnownState = win.scene.timestamps[win.lastTimestamp + 1];

    // Convert time from seconds to milliseconds for interpolation
    const lastTime = lastKnownState.time * 1000;
    const nextTime = nextKnownState.time * 1000;
    const currentTime = win.time;

    // Interpolate position and angle
    win.p5robot.x = p.map(currentTime, lastTime, nextTime, lastKnownState.pos.x, nextKnownState.pos.x, true);
    win.p5robot.y = p.map(currentTime, lastTime, nextTime, lastKnownState.pos.y, nextKnownState.pos.y, true);
    win.p5robot.angle = p.map(currentTime, lastTime, nextTime, lastKnownState.rad, nextKnownState.rad, true);

    // Move to next timestamp when current time exceeds it
    if (currentTime >= nextTime) {
        win.time = nextTime;
        win.lastTimestamp++;
    }
}

function resetSimulation() {
    win.time = 0;
    win.lastTimestamp = 0;
}

win.setup = p5.setup;
win.resetSimulation = resetSimulation;

export default p5;