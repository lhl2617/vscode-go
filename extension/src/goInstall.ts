/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------*/

import cp = require('child_process');
import path = require('path');
import vscode = require('vscode');
import { CommandFactory } from './commands';
import { getGoConfig } from './config';
import { toolExecutionEnvironment } from './goEnv';
import { isModSupported } from './goModules';
import { outputChannel } from './goStatus';
import { getBinPath, getCurrentGoPath, getModuleCache } from './util';
import { getEnvPath, getCurrentGoRoot, getCurrentGoWorkspaceFromGOPATH } from './utils/pathUtils';

export const installCurrentPackage: CommandFactory = () => async () => {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showInformationMessage('No editor is active, cannot find current package to install');
		return;
	}
	if (editor.document.languageId !== 'go') {
		vscode.window.showInformationMessage(
			'File in the active editor is not a Go file, cannot find current package to install'
		);
		return;
	}

	const goRuntimePath = getBinPath('go');
	if (!goRuntimePath) {
		vscode.window.showErrorMessage(
			`Failed to run "go install" to install the package as the "go" binary cannot be found in either GOROOT(${getCurrentGoRoot()}) or PATH(${getEnvPath()})`
		);
		return;
	}

	const env = toolExecutionEnvironment();
	const cwd = path.dirname(editor.document.uri.fsPath);
	const isMod = await isModSupported(editor.document.uri);

	// Skip installing if cwd is in the module cache
	const cache = getModuleCache();
	if (isMod && cache && cwd.startsWith(cache)) {
		return;
	}

	const goConfig = getGoConfig();
	const buildFlags = goConfig['buildFlags'] || [];
	const args = ['install', ...buildFlags];

	if (goConfig['buildTags'] && buildFlags.indexOf('-tags') === -1) {
		args.push('-tags', goConfig['buildTags']);
	}

	// Find the right importPath instead of directly using `.`. Fixes https://github.com/Microsoft/vscode-go/issues/846
	const currentGoWorkspace = getCurrentGoWorkspaceFromGOPATH(getCurrentGoPath(), cwd);
	const importPath = currentGoWorkspace && !isMod ? cwd.substr(currentGoWorkspace.length + 1) : '.';
	args.push(importPath);

	outputChannel.info(`Installing ${importPath === '.' ? 'current package' : importPath}`);

	cp.execFile(goRuntimePath, args, { env, cwd }, (err, _, stderr) => {
		if (err) {
			outputChannel.error(`Installation failed: ${stderr}`);
			outputChannel.show();
		} else {
			outputChannel.info('Installation successful');
			vscode.window.showInformationMessage('Installation successful');
		}
	});
};
