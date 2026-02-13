import { EmptyFileSystem, URI } from 'langium';
import { Program } from '../semantics/robo-m-language-visitor.js'
import { startLanguageServer } from 'langium/lsp';
import { BrowserMessageReader, BrowserMessageWriter, createConnection } from 'vscode-languageserver/browser.js';
import { createRoboMLanguageServices } from './robo-m-language-module.js';
import { InterpretorRoboMLanguageVisitor } from '../semantics/interpreter.js';

declare const self: DedicatedWorkerGlobalScope;

const messageReader = new BrowserMessageReader(self);
const messageWriter = new BrowserMessageWriter(self);

const connection = createConnection(messageReader, messageWriter);

const { shared } = createRoboMLanguageServices({ connection, ...EmptyFileSystem });

startLanguageServer(shared);

function getModelFromUri(uri: string): Program | undefined {
    const document = shared.workspace.LangiumDocuments.getDocument(URI.parse(uri));
    if (document && document.diagnostics === undefined || document?.diagnostics?.filter((i) => i.severity === 1).length === 0) {
        return document.parseResult.value as Program;
    }
    return undefined;
}

connection.onNotification("custom/hello", (uri: string) => connection.sendNotification("custom/hello", "World"));
connection.onNotification("custom/interpretor", (uri: string) => {

    const program = getModelFromUri(uri);

    if (!program) {
        connection.sendNotification("custom/interpretor", "Program is invalid.");
        return;
    }
    const visitor = new InterpretorRoboMLanguageVisitor();

    const result = program.accept(visitor);

    connection.sendNotification("custom/interpretor", result);
});
