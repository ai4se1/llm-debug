import { get } from "http";
import * as vscode from "vscode";

const apiUrl = "http://delos.eaalab.hpi.uni-potsdam.de:8010";

const mapFunc = ({name, value, type, recursiveValue}) => {return {name, value, type, recursiveValue}};

async function recursiveResolveVariables(variables, depth) { 
  if (depth > 20) {
    return;
  }
  await Promise.all(variables.map(async (element) => {
    if (element.variablesReference !== 0) {
      const result = await vscode.debug.activeDebugSession?.customRequest(
        "variables",
        { variablesReference: element.variablesReference });
      console.log("result", result, "element", element);
      if (element.name !== "special variables") {
        await recursiveResolveVariables(result["variables"], depth + 1);
      }
      const recursiveValue = result["variables"].filter((variable) => variable.name !== "special variables").map(mapFunc);
      if (recursiveValue.length > 0) {
        element.recursiveValue = recursiveValue;
      }
    }
  }));
  return;
};

async function getDebugState() {
  const thread_result = await vscode.debug.activeDebugSession?.customRequest("threads", {});
  const stack_traces = await vscode.debug.activeDebugSession?.customRequest(
    "stackTrace",
    { threadId: thread_result.threads[0].id, startFrame: 0, levels: 200 }
  );
  const stackFrameNames = stack_traces.stackFrames.map((stack_trace: any) => stack_trace.name);
  const current_stack_trace = stack_traces.stackFrames[0];
  let lineContent = "Unknown line content";
  if (vscode.window.activeTextEditor.document.fileName === current_stack_trace.source.path) {
    lineContent = vscode.window.activeTextEditor.document.lineAt(current_stack_trace.line - 1).text;
  }

  const scopes = await vscode.debug.activeDebugSession?.customRequest(
    "scopes",
    { frameId: current_stack_trace.id }
  );

  const locals = await vscode.debug.activeDebugSession?.customRequest(
    "variables",
    { variablesReference: scopes.scopes[0].variablesReference }
  );
  await recursiveResolveVariables(locals["variables"], 0);
  const strippedLocals = locals["variables"].filter((variable) => variable.name !== "special variables").map(mapFunc);
  const globals = await vscode.debug.activeDebugSession?.customRequest(
    "variables",
    { variablesReference: scopes.scopes[1].variablesReference }
  );
  await recursiveResolveVariables(globals["variables"], 0);
  const strippedGlobals = globals["variables"].map(mapFunc);
  return {
    localVariables: strippedLocals,
    globalVariables: strippedGlobals,
    stackFrameNames: stackFrameNames,
    currentLine: lineContent
  };
}
export function activate(context: vscode.ExtensionContext) {
  console.log("Your Debugging Extension is now active!");

  const collection = vscode.languages.createDiagnosticCollection(
    "debuggingDiagnostics"
  );

  let updateDiagnosticsCommand = vscode.commands.registerCommand(
    "perplexity-debugging.findProblems",
    async () => {
      if (vscode.window.activeTextEditor) {
        const userContext = await vscode.window.showInputBox({title: "Enter the context of the code snippet", placeHolder: "This is a fizz-buzz implementation", prompt: "Please enter the context of the code snippet"});
        if (!userContext) {
          vscode.window.showErrorMessage("Please enter a context for the code snippet or leave empty!");
          return;
        }
        let debugInformation = {};
        if (vscode.debug.activeDebugSession) {
          const positiveChoice = "Use debug session context";
          const negativeChoice = "Do not use debug session context";
          const choice = await vscode.window.showQuickPick([positiveChoice, negativeChoice], { title: "Choose the context of the code snippet" });
          if (choice === positiveChoice) {
            debugInformation = await getDebugState();
            console.log(`Debug information: ${JSON.stringify(debugInformation, null, 2)}`);
          }
        }
        vscode.window.withProgress({
          location: vscode.ProgressLocation.Notification,
          cancellable: false,
          title: 'Finding problems',
        },
          async (progress) => {
            await findProblems(vscode.window.activeTextEditor.document, collection, userContext, debugInformation, progress);
          });
      }
    }
  );

  context.subscriptions.push(updateDiagnosticsCommand);
  context.subscriptions.push(collection);
}

async function findProblems(
  document: vscode.TextDocument,
  collection: vscode.DiagnosticCollection,
  userContext: string,
  debugInformation: any,
  progress: vscode.Progress<{ message?: string; increment?: number }>
): Promise<void> {
  if (document) {
    const documentText = document.getText();
    const languageId = document.languageId;
    console.log("languageId", languageId);
    try {
      progress.report({ message: "Fetching analysis from the API..." });
      const response = await fetch(apiUrl + "/highlight-code/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: documentText, language: languageId, context: userContext, debugState: `${JSON.stringify(debugInformation, null, 2)}` }),
      });
      console.log("response", response);

      if (!response.ok) {
        throw new Error("Failed to fetch analysis from the API");
      }

      console.log("text", documentText);
      const responseData = await response.json();
      console.log("responseData", responseData);

      const warnings = [];
      progress.report({ message: "Generating code items" });

      for (let i = 0; i < responseData.length; i++) {
        // -1 because the line numbers are 1-indexed
        const lineNumber = responseData[i].line_number - 1;
        const line = document.lineAt(lineNumber);

        const warning = {
          code: responseData[i].problematic_line_of_code,
          message: responseData[i].description,
          range: new vscode.Range(
            new vscode.Position(lineNumber, line.firstNonWhitespaceCharacterIndex),
            line.range.end
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
      progress.report({ message: "Fetching failed!" });
      vscode.window.showErrorMessage("Failed to fetch analysis from the API");
    }
  } else {
    collection.clear();
  }
}

export function deactivate() {
  console.log('Your extension "perplexity-debugging" is now deactivated!');
}
