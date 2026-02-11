import type {
    ValidationAcceptor,
    ValidationChecks
} from 'langium';

import type {
    ArithmeticExpression,
    Assignment,
    ComparisonExpression,
    Condition,
    Expression,
    FunctionCall,
    Loop,
    Movement,
    MyFunction,
    Parameter,
    Program,
    ReturnType,
    RoboMLanguageAstType,
    Rotation,
    SetSpeed,
    UnaryExpression,
    UnitExpression,
    VariableDeclaration,
    VariableReference,
    VariableType,
} from './generated/ast.js';

import type { RoboMLanguageServices } from './robo-m-language-module.js';

/**
 * Register validations
 */
export function registerValidationChecks(services: RoboMLanguageServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.RoboMLanguageValidator;

    const checks: ValidationChecks<RoboMLanguageAstType> = {
        MyFunction: validator.checkFunction,
        Program: validator.checkProgram,
        VariableDeclaration: validator.checkVariableDeclaration,
        Assignment: validator.checkAssignment,
        VariableReference: validator.checkVariableReference,
        Loop: validator.checkLoop,
        Condition: validator.checkCondition,
        FunctionCall: validator.checkFunctionCall,
        SetSpeed: validator.checkSetSpeed,
        Movement: validator.checkMovement,
        Rotation: validator.checkRotation,
        ComparisonExpression: validator.checkComparisonExpression,
        ArithmeticExpression: validator.checkArithmeticExpression,
        UnaryExpression: validator.checkUnaryExpression
    };

    registry.register(checks, validator);
}

/**
 * Expression types
 */
type ExprType = 'number' | 'boolean' | 'void' | 'unknown';

/**
 * Semantic Validator
 */
export class RoboMLanguageValidator {

    /* ----------------------
       PROGRAM
    ----------------------- */
    checkProgram = (program: Program, accept: ValidationAcceptor) => {
        if (!program.entry) {  
            accept('error', 'Program must have an entry function.', { node: program });
        }

        // Check that entry function has return type VOID
        if (program.entry && !this.isReturnTypeVoid(program.entry.returnType)) {
            accept('error', 'Entry function must return VOID.', {
                node: program.entry,
                property: 'returnType'
            });
        }

        // Duplicate function names (excluding entry which has no name)
        const names = new Set<string>();
        for (const f of program.functions) {
            if (!f.name) continue;

            if (names.has(f.name)) {
                accept('error', `Duplicate function '${f.name}'.`, {
                    node: f,
                    property: 'name'
                });
            }
            names.add(f.name);
        }
    };

    /* ----------------------
       FUNCTION DECLARATION
    ----------------------- */
    checkFunction = (func: MyFunction, accept: ValidationAcceptor) => {
        // Check for duplicate parameters
        this.checkDuplicateParameters(func.parameters, accept);

        // Validate return type consistency
        if (func.returnType && func.body) {
            this.checkFunctionReturnType(func, accept);
        }
    }

    private checkDuplicateParameters(params: Parameter[], accept: ValidationAcceptor) {
        const names = new Set<string>();
        for (const p of params) {
            if (!p.name) continue;

            if (names.has(p.name)) {
                accept('error', `Duplicate parameter '${p.name}'.`, {
                    node: p,
                    property: 'name'
                });
            }
            names.add(p.name);
        }
    }

    private checkFunctionReturnType(func: MyFunction, accept: ValidationAcceptor) {
        // For now, we don't enforce return statements, but you could add logic here
        // to check that non-VOID functions have return statements
    }

    /* ----------------------
       VARIABLES
    ----------------------- */
    checkVariableDeclaration = (decl: VariableDeclaration, accept: ValidationAcceptor) => {
        // Naming convention
        if (decl.name && decl.name[0] === decl.name[0].toUpperCase()) {
            accept('warning', 'Variable names should start lowercase.', { node: decl, property: 'name' });
        }

        // Type checking
        if (decl.initialValue && decl.type) {
            const declaredType = this.variableTypeToExprType(decl.type);
            const valueType = this.getExpressionType(decl.initialValue);

            if (valueType !== declaredType && valueType !== 'unknown') {
                accept('error',
                    `Variable '${decl.name}' declared as '${this.formatVariableType(decl.type)}' but initialized with '${valueType}'.`,
                    { node: decl, property: 'initialValue' });
            }
        }

        // Check for duplicate variables in scope
        this.checkDuplicateVariable(decl, accept);
    }

