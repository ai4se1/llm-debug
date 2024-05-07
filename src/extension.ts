import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "perplexity-debugging" is now active!');

    let disposable = vscode.commands.registerCommand('perplexity-debugging.helloWorld', () => {
        vscode.window.showInformationMessage('Hello World from perplexity-debugging!');
    });

    context.subscriptions.push(disposable);

    const collection = vscode.languages.createDiagnosticCollection('test');
	if (vscode.window.activeTextEditor) {
		updateDiagnostics(vscode.window.activeTextEditor.document, collection);
	}
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(editor => {
		if (editor) {
			updateDiagnostics(editor.document, collection);
		}
	}));
}

function updateDiagnostics(document: vscode.TextDocument, collection: vscode.DiagnosticCollection): void {
	if (document) {
		collection.set(document.uri, [{
			code: '10+10 = 45',
			message: 'cannot assign twice to immutable variable `x`',
			range: new vscode.Range(new vscode.Position(0, 0), new vscode.Position(10, 10)),
			severity: vscode.DiagnosticSeverity.Warning,
			source: '',
			relatedInformation: [
				new vscode.DiagnosticRelatedInformation(new vscode.Location(document.uri, new vscode.Range(new vscode.Position(1, 8), new vscode.Position(1, 9))), 'first assignment to `x`')
            ],
            tags: [vscode.DiagnosticTag.Deprecated, vscode.DiagnosticTag.Unnecessary],

		}]);
	} else {
		collection.clear();
	}
}

export function deactivate() {}
