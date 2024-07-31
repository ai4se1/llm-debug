# LLM Debug Extension

This is a VS-Code extension, we created in the lecture AI in software engineering. It uses LLMs to help the user debug a program.

## WARNING

This extension is only a prototype and not meant for production use. It will send the contents of your files unencrypted over the network!

## Installation

You can download the bundled `.vsix` file and install it in VS Code. We tested the extension with version `1.90.0-1` of VS Code.

To Download the latest extension, look in the artifacts of the latest successful run of the build pipeline [here](https://github.com/ai4se1/llm-debug/actions/workflows/build.yml). The artifacts are on the bottom of the page, after clicking on a run.

To install an extension from an vsix file, follow the steps below:

1. Navigate to the extensions settings on the left navigation bar.
3. On the top right in the extension view, there are three horizontal dots. Click on them and select `Instal from VSIX...` in the context menu that opens up.
4. Select the vsix file in the file browser.

All the steps in a screen shot of VS Code:
![image](https://github.com/user-attachments/assets/e6bc1cf9-0bf0-43e4-8b3a-ceaf2c8321c8)


You can verify that the extension is working by pressing `ctrl+shift+p` and typing find problems. If there is an action with this name, the installation is successful.

After installing the extension, you need a running instance of the AI-backend. Follow the setup steps in [this repository](https://github.com/ai4se1/ai-backend). You might have to change the API URL and the port in the settings of the extension.

## Usage

The find problems action is the only action of our extension. You can start it by pressing `ctrl+shift+p` and entering `find problems`. 
![image](https://github.com/user-attachments/assets/eba4dc4f-10ed-405a-9b78-afbca31d9b00)

The extension generates annotations for the current file. After starting the find problems action, the extension will prompt you for additional context:
![image](https://github.com/user-attachments/assets/1a811169-139d-464d-a8dc-39afd61a1236)

If there is a running debugger session, the extension will ask you, if you want to use the current debugger state:
![image](https://github.com/user-attachments/assets/f03c5f92-776a-4c46-b9f2-ca3db529a1c2)

This is only tested with the python debugger! If you have problems with different debuggers, please open an issue.

To set up a debugger, follow this guide to set up a python debugger: [https://code.visualstudio.com/docs/python/debugging](https://code.visualstudio.com/docs/python/debugging)

After that, the extension sends the context to the backend and waits for a response. There should be a loading animation in the bottom right. Collecting the debuger state might also take some time.

If the extension found some problems, they will be displayed in the problems section and as annotations:

![image](https://github.com/user-attachments/assets/1ea80de8-e22f-40b5-9742-d3fc9cdec0b0)

![image](https://github.com/user-attachments/assets/0acdcb79-df7a-40f8-bea5-14d8dfd4ae6b)

## Developing this extension

If you want to develop this extension, follow the setup in this guide: [https://code.visualstudio.com/api/get-started/your-first-extension](https://code.visualstudio.com/api/get-started/your-first-extension)
