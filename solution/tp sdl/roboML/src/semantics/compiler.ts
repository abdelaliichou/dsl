import type { 
    ArithmeticExpression,
    Assignment, 
    BinaryExpression, 
    BooleanLiteral,
    Command, 
    ComparisonExpression, 
    Condition, 
    Expression, 
    FunctionCall, 
    Loop, 
    Movement, 
    MyFunction, 
    NumberLiteral, 
    Parameter, 
    Program, 
    RoboMLanguageVisitor, 
    Rotation, 
    SensorRead, 
    SetSpeed, 
    Statement, 
    UnaryExpression, 
    UnitExpression, 
    VariableDeclaration, 
    VariableReference 
} from './robo-m-language-visitor.js';

export class ArduinoCompiler  implements RoboMLanguageVisitor {

    private output: string[] = [];
    private indent: number = 0;
    private functions: Map<string, MyFunction> = new Map();
    
    private addLine(line: string): void {
        const indentation = '    '.repeat(this.indent);
        this.output.push(indentation + line);
    }
    
    private increaseIndent(): void {
        this.indent++;
    }
    
    private decreaseIndent(): void {
        this.indent--;
    }
    
    public getOutput(): string {
        return this.output.join('\n');
    }

    
    visitProgram(node: Program): string {
        // Arduino includes
        this.addLine('#include <PinChangeInt.h>');
        this.addLine('#include <PinChangeIntConfig.h>')
        this.addLine('#include <EEPROM.h>');
        this.addLine('#define _NAMIKI_MOTOR //for Namiki 22CL-103501PG80:1');
        this.addLine('#include <fuzzy_table.h>');
        this.addLine('#include <PID_Beta6.h>');
        this.addLine('#include <MotorWheel.h>');
        this.addLine('#include <Omni4WD.h>');
        this.addLine('');
        this.addLine('// Motor and Omni4WD setup');
        this.addLine('irqISR(irq1, isr1);');
        this.addLine('MotorWheel wheel1(3, 2, 4, 5, &irq1);');
        this.addLine('irqISR(irq2, isr2);');
        this.addLine('MotorWheel wheel2(11, 12, 14, 15, &irq2);');
        this.addLine('irqISR(irq3, isr3);');
        this.addLine('MotorWheel wheel3(9, 8, 16, 17, &irq3);');
        this.addLine('irqISR(irq4, isr4);');
        this.addLine('MotorWheel wheel4(10, 7, 18, 19, &irq4);');
        this.addLine('Omni4WD Omni(&wheel1, &wheel2, &wheel3, &wheel4);');
        this.addLine('int currentSpeed = 0;')
        
        // Register all functions
        for (const func of node.functions) {
            if (func.name) {
                this.functions.set(func.name, func);
            }
        }
        
        // Forward declarations for user functions
        if (node.functions.length > 0) {
            this.addLine('// Forward declarations');
            for (const func of node.functions) {
                if (func.name) {
                    const returnType = this.getArduinoType(func.returnType);
                    const params = func.parameters.map(p => 
                        `${this.getArduinoType(p.type)} ${p.name}`
                    ).join(', ');
                    this.addLine(`${returnType} ${func.name}(${params});`);
                }
            }
            this.addLine('');
        }
        
        // Generate setup() function
        this.addLine('void setup() {');
        this.increaseIndent();
        this.addLine('TCCR1B = TCCR1B & 0xf8 | 0x01; // Pin9,Pin10 PWM 31250Hz');
        this.addLine('TCCR2B = TCCR2B & 0xf8 | 0x01; // Pin3,Pin11 PWM 31250Hz');
        this.addLine('  Omni.PIDEnable(0.31, 0.01, 0, 10);');
        // node.entry.accept(this);
        this.decreaseIndent();
        this.addLine('}');
        this.addLine('');
        
        // Generate loop() function (empty, execution in setup)
        this.addLine('void loop() {');
        this.increaseIndent();
        node.entry.accept(this);
        this.decreaseIndent();
        this.addLine('}');
        this.addLine('');
        
        // Generate user functions
        for (const func of node.functions) {
            if (func.name) {
                func.accept(this);
                this.addLine('');
            }
        }
        
        return this.getOutput();
    }
    
