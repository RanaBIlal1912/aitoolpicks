// Reads an exported array literal (for example `export const NEWS: NewsItem[] = [...]`) out of a TypeScript data file without importing the
// site's code: the file is parsed, the initializer is cut out, its types are stripped, and it is evaluated on its own. Only plain data
// (object literals, strings, numbers, arrays and references to the names in `scope`) can be read this way; anything else throws.
import fs from "node:fs";
import ts from "typescript";

export function readExportedArray(file: string, name: string, scope: Record<string, unknown> = {}): unknown[] {
  const text = fs.readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  let init: ts.Expression | undefined;
  for (const st of sf.statements) {
    if (!ts.isVariableStatement(st) || !st.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) continue;
    for (const d of st.declarationList.declarations) if (ts.isIdentifier(d.name) && d.name.text === name) init = d.initializer;
  }
  if (!init) throw new Error(`${file}: no exported constant named ${name}`);
  const js = ts.transpileModule(`const __value = ${init.getText(sf)};`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  const names = Object.keys(scope);
  const value = new Function(...names, `"use strict";\n${js}\nreturn __value;`)(...names.map((n) => scope[n]));
  if (!Array.isArray(value)) throw new Error(`${file}: ${name} is not an array`);
  return value;
}
