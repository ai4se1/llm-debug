# LLM Debug Extension

This is a VS-Code extension, we created in the lecture AI in software engineering. It uses LLMs to help the user debug a program.

## WARNING

This extension is only a prototype and not meant for production use. It will send the contents of your files unencrypted over the network!

## Installation

You can download the bundled `.vsix` file and install it in VS Code. We tested the extension with version `1.90.0-1` of VS Code.

To Download the latest extension, look in the artifacts of the latest successful run of the build pipeline [here](https://github.com/ai4se1/llm-debug/actions/workflows/build.yml). The artifacts are on the bottom of the page, after clicking on a run.

To install an extension from an vsix file, follow the steps below:

1. Navigate to the extensions settings on the left navigation bar.
2. On the top right in the extension view, there are three horizontal dots. Click on them and select `Instal from VSIX...` in the context menu that opens up.
3. Select the vsix file in the file browser.

You can verify that the extension is working by pressing `ctrl+shift+p` and typing find problems. If there is an action with this name, the installation is successful.

After installing the extension, you need a running instance of the AI-backend. Follow the setup steps in [this repository](https://github.com/ai4se1/ai-backend). You might have to change the API URL and the port in the settings of the extension.

## Usage

The find problems action is the only action of our extension. You can start it by pressing `ctrl+shift+p` and entering `find problems`. The extension generates annotations for the current file. After starting the find problems action, the extension will prompt you for additional context and ask you if you want to use the current debugger state. If you want to use the debugger state, a debugger has to be open. Follow this guide to set up a python debugger: [https://code.visualstudio.com/docs/python/debugging](https://code.visualstudio.com/docs/python/debugging)

## Developing this extension

If you want to develop this extension, follow the setup in this guide: [https://code.visualstudio.com/api/get-started/your-first-extension](https://code.visualstudio.com/api/get-started/your-first-extension)
