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

connection.onNotification("roboml/validate", (uri: string) => {
     try {
        const document = shared.workspace.LangiumDocuments.getDocument(URI.parse(uri));
        
        if (!document) {
            connection.sendNotification("roboml/validate", {
                success: false,
                message: "Document not found."
            });
            return;
        }

        // Check for syntax errors (parsing errors)
        const syntaxErrors = document.diagnostics?.filter((d) => d.severity === 1) || [];
        
        if (syntaxErrors.length > 0) {
            connection.sendNotification("roboml/validate", {
                success: false,
                errors: syntaxErrors.map((d: { message: any; range: any; }) => ({
                    message: d.message,
                    range: d.range
                }))
            });
            return;
        }

        // If no syntax errors, validation passed
        connection.sendNotification("roboml/validate", {
            success: true,
            message: "Program is valid!"
        });
        
    } catch (error) {
        console.error("ERROR during validation:", error);
        connection.sendNotification("roboml/validate", {
            success: false,
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

connection.onNotification("roboml/buildScene", async (uri: string) => {
    try {
            const program = getModelFromUri(uri);
            
            if (!program) {
                console.log("No program found");
                connection.sendNotification("roboml/buildScene", {
                    success: false,
                    message: "Program contains errors."
                });
                return;
            }

            console.log("Program found, creating visitor...");
            const visitor = new InterpretorRoboMLanguageVisitor();
            
            console.log("Visitor created, accepting program...");
            const scene = await program.accept(visitor);
            
            console.log("Scene built successfully:", scene);
            console.log("Timestamps count:", scene.timestamps.length);

            // Convert to plain JSON
            const sceneDTO = {
                size: { x: scene.size.x, y: scene.size.y },
                entities: scene.entities.map((e: { type: any; pos: { x: any; y: any; }; size: { x: any; y: any; }; }) => ({
                    type: e.type,
                    pos: { x: e.pos.x, y: e.pos.y },
                    size: { x: e.size.x, y: e.size.y }
                })),
                robot: {
                    pos: { x: scene.robot.pos.x, y: scene.robot.pos.y },
                    size: { x: scene.robot.size.x, y: scene.robot.size.y },
                    rad: scene.robot.rad,
                    speed: scene.robot.speed,
                    type: scene.robot.type
                },
                time: scene.time,
                timestamps: scene.timestamps.map((t: { time: any; pos: { x: any; y: any; }; rad: any; size: { x: any; y: any; }; speed: any; }) => ({
                    time: t.time,
                    pos: { x: t.pos.x, y: t.pos.y },
                    rad: t.rad,
                    size: { x: t.size.x, y: t.size.y },
                    speed: t.speed
                }))
            };

            console.log("Sending scene to client...");
            connection.sendNotification("roboml/buildScene", {
                success: true,
                scene: sceneDTO
            });
            console.log("Scene sent!");
            
        } catch (error) {
            console.error("ERROR building scene:", error);
            connection.sendNotification("roboml/buildScene", {
                success: false,
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            });
        }
    }); 
