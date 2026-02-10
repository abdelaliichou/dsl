import type {
    ValidationAcceptor,
    ValidationChecks
} from 'langium';

import type {
    Assignment,
    Condition,
    EntryFunction,
    FunctionCall,
    FunctionDeclaration,
    Loop,
    Movement,
    Program,
    RoboMLanguageAstType,
    Rotation,
    SetSpeed,
    VariableDeclaration,
    VariableReference
} from './generated/ast.js';

import type { RoboMLanguageServices } from './robo-m-language-module.js';

/**
 * Register validations
 */
export function registerValidationChecks(services: RoboMLanguageServices) {

    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.RoboMLanguageValidator;

    const checks: ValidationChecks<RoboMLanguageAstType> = {

        FunctionDeclaration: (func, accept) => {
            validator.checkFunction(func, accept);
            validator.checkFunctionReturn(func, accept); // NEW
        },
        EntryFunction: (entry, accept) => {
            validator.checkEntry(entry, accept);
            validator.checkFunctionReturn(entry, accept); // NEW
        },

        Program: validator.checkProgram,

        VariableDeclaration: validator.checkVariableDeclaration,

        Assignment: validator.checkAssignment,

        VariableReference: validator.checkVariableReference,

        Loop: validator.checkLoop,

        Condition: validator.checkCondition,

        FunctionCall: validator.checkFunctionCall,

        SetSpeed: validator.checkSetSpeed,

        Movement: validator.checkMovement,

        Rotation: validator.checkRotation
    };

    registry.register(checks, validator);
}

/**
 * Semantic Validator
 */
export class RoboMLanguageValidator {

    /* ----------------------------------
       PROGRAM RULES
    ---------------------------------- */

    checkProgram(program: Program, accept: ValidationAcceptor) {

        /* Only one entry function */

        if (!program.entry) {
            accept('error', 'Program must have an entry function.', {
                node: program
            });
        }

        /* No duplicate functions */

        const names = new Set<string>();

        for (const f of program.functions) {
            if (names.has(f.name)) {
                accept('error', `Duplicate function '${f.name}'.`, {
                    node: f,
                    property: 'name'
                });
            }
            names.add(f.name);
        }
    }

    checkEntry(entry: EntryFunction, accept: ValidationAcceptor) {

        /* Entry must be void */

        if (entry.returnType !== 'void') {
            accept('error', 'Entry function must return void.', {
                node: entry,
                property: 'returnType'
            });
        }
    }

    /* ----------------------------------
       FUNCTION RULES
    ---------------------------------- */

    checkFunction(func: FunctionDeclaration, accept: ValidationAcceptor) {

        /* No duplicate parameters */

        const params = new Set<string>();

        for (const p of func.parameters) {
            if (params.has(p.name)) {
                accept('error', `Duplicate parameter '${p.name}'.`, {
                    node: p,
                    property: 'name'
                });
            }
            params.add(p.name);
        }
    }

    checkFunctionReturn(func: FunctionDeclaration | EntryFunction, accept: ValidationAcceptor) {
        const expected = func.returnType; // 'void' | 'number' | 'boolean'

        // Traverse all statements to find ReturnStatements
        const body = func.body ?? [];
        for (const stmt of body) {
            this.checkReturnInStatement(stmt, expected, accept);
        }
    }
    
    private checkReturnInStatement(stmt: any, expected: string, accept: ValidationAcceptor) {
        if (stmt.$type === 'ReturnStatement') {
            const expr = stmt.value;

            if (expected === 'void' && expr != null) {
                accept('error', `Function is declared void but returns a value.`, { node: stmt, property: 'value' });
            } else if (expected !== 'void' && expr != null) {
                const type = this.getExpressionType(expr);
                if (type !== expected) {
                    accept('error', `Function should return '${expected}' but returns '${type}'.`, { node: stmt, property: 'value' });
                }
            }
        }

        // Recursively check inside blocks
        if (stmt.body) {
            for (const s of stmt.body) {
                this.checkReturnInStatement(s, expected, accept);
            }
        }
    }

    private getExpressionType(expr: any): string {
        if (!expr) return 'void';
        switch (expr.$type) {
            case 'NumberLiteral': return 'number';
            case 'BooleanLiteral': return 'boolean';
            case 'VariableReference': {
                const v = this.findVariable(expr.variableName, expr);
                return v?.type ?? 'unknown';
            }
            default: return 'unknown';
        }
    }

    /* ----------------------------------
       VARIABLE RULES
    ---------------------------------- */

    checkVariableDeclaration(decl: VariableDeclaration, accept: ValidationAcceptor) {

        /* Lowercase naming */

        if (decl.name[0] === decl.name[0].toUpperCase()) {
            accept('warning', 'Variable should start with lowercase.', {
                node: decl,
                property: 'name'
            });
        }

        /* No duplicate variables in same block */

        const container: any = decl.$container;

        if (container?.body) {

            const names = new Set<string>();

            for (const stmt of container.body) {

                if (stmt.$type === 'VariableDeclaration') {

                    const v = stmt as VariableDeclaration;

                    if (names.has(v.name)) {
                        accept('error', `Variable '${v.name}' already declared.`, {
                            node: v,
                            property: 'name'
                        });
                    }

                    names.add(v.name);
                }
            }
        }
    }

