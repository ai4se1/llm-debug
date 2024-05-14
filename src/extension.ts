import * as vscode from "vscode";
import * as path from "path";

export function activate(context: vscode.ExtensionContext) {
  console.log(
    'Congratulations, your extension "perplexity-debugging" is now active!'
  );

  let disposable = vscode.commands.registerCommand(
    "perplexity-debugging.helloWorld",
    () => {
      vscode.window.showInformationMessage(
        "Hello World from perplexity-debugging!"
      );
    }
  );

  context.subscriptions.push(disposable);

  const collection = vscode.languages.createDiagnosticCollection("test");
  if (vscode.window.activeTextEditor) {
    updateDiagnostics(vscode.window.activeTextEditor.document, collection);
  }
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        updateDiagnostics(editor.document, collection);
      }
    })
  );
}

async function updateDiagnostics(
  document: vscode.TextDocument,
  collection: vscode.DiagnosticCollection
): Promise<void> {
  if (document) {
    const apiUrl = "http://delos.eaalab.hpi.uni-potsdam.de:8010"; // Replace this with your actual API URL
    const documentText = document.getText();

    try {
      const response = await fetch(apiUrl + "/highlight-code/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: documentText }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch analysis from the API");
      }

      console.log("text", documentText);
      const responseData = await response.json();
      console.log("responseData", responseData);
      const warningMessage = responseData.generated_text;

      const warnings = [];
      let line = 0;
      let position = 0;

      for (let i = 0; i < warningMessage.length; i++) {
        const token = warningMessage[i][1];
        const perplexity = Number(warningMessage[i][0]);
        const thresholdInfo = 0.3;
        const thresholdWarning = 0.7;
        const thresholdError = 0.9;
        let nextposition = position + token.length;
        const nextline = line + token.split("\n").length - 1;

        if (nextline > line) {
          nextposition = token.split("\n").slice(-1)[0].length;
        }
        if (perplexity > thresholdInfo) {
          let severity = vscode.DiagnosticSeverity.Information;
          if (perplexity > thresholdWarning) {
            severity = vscode.DiagnosticSeverity.Warning;
          }
          if (perplexity > thresholdError) {
            severity = vscode.DiagnosticSeverity.Error;
          }

          console.log("token", token);
          console.log("perplexity", perplexity);
          console.log("line", line);
          console.log("position", position);
          console.log("nextline", nextline);
          console.log("nextposition", nextposition);
          const warning = {
            code: token,
            message: `There might be an issue here.`,
            range: new vscode.Range(
              new vscode.Position(line, position),
              new vscode.Position(nextline, nextposition)
            ),
            severity: severity,
            source: "Our nice tool.",
            relatedInformation: [],
            tags: [],
          };
          warnings.push(warning);
        }

        position = nextposition;
        line = nextline;
      }

      collection.set(document.uri, warnings);
    } catch (error) {
      console.error("Error fetching data from API:", error);
      // Handle error here
    }
  } else {
    collection.clear();
  }
}

export function deactivate() {
  console.log('Your extension "perplexity-debugging" is now deactivated!');
  console.log("Goodbye!");

  console.log("This is an important log message.");
  console.log("Another important log message.");
}
