import type { ArithmeticExpression, Assignment, BinaryExpression, BooleanLiteral, Command, ComparisonExpression, Condition, Expression, FunctionCall, Loop, Movement, MyFunction, NumberLiteral, Parameter, Program, RoboMLanguageVisitor, Rotation, SensorRead, SetSpeed, Statement, UnaryExpression, UnitExpression, VariableDeclaration, VariableReference } from './robo-m-language-visitor.js';

export class CompilatorRoboMLanguageVisitor implements RoboMLanguageVisitor {

    private code: string[] = [];
    private indentLevel: number = 0;

    
    constructor(){
        this.code = []
        this.indentLevel = 0;
    }

    // private indent() {
    //     return '\t'.repeat(this.indentLevel);
    // }

    // private addLine(line: string = '') {
    //     this.code.push(this.indent() + line);
    // }

    getOutput() {
        return this.code.join('\n');
    }

    visitExpression(node: Expression) {
        return node.accept(this);
    }

    visitBinaryExpression(node: BinaryExpression) {
        // const left = node.left.accept(this);
        // const right = node.right.accept(this);
        // TODO: generate code for binary operation
        // e.g., return `(${left} ${node.operator} ${right})`;
    }

    visitArithmeticExpression(node: ArithmeticExpression) {
        // const left = node.left.accept(this);
        // const right = node.right.accept(this);
        // TODO: generate arithmetic expression
        // switch(node.operator) { ... }
    }

    visitComparisonExpression(node: ComparisonExpression) {
        // const left = node.left.accept(this);
        // const right = node.right.accept(this);
        // TODO: generate comparison code
    }

    visitBooleanLiteral(node: BooleanLiteral) {
        // TODO: generate boolean literal
        // return node.value ? 'true' : 'false';
    }

    visitNumberLiteral(node: NumberLiteral) {
        // TODO: generate number literal
        // return node.value.toString();
    }

    visitSensorRead(node: SensorRead) {
        // TODO: generate sensor read code
    }

    visitUnaryExpression(node: UnaryExpression) {
        // const operand = node.operand.accept(this);
        // TODO: generate unary expression
        // switch(node.operator) { ... }
    }

    visitUnitExpression(node: UnitExpression) {
        // const value = node.value.accept(this);
        // TODO: generate unit conversion code
    }

    visitVariableReference(node: VariableReference) {
        // TODO: generate variable reference
        // return node.variableName;
    }

    visitMyFunction(node: MyFunction) {
        // TODO: generate function declaration
        // this.addLine(`function ${node.name}() {`);
        this.indentLevel++;
        for (const statement of node.body) {
            statement.accept(this);
        }
        this.indentLevel--;
        // this.addLine('}');
    }

    visitParameter(node: Parameter) {
        // TODO: generate parameter
    }

    visitProgram(node: Program) {
        // TODO: generate program start
        for (const func of node.functions) {
            func.accept(this);
        }
        // generate entry point call
        // node.entry.accept(this);
        return this.getOutput();
    }

    visitStatement(node: Statement) {
        return node.accept(this);
    }

    visitAssignment(node: Assignment) {
        // const value = node.value.accept(this);
        // TODO: generate assignment code
        // this.addLine(`${node.variable} = ${value};`);
    }

    visitCommand(node: Command) {
        // TODO: generate command
    }

    visitFunctionCall(node: FunctionCall) {
        // TODO: generate function call
        // this.addLine(`${node.functionName}();`);
    }

    visitMovement(node: Movement) {
        // const dist = node.distance.accept(this);
        // TODO: generate movement code
    }

    visitRotation(node: Rotation) {
        // const angle = node.angle.accept(this);
        // TODO: generate rotation code
    }

    visitSetSpeed(node: SetSpeed) {
        // const speed = node.speed.accept(this);
        // TODO: generate speed setting code
    }

    visitCondition(node: Condition) {
        // TODO: generate if/else
        // this.addLine('if (...) {');
        this.indentLevel++;
        for (const stmt of node.thenBlock) {
            stmt.accept(this);
        }
        this.indentLevel--;
        // this.addLine('} else {');
        this.indentLevel++;
        for (const stmt of node.elseBlock) {
            stmt.accept(this);
        }
        this.indentLevel--;
        // this.addLine('}');
    }

    visitLoop(node: Loop) {
        // TODO: generate loop
        // this.addLine('while (...) {');
        this.indentLevel++;
        for (const stmt of node.body) {
            stmt.accept(this);
        }
        this.indentLevel--;
        // this.addLine('}');
    }

    visitVariableDeclaration(node: VariableDeclaration) {
        // TODO: generate variable declaration
        // const init = node.initialValue ? node.initialValue.accept(this) : '0';
        // this.addLine(`let ${node.name} = ${init};`);
    }
}