    private variableTypeToExprType(type?: VariableType): ExprType {
        if (!type) return 'unknown';
        
        // Handle the union type structure
        if (typeof type === 'object') {
            if ('$type' in type) {
                const typeObj = type as any;
                switch (typeObj.$type) {
                    case 'VariableType_NUMBER': return 'number';
                    case 'VariableType_BOOLEAN': return 'boolean';
                }
            }
        }
        
        // Fallback for string literals
        if (type === 'NUMBER') return 'number';
        if (type === 'BOOLEAN') return 'boolean';
        
        return 'unknown';
    }

    private formatVariableType(type?: VariableType): string {
        if (!type) return 'unknown';
        
        if (typeof type === 'object' && '$type' in type) {
            switch ((type as any).$type) {
                case 'VariableType_NUMBER': return 'NUMBER';
                case 'VariableType_BOOLEAN': return 'BOOLEAN';
            }
        }
        
        return String(type);
    }

    private checkDuplicateVariable(decl: VariableDeclaration, accept: ValidationAcceptor) {
        const container: any = decl.$container;
        if (!container?.body) return;

        const names = new Map<string, VariableDeclaration>();
        for (const stmt of container.body) {
            if ((stmt as any).$type === 'VariableDeclaration') {
                const v = stmt as VariableDeclaration;
                if (v.name && names.has(v.name) && names.get(v.name) !== v) {
                    accept('error', `Variable '${v.name}' already declared in this scope.`, {
                        node: v,
                        property: 'name'
                    });
                }
                if (v.name) names.set(v.name, v);
            }
        }
    }

    checkAssignment = (assign: Assignment, accept: ValidationAcceptor) => {
        const variableName = assign.variable;
        if (!variableName) return;

        const varDecl = this.findVariable(variableName, assign);
        const param = this.findParameter(variableName, assign);

        if (!varDecl && !param) {
            accept('error', `Variable '${variableName}' not declared.`, {
                node: assign,
                property: 'variable'
            });
            return;
        }

        const declaredType: ExprType = this.variableTypeToExprType(varDecl?.type || param?.type);
        const valueType = this.getExpressionType(assign.value);

        if (declaredType !== 'unknown' && valueType !== declaredType && valueType !== 'unknown') {
            accept('error',
                `Cannot assign '${valueType}' to variable '${variableName}' of type '${declaredType}'.`, {
                    node: assign,
                    property: 'value'
                });
        }
    };

    checkVariableReference = (ref: VariableReference, accept: ValidationAcceptor) => {
        const varName = ref.variableName;
        if (!varName) {
            accept('error', `Variable reference is missing a name.`, {
                node: ref,
                property: 'variableName'
            });
            return;
        }

        const variable = this.findVariable(varName, ref);
        const param = this.findParameter(varName, ref);

        if (!variable && !param) {
            accept('error', `Variable '${varName}' not declared.`, {
                node: ref,
                property: 'variableName'
            });
        }
    };

    /* ----------------------
       CONTROL FLOW
    ----------------------- */
    checkLoop = (loop: Loop, accept: ValidationAcceptor) => {
        const condType = this.getExpressionType(loop.condition);
        if (condType !== 'boolean' && condType !== 'unknown') {
            accept('error', `Loop condition must be boolean, got '${condType}'.`, {
                node: loop,
                property: 'condition'
            });
        }
    }

    checkCondition = (cond: Condition, accept: ValidationAcceptor) => {
        const condType = this.getExpressionType(cond.condition);
        if (condType !== 'boolean' && condType !== 'unknown') {
            accept('error', `Condition must be boolean, got '${condType}'.`, {
                node: cond,
                property: 'condition'
            });
        }
    }

    /* ----------------------
       FUNCTION CALLS
    ----------------------- */
    checkFunctionCall = (call: FunctionCall, accept: ValidationAcceptor) => {
        const program = this.getProgram(call);
        const func = program.functions.find(f => f.name === call.functionName);

        if (!func) {
            accept('error', `Unknown function '${call.functionName}'.`, { node: call, property: 'functionName' });
            return;
        }

        if ((call.arguments?.length || 0) !== (func.parameters?.length || 0)) {
            accept('error',
                `Function '${func.name}' expects ${func.parameters.length} argument(s), got ${call.arguments.length}.`,
                { node: call, property: 'arguments' });
            return;
        }

        for (let i = 0; i < func.parameters.length; i++) {
            const param = func.parameters[i];
            const arg = call.arguments[i];

            const argType = this.getExpressionType(arg);
            const paramType = this.variableTypeToExprType(param.type);

            if (argType !== paramType && argType !== 'unknown') {
                accept('error',
                    `Argument ${i + 1} to '${func.name}' should be '${paramType}', got '${argType}'.`,
                    { node: arg });
            }
        }
    };

