import { BaseScene, Scene } from '../web/simulator/scene.js';
import type { ArithmeticExpression, Assignment, BinaryExpression, BooleanLiteral, Command, ComparisonExpression, Condition, Expression, FunctionCall, Loop, Movement, MyFunction, NumberLiteral, Parameter, Program, RoboMLanguageVisitor, Rotation, SensorRead, SetSpeed, Statement, UnaryExpression, UnitExpression, VariableDeclaration, VariableReference } from './robo-m-language-visitor.js';

export class InterpretorRoboMLanguageVisitor implements RoboMLanguageVisitor {

    private scene = new BaseScene();
    private variables = new Map<string, any>();
    private functions = new Map<string, MyFunction>();

    visitExpression(node: Expression) {
        throw new Error('Method not implemented.');
    }
    visitBinaryExpression(node: BinaryExpression) {
        throw new Error('Method not implemented.');
    }
    visitArithmeticExpression(node: ArithmeticExpression) {
        throw new Error('Method not implemented.');
    }
    visitComparisonExpression(node: ComparisonExpression) {
        throw new Error('Method not implemented.');
    }
    visitBooleanLiteral(node: BooleanLiteral) {
        throw new Error('Method not implemented.');
    }
    visitNumberLiteral(node: NumberLiteral) {
        throw new Error('Method not implemented.');
    }
    visitSensorRead(node: SensorRead) {
        throw new Error('Method not implemented.');
    }
    visitUnaryExpression(node: UnaryExpression) {
        throw new Error('Method not implemented.');
    }
    visitUnitExpression(node: UnitExpression) {
        throw new Error('Method not implemented.');
    }
    visitVariableReference(node: VariableReference) {
        throw new Error('Method not implemented.');
    }
    visitMyFunction(node: MyFunction) {
        if (!node.name){ //On est dans l'entry function
            //Normalement on a pas de parameters ou autre, si ? 
            for (let statement of node.body){
                statement.accept(this) //Auto-dispatch the visitor in the right visit method.
            }
        } 
        else { // On est dans l'execution d'une fonction "externe"
            //
            
        }
    }
    visitParameter(node: Parameter) {
        throw new Error('Method not implemented.');
    }
    
    //ENTRY POINT !!
    visitProgram(node: Program) {
        // Register functions for later calls
        for (const fn of node.functions) {
            this.functions.set(fn.name || ".", fn);
        }
        // Execute entry
        this.visitMyFunction(node.entry);
        return this.scene;
    }


    visitStatement(node: Statement) {
        
        throw new Error('Method not implemented.');
    }
    visitAssignment(node: Assignment) {
        throw new Error('Method not implemented.');
    }
    visitCommand(node: Command) {
        throw new Error('Method not implemented.');
    }
    visitFunctionCall(node: FunctionCall) {
        throw new Error('Method not implemented.');
    }
    visitMovement(node: Movement) {
        throw new Error('Method not implemented.');
    }
    visitRotation(node: Rotation) {
        throw new Error('Method not implemented.');
    }
    visitSetSpeed(node: SetSpeed) {
        throw new Error('Method not implemented.');
    }
    visitCondition(node: Condition) {
        throw new Error('Method not implemented.');
    }
    visitLoop(node: Loop) {
        throw new Error('Method not implemented.');
    }
    visitVariableDeclaration(node: VariableDeclaration) {
        throw new Error('Method not implemented.');
    }
    
}
