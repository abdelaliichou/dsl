#include <PinChangeInt.h>
#include <PinChangeIntConfig.h>
#include <EEPROM.h>
#define _NAMIKI_MOTOR //for Namiki 22CL-103501PG80:1
#include <fuzzy_table.h>
#include <PID_Beta6.h>
#include <MotorWheel.h>
#include <Omni4WD.h>

// Motor and Omni4WD setup
irqISR(irq1, isr1);
MotorWheel wheel1(3, 2, 4, 5, &irq1);
irqISR(irq2, isr2);
MotorWheel wheel2(11, 12, 14, 15, &irq2);
irqISR(irq3, isr3);
MotorWheel wheel3(9, 8, 16, 17, &irq3);
irqISR(irq4, isr4);
MotorWheel wheel4(10, 7, 18, 19, &irq4);
Omni4WD Omni(&wheel1, &wheel2, &wheel3, &wheel4);
int currentSpeed = 0;
// Forward declarations
void spiral();

void setup() {
    TCCR1B = TCCR1B & 0xf8 | 0x01; // Pin9,Pin10 PWM 31250Hz
    TCCR2B = TCCR2B & 0xf8 | 0x01; // Pin3,Pin11 PWM 31250Hz
      Omni.PIDEnable(0.31, 0.01, 0, 10);
}

void loop() {
    currentSpeed = 40;
    spiral();
    currentSpeed = 0;
}

void spiral() {
    int step = 20;
    int count = 0;
    while ((count < 4)) {
        Omni.setCarAdvance(currentSpeed);
        Omni.delayMS((step * 10) * 1000 / currentSpeed);
        Omni.setCarStop();
        Omni.setCarRotateRight(currentSpeed);
        Omni.delayMS((92 / 90.0 * 1000));
        Omni.setCarStop();
        step = (step + 20);
        count = (count + 1);
    }
}