    /* ----------------------
       ROBOT COMMANDS
    ----------------------- */
    checkMovement = (move: Movement, accept: ValidationAcceptor) => {
        const distType = this.getExpressionType(move.distance);
        if (distType !== 'number' && distType !== 'unknown') {
            accept('error', `Distance must be numeric, got '${distType}'.`, {
                node: move,
                property: 'distance'
            });
        }
        if (!move.unit) {
            accept('error', 'Movement must specify a unit.', { node: move });
        }
        if (!move.direction) {
            accept('error', 'Movement must specify a direction.', { node: move });
        }
    }

    checkSetSpeed = (cmd: SetSpeed, accept: ValidationAcceptor) => {
        const speedType = this.getExpressionType(cmd.speed);
        if (speedType !== 'number' && speedType !== 'unknown') {
            accept('error', `Speed must be numeric, got '${speedType}'.`, { node: cmd, property: 'speed' });
        }
        if (!cmd.unit) {
            accept('error', 'SetSpeed must specify a unit.', { node: cmd });
        }
    }

    checkRotation = (rot: Rotation, accept: ValidationAcceptor) => {
        const angleType = this.getExpressionType(rot.angle);
        if (angleType !== 'number' && angleType !== 'unknown') {
            accept('error', `Rotation angle must be numeric, got '${angleType}'.`, { node: rot, property: 'angle' });
        }
        if (!rot.direction) {
            accept('error', 'Rotation must specify a direction.', { node: rot });
        }
    }

    /* ----------------------
       EXPRESSION VALIDATION
    ----------------------- */
    checkComparisonExpression = (expr: ComparisonExpression, accept: ValidationAcceptor) => {
        if (!expr.operator) return; // No operator means it's just the left side

        const leftType = this.getExpressionType(expr.left);
        const rightType = this.getExpressionType(expr.right);

        if (leftType !== 'unknown' && rightType !== 'unknown' && leftType !== rightType) {
            accept('error', 
                `Comparison operator requires compatible types, got '${leftType}' and '${rightType}'.`, 
                { node: expr });
        }
    }

    checkArithmeticExpression = (expr: ArithmeticExpression, accept: ValidationAcceptor) => {
        if (!expr.operator) return; // No operator means it's just the left side

        const leftType = this.getExpressionType(expr.left);
        const rightType = this.getExpressionType(expr.right);

        if (leftType !== 'number' && leftType !== 'unknown') {
            accept('error', `Arithmetic operator requires numeric operands, got '${leftType}' on left.`, 
                { node: expr, property: 'left' });
        }
        if (rightType !== 'number' && rightType !== 'unknown') {
            accept('error', `Arithmetic operator requires numeric operands, got '${rightType}' on right.`, 
                { node: expr, property: 'right' });
        }
    }

    checkUnaryExpression = (expr: UnaryExpression, accept: ValidationAcceptor) => {
        if (!expr.operator) return;

        const operandType = this.getExpressionType(expr.operand);

        if (this.isUnaryOperatorMinus(expr.operator)) {
            if (operandType !== 'number' && operandType !== 'unknown') {
                accept('error', `Unary minus requires numeric operand, got '${operandType}'.`, 
                    { node: expr, property: 'operand' });
            }
        } else if (this.isUnaryOperatorNot(expr.operator)) {
            if (operandType !== 'boolean' && operandType !== 'unknown') {
                accept('error', `Unary NOT requires boolean operand, got '${operandType}'.`, 
                    { node: expr, property: 'operand' });
            }
        }
    }