    checkAssignment(assign: Assignment, accept: ValidationAcceptor) {

        const variable = this.findVariable(assign.variable, assign);

        if (!variable) {
            accept('error', `Variable '${assign.variable}' not declared.`, {
                node: assign,
                property: 'variable'
            });
        }
    }

    checkVariableReference(ref: VariableReference, accept: ValidationAcceptor) {

        const variable = this.findVariable(ref.variableName, ref);

        if (!variable) {
            accept('error', `Variable '${ref.variableName}' not declared.`, {
                node: ref,
                property: 'variableName'
            });
        }
    }

    /* ----------------------------------
       CONTROL FLOW
    ---------------------------------- */

    checkLoop(loop: Loop, accept: ValidationAcceptor) {

        if (!this.isBooleanExpression(loop.condition)) {
            accept('error', 'Loop condition must be boolean.', {
                node: loop,
                property: 'condition'
            });
        }
    }

    checkCondition(cond: Condition, accept: ValidationAcceptor) {

        if (!this.isBooleanExpression(cond.condition)) {
            accept('error', 'If condition must be boolean.', {
                node: cond,
                property: 'condition'
            });
        }
    }

    /* ----------------------------------
       FUNCTIONS
    ---------------------------------- */

    checkFunctionCall(call: FunctionCall, accept: ValidationAcceptor) {

        const program = this.getProgram(call);

        const func = program.functions.find(
            f => f.name === call.functionName
        );

        if (!func) {
            accept('error', `Unknown function '${call.functionName}'.`, {
                node: call,
                property: 'functionName'
            });
            return;
        }

        /* Check arity */

        if (call.arguments.length !== func.parameters.length) {
            accept(
                'error',
                `Function '${func.name}' expects ${func.parameters.length} arguments.`,
                { node: call }
            );
        }
    }

    /* ----------------------------------
       ROBOT COMMANDS
    ---------------------------------- */
    checkMovement(move: Movement, accept: ValidationAcceptor) {
        if (!this.isNumericExpression(move.distance)) {
            accept('error', 'Distance must be numeric.', { node: move, property: 'distance' });
        }
    }

    checkSetSpeed(cmd: SetSpeed, accept: ValidationAcceptor) {
        if (!this.isNumericExpression(cmd.speed)) {
            accept('error', 'Speed must be numeric.',
                 { node: cmd, property: 'speed' });
        }
    }

    checkRotation(rot: Rotation, accept: ValidationAcceptor) {
        if (!this.isNumericExpression(rot.angle)) {
            accept('error', 'Rotation angle must be numeric.', { node: rot, property: 'angle' });
        }
    }

    /* ----------------------------------
       HELPERS
    ---------------------------------- */

    private findVariable(name: string, node: any): VariableDeclaration | undefined {

        let current = node.$container;

        while (current) {

            if (current.body) {

                for (const stmt of current.body) {
                    if (
                        stmt.$type === 'VariableDeclaration' &&
                        stmt.name === name
                    ) {
                        return stmt;
                    }
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

    private isNumericVariable(name: string, node: any): boolean {
        // 1. Check local variables
        let current = node.$container;
        while (current) {
            if (current.body) {
                for (const stmt of current.body) {
                    if (stmt.$type === 'VariableDeclaration' && stmt.name === name) {
                        return stmt.type === 'number';
                    }
                }
            }
            current = current.$container;
        }

        // 2. Check function parameters
        current = node.$container;
        while (current) {
            if (current.$type === 'FunctionDeclaration' || current.$type === 'EntryFunction') {
                for (const param of current.parameters) {
                    if (param.name === name) {
                        return param.type === 'number';
                    }
                }
            }
            current = current.$container;
        }

        return false;
    }

    private isNumericExpression(expr: any, visited = new Set<any>()): boolean {
        if (!expr || visited.has(expr)) return false;
        visited.add(expr);

        switch (expr.$type) {
            case 'NumberLiteral':
                return true;

            case 'VariableReference':
                return this.isNumericVariable(expr.variableName, expr);

            case 'UnaryExpression':
                return this.isNumericExpression(expr.operand, visited);

            case 'AdditiveExpression':
            case 'MultiplicativeExpression':
            case 'ArithmeticExpression':
                return (
                    this.isNumericExpression(expr.left, visited) &&
                    this.isNumericExpression(expr.right, visited)
                );

            default:
                return false;
        }
    }


    private isBooleanExpression(expr: any): boolean {

        if (!expr) return false;

        return (
            expr.$type === 'BooleanLiteral' ||
            expr.operator === '==' ||
            expr.operator === '!=' ||
            expr.operator === '<' ||
            expr.operator === '>'
        );
    }
}
