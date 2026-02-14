import { BaseScene } from '../web/simulator/scene.js';
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
            throw Error("Stack has reached max capacity, you cannot add more items");
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
    private scopeVariables = new Stack<Map<string, any>>;
    private currentSpeed:number = 1; 

    visitExpression(node: Expression) {
        node.accept(this); // Auto-dispatch
    }
    visitBinaryExpression(node: BinaryExpression) {
        //FIXME: Binary Expression can be Arithmetic or Comparison OR BINARY AGAIN ?
        node.left.accept(this);
        node.right.accept(this);
        throw new Error('Method not implemented.');
    }
    visitArithmeticExpression(node: ArithmeticExpression) {
        var left = node.left.accept(this);
        var right = node.right.accept(this); 
        switch (node.operator){
            case 'PLUS': return left + right;
            case 'MINUS': return left - right;
            case 'MULTIPLY': return left * right;
            case 'DIVIDE': return left / right;
            case 'MODULO': return left % right;
        }
    }
    visitComparisonExpression(node: ComparisonExpression) {
        var left = node.left.accept(this);
        var right = node.right.accept(this);
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
        return node.value;
    }

    //Something in relation with the Raycast ? 
    visitSensorRead(node: SensorRead) {
        switch (node.sensor){
            case 'TIMESTAMP': throw new Error('TIMESTAMP SENSOR not implemented.');
            case 'DISTANCE': throw new Error('DISTANCE SENSOR not implemented.');
        }
    }

    //HACKME: Jsp, j'trouve pas ça trop ouf de mélanger booléens et nombres :/
    visitUnaryExpression(node: UnaryExpression) {
        var operand = node.operand.accept(this);
        switch (node.operator) {
            case 'MINUS': return -operand;
            case 'NOT': return !operand;
        }
    }

    //Puis on multiplira par l'unité
    visitUnitExpression(node: UnitExpression) {
        switch (node.unit){
            case 'CM': return 10;
            case 'MM': return 1;
        }
    }

    visitVariableReference(node: VariableReference) {
        var scope = this.scopeVariables.peek()
        if (scope && node.variableName){ //Lol, variable name isn't mandatory
            return scope.get(node.variableName);
        }
        throw new Error('Non-decared Varaible: '+node.variableName);
    }
    visitMyFunction(node: MyFunction) {
        if (!node.name){ //On est dans l'entry function
            //Normalement on a pas de parameters ou autre, si ? 
            for (var statement of node.body){
                statement.accept(this); //Auto-dispatch the visitor in the right visit method.
            }
        } 
        else { // On est dans l'execution d'une fonction "externe"
            // On créer un nouveau scope avec les paramètre en varaibles. 
            this.scopeVariables.push(new Map<string,any>())
            for (var param of node.parameters){
                param.accept(this);
            }
            //Puis on déroule les statements normalement
            for (var statement of node.body) {
                statement.accept(this); //Auto-dispatch the visitor in the right visit method.
            }
        }
    }
    visitParameter(node: Parameter) {

        throw new Error('Method not implemented.');
    }
    
    //ENTRY POINT !!
    visitProgram(node: Program) {
        // Register functions for later calls
        for (var func of node.functions) {
            this.functions.set(func.name || ".", func);
        }
        // Execute entry
        node.entry.accept(this);
        return this.scene;
    }

    //Is it possible we came here ? :x
    visitStatement(node: Statement) {
        node.accept(this);
        throw new Error('Method not implemented.');
    }

    visitAssignment(node: Assignment) {
        var scope = this.scopeVariables.peek();
        if (scope && node.variable){
            scope.set(node.variable,node.value);
        }
        throw new Error('Assignement Error.');
    }

    //Same thing as Statement .
    visitCommand(node: Command) {
        node.accept(this);
        throw new Error('Method not implemented.');
    }

    //FIXME : Not complete at all. Like, we're not managing yet the input parameters etc...
    visitFunctionCall(node: FunctionCall) {
        if(node.functionName){
            var functionDecl = this.functions.get(node.functionName);
            functionDecl?.accept(this);
        }
        throw new Error('Method not implemented.');
    }

    //FIXME: Implement timestamps with currentSpeed
    visitMovement(node: Movement) {
        var dist = node.distance.accept(this);
        //var unit = node.unit.accept(this) // Wtf c'est pas une DistanceUnit ? :(
        var unit2 = 0;
        switch (node.unit) {
            case 'CM': unit2 = 10
            case 'MM': unit2 = 1
        }
        switch(node.direction){ //Let's call scene/entities methods
            case 'FORWARD': this.scene.robot.move(dist*unit2)
            case 'BACKWARD': this.scene.robot.move(-dist * unit2)
            case 'LEFT': this.scene.robot.side(-dist * unit2)
            case 'RIGHT': this.scene.robot.side(dist * unit2)
        }
    }

    //FIXME: Implement timestamps with currentSpeed
    visitRotation(node: Rotation) {
        var angle = node.angle.accept(this) * Math.PI / 180 // Normalement c'est bon nan ? J'ai copié ça dans le entities.ts
        var direction = 0;
        switch (node.direction) {
            case 'CLOCK': 1
            case 'COUNTERCLOCK': -1
        }
        this.scene.robot.turn(angle*direction)
    }

    visitSetSpeed(node: SetSpeed) {
        var speed = node.speed.accept(this)
        var unit = 0 //AGAIN :(
        switch (node.unit) {
            case 'MM_PER_SEC': 1
            case 'CM_PER_SEC': 10
        }
        this.currentSpeed = speed*unit
    }

    visitCondition(node: Condition) {
        var cond = node.condition.accept(this)
        if(cond){
            for(var statement of node.thenBlock){
                statement.accept(this)
            }
        } else {
            for(var statement of node.elseBlock){ 
                statement.accept(this)
            }
        }
    }
    visitLoop(node: Loop) {
        var cond = node.condition.accept(this)
        while(cond){
            for(var statement of node.body){
                statement.accept(this)
            }
            cond = node.condition.accept(this)
        }
    }

    visitVariableDeclaration(node: VariableDeclaration) {
        throw new Error('Method not implemented.');
    }
    
}
