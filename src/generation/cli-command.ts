import * as vscode from 'vscode';
import * as path from 'path';
import { CliCommandOptions, formatCliCommandOptions } from './cli-options';
import { Output, Terminal } from '../utils';

interface ContextPath {
    /** Eg. `/Users/Jimmy/react-project/src/routers/some-module` */
    full: string;
    /** Eg. `src/routers/some-module` */
    relativeToWorkspaceFolder: string;
    /** Eg. `some-module` */
    relativeToProjectFolder: string;
}

export class CliCommand {
     /* Path details of the right-clicked file or directory */
     private contextPath: ContextPath = {
        full: '',
        relativeToWorkspaceFolder: '',
        relativeToProjectFolder: '',
    };
    private baseCommand = 'antd g';
    private projectName = '';
    private schematicName = ''; // module | page
    private nameAsFirstArg = '';
    private options: CliCommandOptions = new Map();

    constructor(
        private workspaceFolder: vscode.WorkspaceFolder,
        schematicName: string,
        contextPath?: string,
    ) {
        this.schematicName = schematicName;
        this.setContextPathAndProject(contextPath);
        if(this.contextPath.relativeToWorkspaceFolder) {
            this.addOptions([['path', this.contextPath.relativeToWorkspaceFolder]])
        }
    }

    /**
     * Get the full generation command, in the shortest form possible.
     */
    getCommand(): string {

        return [
            this.baseCommand,
            this.schematicName,
            this.getRouteFromFirstArg(),
            formatCliCommandOptions(this.options),
        ].join(' ').trim();

    }

    /**
     * Get route name from module's path
     */
    getRouteFromFirstArg(): string {
        return path.posix.basename(this.nameAsFirstArg);
    }

    /**
     * Set name as first argument of the command line, eg. `path/to/some-component`
     */
    setNameAsFirstArg(pathToName: string): void {

        this.nameAsFirstArg = pathToName;

    }

    /**
     * Add options
     */
    addOptions(options: CliCommandOptions | [string, string | string[]][]): void {

        for (const [name, option] of options) {
       
            this.options.set(name, option);

        }

    }

    getOptionValue(name: string): string | string[] | undefined {
        return this.options.get(name);
    }

    /**
     * Tells if an option exists in the command.
     */
    hasOption(name: string): boolean {
        return this.options.has(name);
    }

    /**
     * Launch command in a terminal
     */
    launchCommand({ dryRun = false } = {}): void {

        Output.logInfo(`Launching this command: ${this.getCommand()}`);

        const command = `${this.getCommand()}`;

        Terminal.send(this.workspaceFolder, command);
    
    }

    /**
     * Set context path and prject.
     */
    private setContextPathAndProject(contextPath?: string): void {

        if (!contextPath) {
            Output.logInfo(`No context path detected.`);
            return;
        }

        this.contextPath.full = contextPath;

        Output.logInfo(`Full context path detected: ${this.contextPath.full}`);

        /* Remove workspace folder path from full path,
         * eg. `/Users/Jimmy/react-project/src/routers/some-module` => `src/routers/some-module` */
        this.contextPath.relativeToWorkspaceFolder = this.contextPath.full.substr(this.workspaceFolder.uri.path.length + 1);

        Output.logInfo(`Workspace folder-relative context path detected: ${this.contextPath.relativeToWorkspaceFolder}`);

        if (this.projectName) {
            Output.logInfo(`Source-relative context path detected: ${this.contextPath.relativeToProjectFolder}`);
            Output.logInfo(`React antd project detected from context path: "${this.projectName}"`);
        } else {
            Output.logInfo(`No React antd project detected from context path.`);
        }

    }
}