import './wasm_exec.js';
import vscode = require('vscode');
import path = require('path');

declare const Go: new () => {
	importObject: WebAssembly.Imports;
	run: (instance: WebAssembly.Instance) => Promise<void>;
};

const go = new Go();

export async function loadWASM(ctx: vscode.ExtensionContext) {
	const { extensionPath } = ctx;
	// TODO:- fix this hack, out is .vscodeignore'd
	const { instance } = await WebAssembly.instantiateStreaming(
		fetch(path.join(extensionPath, 'out', 'gopls.wasm'), go.importObject)
	);
	await go.run(instance);
}