    visitMyFunction(node: MyFunction): void {
        if (node.name) {
            // User-defined function
            const returnType = this.getArduinoType(node.returnType);
            const params = node.parameters.map(p => 
                `${this.getArduinoType(p.type)} ${p.name}`
            ).join(', ');
            
            this.addLine(`${returnType} ${node.name}(${params}) {`);
            this.increaseIndent();
            
            // Function body
            for (const statement of node.body) {
                statement.accept(this);
            }
            
            this.decreaseIndent();
            this.addLine('}');
        } else {
            // Entry function - inline in setup()
            for (const statement of node.body) {
                statement.accept(this);
            }
        }
    }
    
    visitParameter(node: Parameter): void {
        // Parameters handled in function declaration
    }
    
    // ============================================
    // STATEMENTS
    // ============================================
    
    visitStatement(node: Statement): void {
        node.accept(this);
    }
    
    visitVariableDeclaration(node: VariableDeclaration): void {
        const type = this.getArduinoType(node.type);
        const name = node.name;
        const initialValue = node.initialValue ? node.initialValue.accept(this) : '0';
        this.addLine(`${type} ${name} = ${initialValue};`);
    }
    
    visitAssignment(node: Assignment): void {
        const value = node.value.accept(this);
        this.addLine(`${node.variable} = ${value};`);
    }
    
    visitLoop(node: Loop): void {
        const condition = node.condition.accept(this);
        this.addLine(`while (${condition}) {`);
        this.increaseIndent();
        
        for (const statement of node.body) {
            statement.accept(this);
        }
        
        this.decreaseIndent();
        this.addLine('}');
    }
    
    visitCondition(node: Condition): void {
        const condition = node.condition.accept(this);
        this.addLine(`if (${condition}) {`);
        this.increaseIndent();
        
        for (const statement of node.thenBlock) {
            statement.accept(this);
        }
        
        this.decreaseIndent();
        
        if (node.elseBlock.length > 0) {
            this.addLine('} else {');
            this.increaseIndent();
            
            for (const statement of node.elseBlock) {
                statement.accept(this);
            }
            
            this.decreaseIndent();
        }
        
        this.addLine('}');
    }
    
    // ============================================
    // COMMANDS
    // ============================================
    
    visitCommand(node: Command): void {
        node.accept(this);
    }
    
    visitMovement(node: Movement): void {
        const distanceExpr = node.distance.accept(this);
        
        // Convert to mm
        const unit = node.unit === 'CM' ? '10' : '1';
        const distanceMM = unit === '1' ? distanceExpr : `(${distanceExpr} * ${unit})`;
        
        // Generate movement based on direction
        switch (node.direction) {
            case 'FORWARD':
                this.addLine(`Omni.setCarAdvance(currentSpeed);`);
                this.addLine(`Omni.delayMS(${distanceMM} * 100 / currentSpeed);`);
                this.addLine(`Omni.setCarStop();`);
                break;
            case 'BACKWARD':
                this.addLine(`Omni.setCarBackoff(currentSpeed);`);
                this.addLine(`Omni.delayMS(${distanceMM} * 100 / currentSpeed);`);
                this.addLine(`Omni.setCarStop();`);
                break;
            case 'LEFT':
                this.addLine(`Omni.setCarLeft(currentSpeed);`);
                this.addLine(`Omni.delayMS(${distanceMM} * 100 / currentSpeed);`);
                this.addLine(`Omni.setCarStop();`);
                break;
            case 'RIGHT':
                this.addLine(`Omni.setCarRight(currentSpeed);`);
                this.addLine(`Omni.delayMS(${distanceMM} * 100 / currentSpeed);`);
                this.addLine(`Omni.setCarStop();`);
                break;
        }
    }
    
    visitRotation(node: Rotation): void {
        const angleExpr = node.angle.accept(this);
        
        // Assuming rotation speed is proportional to linear speed
        // Adjust timing based on angle
        const timeMs = `(${angleExpr} / 90.0 * 1000)`;
        
        switch (node.direction) {
            case 'CLOCK':
                this.addLine(`Omni.setCarRotateRight(currentSpeed);`);
                this.addLine(`Omni.delayMS(${timeMs});`);
                this.addLine(`Omni.setCarStop();`);
                break;
            case 'COUNTERCLOCK':
                this.addLine(`Omni.setCarRotateLeft(currentSpeed);`);
                this.addLine(`Omni.delayMS(${timeMs});`);
                this.addLine(`Omni.setCarStop();`);
                break;
        }
    }
    
