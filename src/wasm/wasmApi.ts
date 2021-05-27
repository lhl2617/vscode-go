import './wasm_exec.js';
import path = require('path');
import fs = require('fs');
import { exit } from 'process';

declare const Go: new () => {
	importObject: WebAssembly.Imports;
	run: (instance: WebAssembly.Instance) => Promise<void>;
};

const go = new Go();

export async function loadWASM(extensionPath: string) {
	// TODO:- fix this hack, out is .vscodeignore'd
	const wasmPath = path.join(extensionPath, 'out', 'gopls.wasm');
	const wasm = await WebAssembly.compile(fs.readFileSync(wasmPath));
	const instance = await WebAssembly.instantiate(wasm, go.importObject);
	await go.run(instance);
}

(async () => {
	try {
		await loadWASM('../..');
	} catch (err) {
		console.error(err);
		exit(1);
	}
})();
