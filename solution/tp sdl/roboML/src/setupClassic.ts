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
                code: `let VOID entry() {
    setSpeed(150 in MM_PER_SEC)
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