    /* ----------------------
       TYPE INFERENCE
    ----------------------- */
    private getExpressionType(expr: Expression | undefined): ExprType {
        if (!expr) return 'unknown';

        const exprType = (expr as any).$type;

        // NumberLiteral
        if (exprType === 'NumberLiteral') {
            return 'number';
        }

        // BooleanLiteral
        if (exprType === 'BooleanLiteral') {
            return 'boolean';
        }

        // SensorRead always returns number
        if (exprType === 'SensorRead') {
            return 'number';
        }

        // VariableReference
        if (exprType === 'VariableReference') {
            const varRef = expr as VariableReference;
            const varDecl = this.findVariable(varRef.variableName || '', varRef);
            const param = this.findParameter(varRef.variableName || '', varRef);
            return this.variableTypeToExprType(varDecl?.type || param?.type);
        }

        // ArithmeticExpression
        if (exprType === 'ArithmeticExpression') {
            const aExpr = expr as ArithmeticExpression;
            if (!aExpr.operator) {
                // No operator, just return type of left side
                return this.getExpressionType(aExpr.left);
            }
            const leftType = this.getExpressionType(aExpr.left);
            const rightType = this.getExpressionType(aExpr.right);
            return leftType === 'number' && rightType === 'number' ? 'number' : 'unknown';
        }

        // ComparisonExpression
        if (exprType === 'ComparisonExpression') {
            const cExpr = expr as ComparisonExpression;
            if (!cExpr.operator) {
                // No operator, just return type of left side (which should be a PrimaryExpression)
                return this.getExpressionType(cExpr.left);
            }
            // Comparison always returns boolean
            return 'boolean';
        }

        // UnaryExpression
        if (exprType === 'UnaryExpression') {
            const uExpr = expr as UnaryExpression;
            if (!uExpr.operator) {
                // No operator, return operand type
                return this.getExpressionType(uExpr.operand);
            }
            const operandType = this.getExpressionType(uExpr.operand);
            if (this.isUnaryOperatorNot(uExpr.operator)) {
                return operandType === 'boolean' ? 'boolean' : 'unknown';
            }
            if (this.isUnaryOperatorMinus(uExpr.operator)) {
                return operandType === 'number' ? 'number' : 'unknown';
            }
            return 'unknown';
        }

        // UnitExpression
        if (exprType === 'UnitExpression') {
            const uExpr = expr as UnitExpression;
            return this.getExpressionType(uExpr.value);
        }

        // FunctionCall
        if (exprType === 'FunctionCall') {
            const fCall = expr as unknown as FunctionCall;
            const program = this.getProgram(fCall);
            const func = program.functions.find(f => f.name === fCall.functionName);
            if (!func) return 'unknown';
            return this.returnTypeToExprType(func.returnType);
        }

        return 'unknown';
    }

    private returnTypeToExprType(type?: ReturnType): ExprType {
        if (!type) return 'unknown';
        
        // Handle the union type structure
        if (typeof type === 'object' && '$type' in type) {
            switch ((type as any).$type) {
                case 'ReturnType_NUMBER': return 'number';
                case 'ReturnType_BOOLEAN': return 'boolean';
                case 'ReturnType_VOID': return 'void';
            }
        }
        
        // Fallback for string literals
        if (type === 'NUMBER') return 'number';
        if (type === 'BOOLEAN') return 'boolean';
        if (type === 'VOID') return 'void';
        
        return 'unknown';
    }

    /* ----------------------
       TYPE GUARDS
    ----------------------- */
    private isReturnTypeVoid(type?: ReturnType): boolean {
        if (!type) return false;
        
        if (typeof type === 'object' && '$type' in type) {
            return (type as any).$type === 'ReturnType_VOID';
        }
        
        return type === 'VOID';
    }

    private isUnaryOperatorMinus(operator: any): boolean {
        if (typeof operator === 'object' && '$type' in operator) {
            return operator.$type === 'UnaryOperator_MINUS';
        }
        return operator === 'MINUS';
    }

    private isUnaryOperatorNot(operator: any): boolean {
        if (typeof operator === 'object' && '$type' in operator) {
            return operator.$type === 'UnaryOperator_NOT';
        }
        return operator === 'NOT';
    }

    /* ----------------------
       HELPERS
    ----------------------- */
    private findVariable(name: string, node: any): VariableDeclaration | undefined {
        let current = node;
        while (current) {
            const container = current.$container;
            if (container?.body) {
                for (const stmt of container.body) {
                    if (stmt.$type === 'VariableDeclaration' && stmt.name === name) {
                        return stmt;
                    }
                }
            }
            current = container;
        }
        return undefined;
    }

    private findParameter(name: string, node: any): Parameter | undefined {
        let current = node.$container;
        while (current) {
            if (current.$type === 'MyFunction') {
                for (const p of current.parameters || []) {
                    if (p.name === name) return p;
                }
            }
            current = current.$container;
        }
        return undefined;
    }

    private getProgram(node: any): Program {
        let current = node;
        while (current.$container) {
            current = current.$container;
        }
        return current as Program;
    }
}