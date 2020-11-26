import * as vscode from 'vscode';
export interface PropertiesOptions extends vscode.QuickPickItem {
    type: string;
}

export const PageProperties: PropertiesOptions[] = [
  {
    label: 'redirect',
    description: 'as redirect route',
    picked: false,
    type: 'boolean'
  },
  {
    label: 'father',
    description: 'with father route',
    picked: false,
    type: 'text'
  },
]

export const ComponentProperties: PropertiesOptions[] = [
    {
      label: 'folder',
      description: 'component name is folder',
      picked: false,
      type: 'boolean'
    },
  ]
