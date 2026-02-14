import { BaseScene } from '../web/simulator/scene.js';
import * as Entities from '../web/simulator/entities.js';
import type { ArithmeticExpression, Assignment, BinaryExpression, BooleanLiteral, Command, ComparisonExpression, Condition, Expression, FunctionCall, Loop, Movement, MyFunction, NumberLiteral, Parameter, Program, RoboMLanguageVisitor, Rotation, SensorRead, SetSpeed, Statement, UnaryExpression, UnitExpression, VariableDeclaration, VariableReference } from './robo-m-language-visitor.js';

interface IStack<T> {
    push(item: T): void;
    pop(): T | undefined;
    peek(): T | undefined;
    size(): number;
}

class Stack<T> implements IStack<T> {
    private storage: T[] = [];
    constructor(private capacity: number = Infinity) { }

    push(item: T): void {
        if (this.size() === this.capacity) {
            throw Error("Stack has reached max capacity");
        }
        this.storage.push(item);
    }

    pop(): T | undefined {
        return this.storage.pop();
    }

    peek(): T | undefined {
        return this.storage[this.size() - 1];
    }

    size(): number {
        return this.storage.length;
    }
}

export class InterpretorRoboMLanguageVisitor implements RoboMLanguageVisitor {

    private scene = new BaseScene();
    private functions = new Map<string, MyFunction>();
    private scopeVariables = new Stack<Map<string, any>>();
    private currentSpeed: number = 1;
    private rotationSpeed = Math.PI / 2; // 90° per second

    constructor() {
        this.scene = new BaseScene();
        this.functions = new Map();
        this.scopeVariables = new Stack();
        this.scopeVariables.push(new Map());
        this.currentSpeed = 1;
        this.rotationSpeed = Math.PI / 2;
    }

    visitExpression(node: Expression) {
        return node.accept(this);
    }

    visitBinaryExpression(node: BinaryExpression) {
        return node.accept(this);
    }

    visitArithmeticExpression(node: ArithmeticExpression) {
        const left = node.left.accept(this);
        const right = node.right.accept(this);
        switch (node.operator) {
            case 'PLUS': return left + right;
            case 'MINUS': return left - right;
            case 'MULTIPLY': return left * right;
            case 'DIVIDE': return left / right;
            case 'MODULO': return left % right;
        }
    }

    visitComparisonExpression(node: ComparisonExpression) {
        const left = node.left.accept(this);
        const right = node.right.accept(this);
        switch (node.operator) {
            case 'LESS': return left < right;
            case 'LESS_EQ': return left <= right;
            case 'GREATER': return left > right;
            case 'GREATER_EQ': return left >= right;
            case 'EQUALS': return left == right;
            case 'NOT_EQUALS': return left != right;
        }
    }

    visitBooleanLiteral(node: BooleanLiteral) {
        return node.value;
    }

    visitNumberLiteral(node: NumberLiteral) {
        return node.value ?? 0;
    }

    visitSensorRead(node: SensorRead) {
        switch (node.sensor) {
            case 'TIMESTAMP': 
                return this.scene.time;
            case 'DISTANCE':
                // Simple distance sensor simulation
                const ray = this.scene.robot.getRay();
                const intersection = ray.intersect(this.scene.entities);
                if (intersection) {
                    return this.scene.robot.pos.minus(intersection).norm();
                }
                return 10000; // Max distance if no obstacle
        }
    }

    visitUnaryExpression(node: UnaryExpression) {
        const operand = node.operand.accept(this);
        switch (node.operator) {
            case 'MINUS': return -operand;
            case 'NOT': return !operand;
        }
    }

    visitUnitExpression(node: UnitExpression) {
        const value = node.value.accept(this);
        switch (node.unit) {
            case 'CM': return value * 10;
            case 'MM': return value;
        }
    }

    visitVariableReference(node: VariableReference) {
        const scope = this.scopeVariables.peek();
        if (scope && node.variableName) {
            const value = scope.get(node.variableName);
            if (value !== undefined) {
                return value;
            }
        }
        throw new Error('Undeclared variable: ' + node.variableName);
    }

