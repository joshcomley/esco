import * as vscode from "vscode";
import { Configuration } from "./src/configuration";
import { Esco } from "./src/esco";

let configuration = getConfiguration();

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('esco.organize', () => organize(vscode.window.activeTextEditor?.document)));
    context.subscriptions.push(vscode.commands.registerCommand('esco.organizeAll', () => organizeAll()));

    vscode.workspace.onDidChangeConfiguration(e => configuration = getConfiguration())

    vscode.workspace.onWillSaveTextDocument(e => {
        if (vscode.window.activeTextEditor &&
            vscode.window.activeTextEditor.document.fileName == e.document.fileName) {
            if (configuration.organizeOnSave) {
                configuration = getConfiguration();
                organize(vscode.window.activeTextEditor.document);
            }
        }
    });
}

function getConfiguration() {
    let configuration = vscode.workspace.getConfiguration("esco");

    return new Configuration(
        configuration.get<boolean>("addPublicModifierIfMissing") === true,
        configuration.get<boolean>("organizeOnSave") === true);
}

function organizeAll() {
    let completedCount = 0;
    vscode.window.showInformationMessage("Finding files to organize");
    vscode.workspace.findFiles("**/*.ts", "**/node_modules/**")
        .then(typescriptFiles => {
            if (typescriptFiles.length === 0) {
                vscode.window.showInformationMessage("No files found to organize");
            } else {
                vscode.window.showInformationMessage(`Organizing ${typescriptFiles.length} files`);
                typescriptFiles.forEach(typescriptFile => vscode.workspace.openTextDocument(typescriptFile)
                    .then(document => {
                        organize(document).then(() => {
                            completedCount++;
                            if (completedCount >= typescriptFiles.length) {
                                vscode.window.showInformationMessage("Completed organizing all files");
                            }
                        });
                    }));
            }
        });
}

function organize(document: vscode.TextDocument | undefined) {
    if (document) {
        return new Promise<void>(resolver => {
            let sourceCode = document.getText();
            let fileName = document.fileName;

            new Esco(configuration).organizeTypes(sourceCode, fileName).then(newSourceCode => {
                let edit: vscode.WorkspaceEdit;
                let start: vscode.Position;
                let end: vscode.Position;
                let range: vscode.Range;
                start = new vscode.Position(0, 0);
                end = new vscode.Position(document.lineCount, document.lineAt(document.lineCount - 1).text.length);
                range = new vscode.Range(start, end);

                edit = new vscode.WorkspaceEdit();
                edit.replace(document.uri, range, newSourceCode);

                vscode.workspace.applyEdit(edit).then(_ => {
                    resolver();
                });
            });
        });
    } else {
        return Promise.resolve();
    }
}
