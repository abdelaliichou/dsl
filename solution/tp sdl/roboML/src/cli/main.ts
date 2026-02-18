import type { Program } from '../language/generated/ast.js';
import chalk from 'chalk';
import { Command } from 'commander';
// import { RoboMLanguageLanguageMetaData } from '../language/generated/module.js';
import { createRoboMLanguageServices } from '../language/robo-m-language-module.js';
import { extractAstNode } from './cli-util.js';
import { generateJavaScript } from './generator.js';
import { NodeFileSystem } from 'langium/node';
import type { ValidationAcceptor } from 'langium'
import * as url from 'node:url';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
// import { RoboMLanguageValidationVisitor } from '../semantics/robo-m-language-visitor.js';
// import { CompilatorRoboMLanguageVisitor } from '../semantics/compiler.js';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const packagePath = path.resolve(__dirname, '..', '..', 'package.json');
const packageContent = await fs.readFile(packagePath, 'utf-8');

export const generateAction = async (fileName: string, opts: GenerateOptions): Promise<void> => {
    const services = createRoboMLanguageServices(NodeFileSystem).RoboMLanguage;
    const program = await extractAstNode<Program>(fileName, services);
    const generatedFilePath = generateJavaScript(program, fileName, opts.destination);
    console.log(chalk.green(`JavaScript code generated successfully: ${generatedFilePath}`));
};



export type GenerateOptions = {
    destination?: string;
}


export const parseAndValidate = async (fileName: string): Promise<void> => {
    const services = createRoboMLanguageServices(NodeFileSystem).RoboMLanguage;
    const program = await extractAstNode<Program>(fileName, services);
    // 3. Access the validator
    const validator = services.validation.RoboMLanguageValidator;

    // 4. Collect diagnostics
    const messages: { type: string; text: string; node: any; property?: string }[] = [];
    const accept: ValidationAcceptor = (severity, message, context) => {
        messages.push({ type: severity, text: message, ...context });
    };
    // 5. Run validation on the program
    validator.checkProgram(program, accept);

    // 6. Recursively validate all functions
    for (const func of program.functions) {
        validator.checkFunction(func, accept);
    }

    // 7. Recursively validate statements in the program entry
    const validateStatements = (stmts: any[]) => {
        for (const stmt of stmts) {
            switch (stmt.$type) {
                case 'VariableDeclaration':
                    validator.checkVariableDeclaration(stmt, accept);
                    break;
                case 'Assignment':
                    validator.checkAssignment(stmt, accept);
                    break;
                case 'Movement':
                    validator.checkMovement(stmt, accept);
                    break;
                case 'Rotation':
                    validator.checkRotation(stmt, accept);
                    break;
                case 'SetSpeed':
                    validator.checkSetSpeed(stmt, accept);
                    break;
                case 'Loop':
                    validator.checkLoop(stmt, accept);
                    validateStatements(stmt.body);
                    break;
                case 'Condition':
                    validator.checkCondition(stmt, accept);
                    validateStatements(stmt.thenBlock);
                    validateStatements(stmt.elseBlock);
                    break;
                case 'FunctionCall':
                    validator.checkFunctionCall(stmt, accept);
                    break;
                case 'ArithmeticExpression':
                    validator.checkArithmeticExpression(stmt, accept);
                    break;
                case 'ComparisonExpression':
                    validator.checkComparisonExpression(stmt, accept);
                    break;
                case 'UnaryExpression':
                    validator.checkUnaryExpression(stmt, accept);
                    break;
                case 'VariableReference':
                    validator.checkVariableReference(stmt, accept);
                    break;
                default:
                    // Other statements can be handled if needed
                    break;
            }
        }
    };

    if (program.entry && program.entry.body) {
        validateStatements(program.entry.body);
    }

    // 8. Print results
    if (messages.length === 0) {
        console.log(chalk.green(`✅ No validation errors found in '${fileName}'`));
    } else {
        console.log(chalk.yellow(`⚠️ Validation results for '${fileName}':`));
        for (const msg of messages) {
            const prefix = msg.type === 'error' ? chalk.red('[ERROR]') : chalk.yellow('[WARNING]');
            const prop = msg.property ? ` (property: ${msg.property})` : '';
            console.log(`${prefix} ${msg.text}${prop}`);
        }
    }
};


export default function(): void {
    const program = new Command();

    program.version(JSON.parse(packageContent).version);

    program
        .command('parseAndValidate')
        .argument('<file>', 'Source file to parse & validate (ending in ${fileExtensions})')
        .description('Indicates where a program parses & validates successfully, but produces no output code')
        .action(parseAndValidate) // we'll need to implement this function

    //const fileExtensions = RoboMLanguageLanguageMetaData.fileExtensions.join(', ');
    // program
    //     .command('generate')
    //     .argument('<file>', `source file (possible file extensions: ${fileExtensions})`)
    //     .option('-d, --destination <dir>', 'destination directory of generating')
    //     .description('generates JavaScript code that prints "Hello, {name}!" for each greeting in a source file')
    //     .action(generateAction);

    program.parse(process.argv);
}