    visitMyFunction(node: MyFunction) {
        if (!node.name) {
            // Entry function
            for (const statement of node.body) {
                statement.accept(this);
            }
        } else {
            // Regular function - create new scope
            this.scopeVariables.push(new Map<string, any>());
            
            // Execute function body
            for (const statement of node.body) {
                statement.accept(this);
            }
            
            // Restore scope
            this.scopeVariables.pop();
        }
    }

    visitParameter(node: Parameter) {
        // Parameters handled during function calls
    }

    // ENTRY POINT
    visitProgram(node: Program) {
        console.log("VISITOR IN PROGRAM");
        
        // Register all functions
        for (const func of node.functions) {
            if (func.name) {
                this.functions.set(func.name, func);
            }
        }
        
        // Execute entry function
        node.entry.accept(this);
        
        return this.scene;
    }

    visitStatement(node: Statement) {
        return node.accept(this);
    }

    visitAssignment(node: Assignment) {
        const scope = this.scopeVariables.peek();
        if (scope && node.variable) {
            const value = node.value.accept(this); // ← FIX: Evaluate expression
            scope.set(node.variable, value);
            return;
        }
        throw new Error('Assignment error: ' + node.variable);
    }

    visitCommand(node: Command) {
        return node.accept(this);
    }

    visitFunctionCall(node: FunctionCall) {
        if (node.functionName) {
            const functionDecl = this.functions.get(node.functionName);
            if (functionDecl) {
                functionDecl.accept(this);
                return;
            }
        }
        throw new Error('Function not found: ' + node.functionName);
    }

    visitMovement(node: Movement) {
        const dist = node.distance.accept(this);
        
        // FIX: Add break statements
        let unit2 = 1;
        switch (node.unit) {
            case 'CM': 
                unit2 = 10;
                break;
            case 'MM': 
                unit2 = 1;
                break;
        }
        
        const calcDist = dist * unit2;
        
        // FIX: Add break statements
        switch (node.direction) {
            case 'FORWARD': 
                this.scene.robot.move(calcDist);
                break;
            case 'BACKWARD': 
                this.scene.robot.move(-calcDist);
                break;
            case 'LEFT': 
                this.scene.robot.side(-calcDist);
                break;
            case 'RIGHT': 
                this.scene.robot.side(calcDist);
                break;
        }

        const duration = Math.abs(calcDist) / this.currentSpeed;
        this.scene.time += duration;
        this.scene.timestamps.push(
            new Entities.Timestamp(this.scene.time, this.scene.robot)
        );
    }

    visitRotation(node: Rotation) {
        const angle = node.angle.accept(this) * Math.PI / 180;
        
        // FIX: Proper direction handling
        let direction = 1;
        switch (node.direction) {
            case 'CLOCK': 
                direction = 1;
                break;
            case 'COUNTERCLOCK': 
                direction = -1;
                break;
        }
        
        this.scene.robot.turn(angle * direction);

        const duration = Math.abs(angle) / this.rotationSpeed;
        this.scene.time += duration;
        this.scene.timestamps.push(
            new Entities.Timestamp(this.scene.time, this.scene.robot)
        );
    }

    visitSetSpeed(node: SetSpeed) {
        const speed = node.speed.accept(this);
        const unit = node.unit === 'CM_PER_SEC' ? 10 : 1;
        this.currentSpeed = speed * unit;
    }

    visitCondition(node: Condition) {
        const cond = node.condition.accept(this);
        if (cond) {
            for (const statement of node.thenBlock) {
                statement.accept(this);
            }
        } else {
            for (const statement of node.elseBlock) {
                statement.accept(this);
            }
        }
    }

    visitLoop(node: Loop) {
        while (node.condition.accept(this)) {
            for (const statement of node.body) {
                statement.accept(this);
            }
        }
    }

    visitVariableDeclaration(node: VariableDeclaration) {
        const scope = this.scopeVariables.peek();
        if (scope && node.name) {
            if (scope.has(node.name)) {
                throw new Error('Variable already declared: ' + node.name);
            }
            
            // FIX: Evaluate initial value
            const initialValue = node.initialValue 
                ? node.initialValue.accept(this) 
                : 0;
            
            scope.set(node.name, initialValue);
            return;
        }
        throw new Error('Variable declaration error');
    }
}