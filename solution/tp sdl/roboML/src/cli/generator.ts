import type { Program } from '../language/generated/ast.js';
import { CompositeGeneratorNode, NL, toString } from 'langium/generate';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { extractDestinationAndName } from './cli-util.js';

export function generateJavaScript(program: Program, filePath: string, destination: string | undefined): string {
    const data = extractDestinationAndName(filePath, destination);
    const generatedFilePath = `${path.join(data.destination, data.name)}.js`;

    const fileNode = new CompositeGeneratorNode();
    fileNode.append('"use strict";', NL, NL);
    
    // Generate entry function
    if (program.entry) {
        fileNode.append(`// Entry function: ${program.entry.returnType} entry()`, NL);
        fileNode.append('function entry() {', NL);
        fileNode.indent(body => {
            body.append('// Function body here', NL);
        });
        fileNode.append('}', NL, NL);
    }
    
    // Generate other functions
    for (const func of program.functions) {
        fileNode.append(`// Function: ${func.returnType} ${func.name}()`, NL);
        fileNode.append(`function ${func.name}() {`, NL);
        fileNode.indent(body => {
            body.append('// Function body here', NL);
        });
        fileNode.append('}', NL, NL);
    }
    
    fileNode.append('// Call entry function', NL);
    fileNode.append('entry();', NL);

    if (!fs.existsSync(data.destination)) {
        fs.mkdirSync(data.destination, { recursive: true });
    }
    fs.writeFileSync(generatedFilePath, toString(fileNode));
    return generatedFilePath;
}