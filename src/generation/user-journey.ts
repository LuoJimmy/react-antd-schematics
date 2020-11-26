import * as vscode from 'vscode';
import * as fs from 'fs';

import { extensionName } from '../defaults';
import { Output } from '../utils';
import { Workspace } from '../workspace';
import { CliCommand } from './cli-command';
import { CliCommandOptions } from './cli-options';
import { shortcutsConfirmationChoices, SHORTCUTS_CONFIRMATION_LABEL } from '../shortcuts';
import { PageProperties, ComponentProperties, PropertiesOptions } from '../schematics/config';

export class UserJourney {

    private workspaceFolder!: vscode.WorkspaceFolder;
    private cliCommand!: CliCommand;
    private schematicName!: string;
    private moreOptions!: PropertiesOptions[]; // 额外的参数

    async start (schematicName: string, contextUri?: vscode.Uri): Promise<void> {

        this.schematicName = schematicName;

        let workspaceFolder: vscode.WorkspaceFolder | undefined;
        /* Get workspace folder configuration */
        workspaceFolder = await Workspace.askFolder(contextUri);
        if (!workspaceFolder) {
            Output.logInfo(`You have canceled the workspace folder choice.`);
            return;
        }
        this.workspaceFolder = workspaceFolder;
        Output.logInfo(`Workspace folder selected: "${workspaceFolder.name}"`);

        this.cliCommand = new CliCommand(workspaceFolder, schematicName, contextUri?.path);

        const nameAsFirstArg = await this.askNameAsFirstArg();
        if (!nameAsFirstArg || nameAsFirstArg === this.cliCommand.getOptionValue('path')) {
            Output.logInfo(`You have canceled the default argument input.`);
            return;
        }
        this.cliCommand.setNameAsFirstArg(nameAsFirstArg);
 
        if(schematicName === 'page' || schematicName === 'component') {
            if(schematicName === 'page') {
                this.moreOptions = PageProperties;
            } else if(schematicName === 'component') {
                this.moreOptions = ComponentProperties;
            }
            let shortcutConfirm: boolean | undefined = false;

            /* Ask direct confirmation or adding more options or cancel */
            shortcutConfirm = await this.askShortcutConfirmation();

            /* "Cancel" choice */
            if (shortcutConfirm === undefined) {
                Output.logInfo(`You have canceled the generation.`);
                return;
            }

            /* Ask for advanced options if user didn't choose a direct confirmation */
            if (!shortcutConfirm) {

                const filledOptions = await this.askOptions();

                this.cliCommand.addOptions(filledOptions);

                /* Ask final confirmation */
                const confirm = await this.askConfirmation();

                /* "Cancel" choice */
                if (!confirm) {
                    Output.logInfo(`You have canceled the generation.`);
                    return;
                }

            }
        }

        this.cliCommand.launchCommand();

        try {

            /* Show progress to the user */
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `${extensionName}: launching the generation, please wait...`,
            }, () => this.jumpToFile(`${workspaceFolder?.uri}/nameAsFirstArg/index.tsx`));

        } catch {

            /* Auto-opening the file was not possible, warn the user the command is launched
             * and propose to refresh Explorer to see the generated files */
            this.showUnknownStatus();
        }

    }

    private async askNameAsFirstArg(): Promise<string | undefined> {

        let prompt = `Input the ${this.cliCommand.hasOption('path') ?  `${this.schematicName} name` : `path with ${this.schematicName} name(eg: src/routers/some-${this.schematicName})`}.`;
        let contextPath = this.cliCommand.getOptionValue('path') as string;

        /* Pro-tip to educate users that it is easier to launch the command from a right-click in Explorer */
        if (this.cliCommand.hasOption('path')) {
            contextPath = `${contextPath}/`
            prompt = `${prompt} Pro-tip: the path can be inferred if you right-click on the directory where you want to generate.`;
        }

        const nameInput = await vscode.window.showInputBox({
            prompt,
            /* If existing, prefill the input with the rgiht-clicked directory */
            value: contextPath,
            /* Position the cursor to the end of the prefilled value, so the user can type directly after */
            valueSelection: [contextPath.length, contextPath.length],
            ignoreFocusOut: true,
        });

        return nameInput;

    }

    private async askShortcutConfirmation(): Promise<boolean | undefined> {

        const choice = await vscode.window.showQuickPick(shortcutsConfirmationChoices, {
            placeHolder: this.cliCommand.getCommand(),
            ignoreFocusOut: true,
        });

        if (choice?.label === SHORTCUTS_CONFIRMATION_LABEL.YES) {
            return true;
        } else if (choice?.label === SHORTCUTS_CONFIRMATION_LABEL.MORE_OPTIONS) {
            return false;
        }
        return undefined;

    }

    private async askOptions(): Promise<CliCommandOptions> {

        const selectedOptionsNames = await this.askOptionsNames();

        if (selectedOptionsNames) {

            return await this.askOptionsValues(selectedOptionsNames);

        }

        return new Map();

    }

    private async askOptionsNames(): Promise<string[]> {

        const optionsChoices: vscode.QuickPickItem[] = this.moreOptions || [];

        if (optionsChoices.length === 0) {
            return [];
        }
        
        const selectedOptions = await vscode.window.showQuickPick(optionsChoices, {
            canPickMany: true,
            placeHolder: `Do you need some options? (if not, just press Enter to skip this step)`,
            ignoreFocusOut: true,
        }) || [];

        return selectedOptions.map((selectedOption) => selectedOption.label);

    }

    private async askOptionsValues(optionsNames: string[]): Promise<CliCommandOptions> {
        let filledOptions = new Map();
        for(let i = 0, len = optionsNames.length; i < len; i++) {
            const optionName = optionsNames[i];
            const currentProper = (this.moreOptions || []).find(item => item.label === optionName);
            const prompt = currentProper?.description ?? 'What value do you want for this option?';
            const properType = currentProper?.type;
            if(properType === 'boolean') {
                filledOptions.set(optionName, true);
            } else if(properType === 'text') {
                let choice  = await this.askOptionText(optionName, prompt);
                if (choice) {
                    filledOptions.set(optionName, choice);
                }
            }
        }
        return filledOptions;
    }

    private async askOptionText(optionName: string, prompt: string): Promise<string | undefined> {

        return vscode.window.showInputBox({
            prompt: `--${optionName}: ${prompt}`,
            ignoreFocusOut: true,
        });

    }


    private async askConfirmation(): Promise<boolean> {

        const confirmationLabel = `$(check) Confirm`;

        const confirmationChoices: vscode.QuickPickItem[] = [{
            label: confirmationLabel,
            description: `Pro-tip: take a minute to check the command above is really what you want`,
        }, {
            label: `$(close) Cancel`,
        }];

        const choice = await vscode.window.showQuickPick(confirmationChoices, {
            placeHolder: this.cliCommand.getCommand(),
            ignoreFocusOut: true,
        });

        return (choice?.label === confirmationLabel) ? true : false;

    }

    /**
     * Automatically open the generated file
     */
    private async jumpToFile(possibleFsPath: string, counter = 0): Promise<void> {

        /* If we don't know the generated file path, we can't know if the command succeeded or not,
         * as we can't react on Terminal output */
        if (possibleFsPath === '') {

            throw new Error();

        }
        try {

            /* Check if the file exists (`F_OK`) and is readable (`R_OK`) */
            await fs.promises.access(possibleFsPath, fs.constants.F_OK | fs.constants.R_OK);

        } catch (error) {

            if (counter < 10) {

                counter += 1;
    
                await new Promise((resolve, reject) => {
                    setTimeout(() => {
                        this.jumpToFile(possibleFsPath, counter).then(() => {
                            resolve();
                        }).catch(() => {
                            reject();
                        });
                    }, 500);
                });
    
            } else {

                throw new Error();
                
            }
            
            return;

        }
       
        const document = await vscode.workspace.openTextDocument(possibleFsPath);

        await vscode.window.showTextDocument(document);

        Output.logInfo(`Command has succeeded! Check the Terminal for more details.`);

        return;

    }

    /**
     * Show an information message when we cannot detect the generated file
     */
    private async showUnknownStatus(): Promise<void> {

        const refreshLabel = `Refresh Explorer`;

        Output.logInfo(`Command launched.`);

        const action = await vscode.window.showInformationMessage(
            `Command launched, check the Terminal to know its status. You may need to refresh the Explorer to see the generated file(s).`,
            `Refresh Explorer`,
        );
        
        if (action === refreshLabel) {
            /* Refresh Explorer, otherwise you may not see the generated files */
            vscode.commands.executeCommand('workbench.files.action.refreshFilesExplorer');
        }

    }
}