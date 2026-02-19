import type { ArithmeticExpression, Assignment, BinaryExpression, BooleanLiteral, Command, ComparisonExpression, Condition, Expression, FunctionCall, Loop, Movement, MyFunction, NumberLiteral, Parameter, Program, RoboMLanguageVisitor, Rotation, SensorRead, SetSpeed, Statement, UnaryExpression, UnitExpression, VariableDeclaration, VariableReference, ReturnType } from './robo-m-language-visitor.js';

export class CompilatorRoboMLanguageVisitor implements RoboMLanguageVisitor {

    private code: string[] = [];
    private indentLevel: number = 0;

    
    constructor(){
        this.code = []
        this.indentLevel = 0;
    }

    private indent() {
        return '\t'.repeat(this.indentLevel);
    }

    private addLine(line: string = '') {
        this.code.push(this.indent() + line);
    }

    getOutput() {
        return this.code.join('\n');
    }

    visitExpression(node: Expression) {
        return node.accept(this);
    }

    visitBinaryExpression(node: BinaryExpression) {
        const left = node.left.accept(this);
        const right = node.right.accept(this);
        // TODO: generate code for binary operation
        // e.g., return `(${left} ${node.operator} ${right})`;
    }

    visitArithmeticExpression(node: ArithmeticExpression) {
        const left = node.left.accept(this);
        const right = node.right.accept(this);
        var operator = ""
        switch(node.operator) {
            case 'PLUS':    operator = "+"
            case 'MINUS':   operator = "-"
            case 'MULTIPLY':operator = "*"
            case 'DIVIDE':  operator = "/"
            case 'MODULO':  operator = "%"
        } 
        return '('+left.accept()+' '+ operator +' '+right.accept()+')'
    }

    visitComparisonExpression(node: ComparisonExpression) {
        const left = node.left.accept(this);
        const right = node.right.accept(this);
        var operator = ""
        switch (node.operator) {
            case 'LESS': operator = "<"
            case 'LESS_EQ': operator = "<="
            case 'GREATER': operator = ">"
            case 'GREATER_EQ': operator = ">="
            case 'EQUALS': operator = "=="
            case 'NOT_EQUALS': operator = "!="
        }
        return '(' + left.accept() + ' ' + operator + ' ' + right.accept() + ')'
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
        const operand = node.operand.accept(this);
        // TODO: generate unary expression
        // switch(node.operator) { ... }
    }

    visitUnitExpression(node: UnitExpression) {
        const value = node.value.accept(this);
        // TODO: generate unit conversion code
    }

    visitVariableReference(node: VariableReference) {
        // TODO: generate variable reference
        // return node.variableName;
    }

    visitMyFunction(node: MyFunction) {
        //TODO: I don't knwo if it's really finished
        if (!node.name) return // ? chépa moi 

        var returnType = "";
        switch (node.returnType) {
            case 'VOID': returnType = 'void'
            case 'NUMBER': returnType = 'int'
            case 'BOOLEAN': returnType = 'boolean'
        }
        var parameters: String[] = []
        for (const param of node.parameters) {
            var paramType = ""
            switch (param.type) {
                case 'NUMBER': paramType = 'int'
                case 'BOOLEAN': paramType = 'boolean'
            }
            parameters.push(paramType + ' ' + param.name)
        }
        this.addLine(returnType + ' ' + node.name + '(' + parameters.join(', ') + '){');
        this.indentLevel++;
        for (const statement of node.body) {
            statement.accept(this);
        }
        this.indentLevel--;
        this.addLine('}');
    }

    visitParameter(node: Parameter) {
        // TODO: generate parameter
        //Are we gonna to use it ? 
    }

    visitProgram(node: Program) {
        // TODO: generate program start
        // Arduino includes and motor setup
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
        this.addLine('');

        for (const func of node.functions) {
            func.accept(this);
        }
        // generate entry point call
        // Setup function
        this.addLine('void setup() {');
        this.indentLevel +=1;
        node.entry.accept(this)
        this.indentLevel -+1;
        this.addLine('}');
        this.addLine(' ');

        //Am I an idiot ? A should include that in the Function method no ?...
        for (const func of node.functions){
            func.accept(this);
            this.addLine('')
        }

        return this.getOutput();
    }

    visitStatement(node: Statement) {
        return node.accept(this);
    }

    visitAssignment(node: Assignment) {
        const value = node.value.accept(this);
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
        const dist = node.distance.accept(this);
        // TODO: generate movement code
    }

    visitRotation(node: Rotation) {
        const angle = node.angle.accept(this);
        // TODO: generate rotation code
    }

    visitSetSpeed(node: SetSpeed) {
        const speed = node.speed.accept(this);
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
        const init = node.initialValue ? node.initialValue.accept(this) : '0';
        // this.addLine(`let ${node.name} = ${init};`);
    }
}
