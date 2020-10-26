// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { UserJourney } from './generation/user-journey';
import { Output } from './utils/output';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "reactantdschematics" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	context.subscriptions.push(
        vscode.commands.registerCommand('reactantdschematics.generateModule', (contextUri?: vscode.Uri) => {
            // The code you place here will be executed every time your command is executed

            Output.logInfo(contextUri?.toString() || '');
            (new UserJourney()).start('module', contextUri);
    
            // Display a message box to the user
            vscode.window.showInformationMessage('generate module from React Antd Schematics!');
        }),
        vscode.commands.registerCommand('reactantdschematics.generatePage', (contextUri?: vscode.Uri) => {
            // The code you place here will be executed every time your command is executed
            
            (new UserJourney()).start('page', contextUri);

            // Display a message box to the user
            vscode.window.showInformationMessage('generate page from React Antd Schematics!');
        }),
    );
}

// this method is called when your extension is deactivated
export function deactivate() {}
