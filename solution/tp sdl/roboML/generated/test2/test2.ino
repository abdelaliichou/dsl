#include <Arduino.h>
#include <MotorWheel.h>
#include <Omni4WD.h>
#include <PID_Beta6.h>

// Robot initialization
Omni4WD robot;

// Global speed variable (mm/s)
int currentSpeed = 100;

// Forward declarations
void entry1();
void square();
void entry2();
void celebrationDance();

void setup() {
    Serial.begin(9600);
    robot.PIDEnable(0.31, 0.01, 0.0, 10);
    
    // Execute entry function
    currentSpeed = 400;
    int side = 30;
    int turns = 0;
    while ((turns < 4)) {
        if ((side > 25)) {
            robot.setCarAdvance(currentSpeed);
            robot.delayMS((side * 10) * 1000 / currentSpeed);
            robot.setCarStop();
        } else {
            robot.setCarAdvance(currentSpeed);
            robot.delayMS((10 * 10) * 1000 / currentSpeed);
            robot.setCarStop();
        }
        robot.setCarRotateRight(currentSpeed);
        robot.delayMS((90 / 90.0 * 1000));
        robot.setCarStop();
        turns = (turns + 1);
        side = (side + 5);
    }
    celebrationDance();
}

void loop() {
    // Program execution happens in setup()
    delay(100);
}

void entry1() {
    currentSpeed = 550;
    int count = 0;
    while ((count < 5)) {
        count = (count + 1);
        square();
    }
}

void square() {
    robot.setCarAdvance(currentSpeed);
    robot.delayMS((30 * 10) * 1000 / currentSpeed);
    robot.setCarStop();
    robot.setCarRotateRight(currentSpeed);
    robot.delayMS((90 / 90.0 * 1000));
    robot.setCarStop();
    robot.setCarAdvance(currentSpeed);
    robot.delayMS(300 * 1000 / currentSpeed);
    robot.setCarStop();
    robot.setCarRotateRight(currentSpeed);
    robot.delayMS((90 / 90.0 * 1000));
    robot.setCarStop();
    robot.setCarAdvance(currentSpeed);
    robot.delayMS((30 * 10) * 1000 / currentSpeed);
    robot.setCarStop();
    robot.setCarRotateRight(currentSpeed);
    robot.delayMS((90 / 90.0 * 1000));
    robot.setCarStop();
    robot.setCarAdvance(currentSpeed);
    robot.delayMS((30 * 10) * 1000 / currentSpeed);
    robot.setCarStop();
    robot.setCarRotateRight(currentSpeed);
    robot.delayMS((90 / 90.0 * 1000));
    robot.setCarStop();
}

void entry2() {
    currentSpeed = 300;
    int dist = 100;
    if ((dist > 50)) {
        robot.setCarAdvance(currentSpeed);
        robot.delayMS((50 * 10) * 1000 / currentSpeed);
        robot.setCarStop();
        robot.setCarRotateRight(currentSpeed);
        robot.delayMS((90 / 90.0 * 1000));
        robot.setCarStop();
        robot.setCarAdvance(currentSpeed);
        robot.delayMS((50 * 10) * 1000 / currentSpeed);
        robot.setCarStop();
    } else {
        robot.setCarBackoff(currentSpeed);
        robot.delayMS((30 * 10) * 1000 / currentSpeed);
        robot.setCarStop();
        robot.setCarRotateRight(currentSpeed);
        robot.delayMS((180 / 90.0 * 1000));
        robot.setCarStop();
    }
}

void celebrationDance() {
    int spins = 0;
    while ((spins < 3)) {
        robot.setCarRotateRight(currentSpeed);
        robot.delayMS((360 / 90.0 * 1000));
        robot.setCarStop();
        spins = (spins + 1);
    }
}
