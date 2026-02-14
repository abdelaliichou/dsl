import { MonacoEditorLanguageClientWrapper, UserConfig } from 'monaco-editor-wrapper';
import { configureWorker, defineUserServices } from './setupCommon.js';
import monarchSyntax from "./syntaxes/robo-m-language.monarch.js";
import { setup } from './web/setup.js';

export const setupConfigClassic = (): UserConfig => {
    return {
        wrapperConfig: {
            serviceConfig: defineUserServices(),
            editorAppConfig: {
                $type: 'classic',
                languageId: 'robo-m-language',
                // code: `// roboMLanguage is running in the web!`,
                code: `
let VOID entry1() {
    setSpeed(550 in MM_PER_SEC)
    var NUMBER count = 0
    loop count LESS 5 {
        count = count PLUS 1
        square()
    }
}

let VOID square() {
    FORWARD 30 in CM
    CLOCK 90
    FORWARD 300 in MM
    CLOCK 90
    FORWARD 30 in CM
    CLOCK 90
    FORWARD 30 in CM
    CLOCK 90
}

let VOID entry2() {
    setSpeed(300 in MM_PER_SEC)  
    var NUMBER dist = 100
    
    if dist GREATER 50 {
        FORWARD 50 in CM
        CLOCK 90
        FORWARD 50 in CM
    } else {
        BACKWARD 30 in CM
        CLOCK 180
    }
}

let VOID entry() {
    setSpeed(400 in MM_PER_SEC)
    
    var NUMBER side = 30
    var NUMBER turns = 0
    
    loop turns LESS 4 {
        if side GREATER 25 {
            FORWARD side in CM
        } else {
            FORWARD 10 in CM
        }
        
        CLOCK 90
        turns = turns PLUS 1
        side = side PLUS 5
    }
    
    celebrationDance()
}

let VOID celebrationDance() {
    var NUMBER spins = 0
    loop spins LESS 3 {
        CLOCK 360
        spins = spins PLUS 1
    }
}`,
                useDiffEditor: false,
                languageExtensionConfig: { id: 'langium' },
                languageDef: monarchSyntax,
                editorOptions: {
                    'semanticHighlighting.enabled': true,
                    theme: 'vs-dark'
                }
            }
        },
        languageClientConfig: configureWorker()
    };
};

function getDocumentUri(wrapper: MonacoEditorLanguageClientWrapper): string {
    return wrapper.getModel()!.uri.toString();
}

export const executeClassic = async (htmlElement: HTMLElement) => {
    const userConfig = setupConfigClassic();
    const wrapper = new MonacoEditorLanguageClientWrapper();
    await wrapper.initAndStart(userConfig, htmlElement);

    // Added for Interpreter lab part
    const client = wrapper.getLanguageClient();
    if (!client) {
        throw new Error('Unable to obtain language client!');
    }
    setup(client, getDocumentUri(wrapper)); // setup function of the setup.ts file
};

