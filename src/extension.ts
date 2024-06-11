import * as vscode from "vscode";

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

  let updateDiagnosticsCommand = vscode.commands.registerCommand(
    "perplexity-debugging.findProblems",
    () => {
      if (vscode.window.activeTextEditor) {
        findProblems(vscode.window.activeTextEditor.document, collection);
      }
    }
  );

  context.subscriptions.push(updateDiagnosticsCommand);
  console.log("updateDiagnosticsCommand registered");
}

async function findProblems(
  document: vscode.TextDocument,
  collection: vscode.DiagnosticCollection
): Promise<void> {
  if (document) {
    const apiUrl = "http://delos.eaalab.hpi.uni-potsdam.de:8010";
    const documentText = document.getText();
    const languageId = document.languageId;
    console.log("languageId", languageId);
    vscode.window.showInformationMessage("Finding problems...");
    try {
      const response = await fetch(apiUrl + "/highlight-code/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: documentText, language: languageId }),
      });
      console.log("response", response);

      if (!response.ok) {
        throw new Error("Failed to fetch analysis from the API");
      }

      console.log("text", documentText);
      const responseData = await response.json();
      console.log("responseData", responseData);

      const warnings = [];

      for (let i = 0; i < responseData.length; i++) {
        // -1 because the line numbers are 1-indexed
        const line = responseData[i].line_number - 1;
        const warning = {
          code: responseData[i].problematic_line_of_code,
          message: responseData[i].description,
          range: new vscode.Range(
            new vscode.Position(line, 0),
            new vscode.Position(line, 100)
          ),
          severity: vscode.DiagnosticSeverity.Information,
          source: "Your debugging AI assistant.",
          relatedInformation: [],
          tags: [],
        };
        warnings.push(warning);
      }
      if (warnings.length === 0) {
        vscode.window.showInformationMessage("No problems found!");
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

async function updateDiagnostics(
  document: vscode.TextDocument,
  collection: vscode.DiagnosticCollection
): Promise<void> {
  if (document) {
    const apiUrl = "http://delos.eaalab.hpi.uni-potsdam.de:8010";
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
        const thresholdInfo = 0.9;
        const thresholdWarning = 1;
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
