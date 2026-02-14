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

//connection.onNotification("custom/hello", (uri: string) => connection.sendNotification("custom/hello", "World"));

//For now, it does nothing lol
connection.onNotification("roboml/validate", (uri: string) => {
    const program = getModelFromUri(uri);

    if (!program) {
        connection.sendNotification("roboml/validate", {
            success: false,
            message: "Program contains errors."
        });
        return;
    }

    //Here we should validate it. And then on the client side we call the typechecker maybe ?
    connection.sendNotification("roboml/validate", {
        success: true
    });
});

//
connection.onNotification("roboml/buildScene", (uri: string) => {
    const program = getModelFromUri(uri);
    console.log("Program Received: Start building scene");
    if (!program) {
        console.log("No program")
        connection.sendNotification("roboml/buildScene", {
            success: false,
            message: "Program contains errors."
        });
        return;
    }

    const visitor = new InterpretorRoboMLanguageVisitor();
    const scene = program.accept(visitor);

    // Convert to plain JSON (important!)
    const sceneDTO = {
        size: scene.size,
        entities: scene.entities,
        robot: scene.robot,
        timestamps: scene.timestamps
    };

    connection.sendNotification("roboml/buildScene", {
        success: true,
        scene: sceneDTO
    });
});
