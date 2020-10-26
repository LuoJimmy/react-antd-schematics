import * as vscode from 'vscode';
import { Output } from '../utils';

export class Workspace {

    /**
     * Get a workspace folder based on a file system path, or `undefined`.
     */
    static getFolderFromPath(contextFsPath: string): vscode.WorkspaceFolder | undefined {
        
        const contextPathUri = vscode.Uri.file(contextFsPath);

        return vscode.workspace.getWorkspaceFolder(contextPathUri);

    }

    /**
     * Try to resolve the current workspace folder, or ask the user for it.
     * @param contextUri URI of any file in the current workspace folder
     */
    static async askFolder(contextUri?: vscode.Uri): Promise<vscode.WorkspaceFolder | undefined> {

        let folder: vscode.WorkspaceFolder | undefined;

        if (contextUri) {

            Output.logInfo(`Context path detected: resolving current workspace folder from it.`);

            /* 1. If there is a context URI, current workspace folder can be resolved from it */
            folder = vscode.workspace.getWorkspaceFolder(contextUri);

        }

        if (!folder) {
        
            if (vscode.workspace.workspaceFolders?.length === 1) {

                Output.logInfo(`There is only one workspace folder opened, default to it.`);

                /* 2. If there is just one workspace folder, take it directly */
                folder = vscode.workspace.workspaceFolders[0];

            } else {

                folder = (await vscode.window.showWorkspaceFolderPick())

            }

        }

        /* User canceled */
        if (!folder) {
            return undefined;
        }

        return folder;

    }

}
