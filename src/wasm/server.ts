/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable @typescript-eslint/no-namespace */
import './wasm_exec.js';
import path = require('path');
import fs = require('fs');

// lib.dom.d.ts
type BufferSource = ArrayBufferView | ArrayBuffer;
interface Module {}
declare namespace WebAssembly {
	interface Instance {
		readonly exports: Exports;
	}
	type ExportValue = Function; // | Global | Memory | Table;
	type Exports = Record<string, ExportValue>;
	type ImportValue = ExportValue | number;
	type ModuleImports = Record<string, ImportValue>;
	type Imports = Record<string, ModuleImports>;
	function compile(bytes: BufferSource): Promise<Module>;
	function instantiate(moduleObject: Module, importObject?: Imports): Promise<Instance>;
}
declare const Go: new () => {
	importObject: WebAssembly.Imports;
	run: (instance: WebAssembly.Instance) => Promise<void>;
};

export async function loadWASM(extensionPath: string) {
	const go = new Go();
	// TODO:- fix this hack, out is .vscodeignore'd
	const wasmPath = path.join(extensionPath, 'out', 'gopls.wasm');
	const wasm = await WebAssembly.compile(fs.readFileSync(wasmPath));
	const instance = await WebAssembly.instantiate(wasm, go.importObject);
	await go.run(instance);
}

(async () => {
	await loadWASM('../..');
})();
