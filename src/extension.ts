import * as vscode from "vscode";

const apiUrl = "http://delos.eaalab.hpi.uni-potsdam.de:8010";

export function activate(context: vscode.ExtensionContext) {
  console.log(
    'Congratulations, your extension "perplexity-debugging" is now active!'
  );

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
  vscode.commands.registerCommand(
    "perplexity-debugging.debugsession",
    async () => {
      const thread_result =
        await vscode.debug.activeDebugSession?.customRequest("threads", {});
      const stack_traces = await vscode.debug.activeDebugSession?.customRequest(
        "stackTrace",
        { threadId: thread_result.threads[0].id, startFrame: 0, levels: 1 }
      );
      const current_stack_trace = stack_traces.stackFrames[0];
      const scopes = await vscode.debug.activeDebugSession?.customRequest(
        "scopes",
        { frameId: current_stack_trace.id }
      );
      const variables = await vscode.debug.activeDebugSession?.customRequest(
        "variables",
        { variablesReference: scopes.scopes[0].variablesReference }
      );
      variables["variables"].forEach((variable: any) => {
        console.log(`${variable.name} ${variable.value}`);
      });
    }
  );
}

async function findProblems(
  document: vscode.TextDocument,
  collection: vscode.DiagnosticCollection
): Promise<void> {
  if (document) {
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

export function deactivate() {
  console.log('Your extension "perplexity-debugging" is now deactivated!');
  console.log("Goodbye!");
}