    visitSetSpeed(node: SetSpeed): void {
        const speedExpr = node.speed.accept(this);
        const unit = node.unit === 'CM_PER_SEC' ? '10' : '1';
        const speedMM = unit === '1' ? speedExpr : `(${speedExpr} * ${unit})`;
        this.addLine(`currentSpeed = ${speedMM};`);
    }
    
    visitFunctionCall(node: FunctionCall): void {
        const args = node.arguments.map(arg => arg.accept(this)).join(', ');
        this.addLine(`${node.functionName}(${args});`);
    }
    
    // ============================================
    // EXPRESSIONS
    // ============================================
    
    visitExpression(node: Expression): string {
        return node.accept(this);
    }
    
    visitBinaryExpression(node: BinaryExpression): string {
        return node.accept(this);
    }
    
    visitArithmeticExpression(node: ArithmeticExpression): string {
        const left = node.left.accept(this);
        const right = node.right.accept(this);
        const op = this.getArduinoOperator(node.operator);
        return `(${left} ${op} ${right})`;
    }
    
    visitComparisonExpression(node: ComparisonExpression): string {
        const left = node.left.accept(this);
        const right = node.right.accept(this);
        const op = this.getArduinoComparisonOperator(node.operator);
        return `(${left} ${op} ${right})`;
    }
    
    visitUnaryExpression(node: UnaryExpression): string {
        const operand = node.operand.accept(this);
        const op = node.operator === 'MINUS' ? '-' : '!';
        return `${op}${operand}`;
    }
    
    visitNumberLiteral(node: NumberLiteral): string {
        return String(node.value ?? 0);
    }
    
    visitBooleanLiteral(node: BooleanLiteral): string {
        return node.value ? 'true' : 'false';
    }
    
    visitVariableReference(node: VariableReference): string {
        return node.variableName || '';
    }
    
    visitSensorRead(node: SensorRead): string {
        switch (node.sensor) {
            case 'TIMESTAMP':
                return 'millis()';
            case 'DISTANCE':
                // Assuming ultrasonic sensor
                return 'Omni.getDistance()';
            default:
                return '0';
        }
    }
    
    visitUnitExpression(node: UnitExpression): string {
        const value = node.value.accept(this);
        const multiplier = node.unit === 'CM' ? '10' : '1';
        return multiplier === '1' ? value : `(${value} * ${multiplier})`;
    }
    
    // ============================================
    // HELPER METHODS
    // ============================================
    
    private getArduinoType(type: any): string {
        if (typeof type === 'string') {
            switch (type) {
                case 'VOID': return 'void';
                case 'NUMBER': return 'int';
                case 'BOOLEAN': return 'bool';
            }
        }
        
        // Handle type objects
        if (type && typeof type === 'object' && '$type' in type) {
            switch ((type as any).$type) {
                case 'ReturnType_VOID':
                case 'VariableType_VOID':
                    return 'void';
                case 'ReturnType_NUMBER':
                case 'VariableType_NUMBER':
                    return 'int';
                case 'ReturnType_BOOLEAN':
                case 'VariableType_BOOLEAN':
                    return 'bool';
            }
        }
        
        return 'int'; // Default
    }
    
    private getArduinoOperator(op: string): string {
        switch (op) {
            case 'PLUS': return '+';
            case 'MINUS': return '-';
            case 'MULTIPLY': return '*';
            case 'DIVIDE': return '/';
            case 'MODULO': return '%';
            default: return '+';
        }
    }
    
    private getArduinoComparisonOperator(op: string): string {
        switch (op) {
            case 'LESS': return '<';
            case 'LESS_EQ': return '<=';
            case 'GREATER': return '>';
            case 'GREATER_EQ': return '>=';
            case 'EQUALS': return '==';
            case 'NOT_EQUALS': return '!=';
            default: return '==';
        }
    }
}
