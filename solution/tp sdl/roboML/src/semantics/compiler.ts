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
        this.addLine('#include <Arduino.h>');
        this.addLine('#include <MotorWheel.h>');
        this.addLine('#include <Omni4WD.h>');
        this.addLine('#include <PID_Beta6.h>');
        this.addLine('');
        
        // Robot initialization
        this.addLine('// Robot initialization');
        this.addLine('Omni4WD robot;');
        this.addLine('');
        
        // Global variables for speed
        this.addLine('// Global speed variable (mm/s)');
        this.addLine('int currentSpeed = 100;');
        this.addLine('');
        
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
        this.addLine('Serial.begin(9600);');
        this.addLine('robot.PIDEnable(0.31, 0.01, 0.0, 10);');
        this.addLine('');
        this.addLine('// Execute entry function');
        node.entry.accept(this);
        this.decreaseIndent();
        this.addLine('}');
        this.addLine('');
        
        // Generate loop() function (empty, execution in setup)
        this.addLine('void loop() {');
        this.increaseIndent();
        this.addLine('// Program execution happens in setup()');
        this.addLine('delay(100);');
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
                this.addLine(`robot.setCarAdvance(currentSpeed);`);
                this.addLine(`robot.delayMS(${distanceMM} * 1000 / currentSpeed);`);
                this.addLine(`robot.setCarStop();`);
                break;
            case 'BACKWARD':
                this.addLine(`robot.setCarBackoff(currentSpeed);`);
                this.addLine(`robot.delayMS(${distanceMM} * 1000 / currentSpeed);`);
                this.addLine(`robot.setCarStop();`);
                break;
            case 'LEFT':
                this.addLine(`robot.setCarLeft(currentSpeed);`);
                this.addLine(`robot.delayMS(${distanceMM} * 1000 / currentSpeed);`);
                this.addLine(`robot.setCarStop();`);
                break;
            case 'RIGHT':
                this.addLine(`robot.setCarRight(currentSpeed);`);
                this.addLine(`robot.delayMS(${distanceMM} * 1000 / currentSpeed);`);
                this.addLine(`robot.setCarStop();`);
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
                this.addLine(`robot.setCarRotateRight(currentSpeed);`);
                this.addLine(`robot.delayMS(${timeMs});`);
                this.addLine(`robot.setCarStop();`);
                break;
            case 'COUNTERCLOCK':
                this.addLine(`robot.setCarRotateLeft(currentSpeed);`);
                this.addLine(`robot.delayMS(${timeMs});`);
                this.addLine(`robot.setCarStop();`);
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
                return 'robot.getDistance()';
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
