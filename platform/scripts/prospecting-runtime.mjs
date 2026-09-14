// Compile only local TypeScript dependencies into an ignored runtime directory.
// No remote code, arbitrary input module names or credentials are written.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, '.tools', 'prospecting-runtime');
export async function loadProspecting() {
  const seen = new Map();
  function compile(file) {
    if (!file.startsWith(root + path.sep)) throw new Error('Module outside project.');
    if (seen.has(file)) return seen.get(file);
    const destination = path.join(output, path.relative(root, file).replace(/\.ts$/, '.mjs'));
    seen.set(file, destination);
    let code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
    code = code.replace(/from\s+['"]([^'"]+)['"]/g, (full, name) => {
      if (!name.startsWith('.') && !name.startsWith('@/')) return full;
      const stem = name.startsWith('@/') ? path.join(root, name.slice(2)) : path.resolve(path.dirname(file), name);
      const source = fs.existsSync(stem + '.ts') ? stem + '.ts' : path.join(stem, 'index.ts');
      return `from '${pathToFileURL(compile(source)).href}'`;
    });
    fs.mkdirSync(path.dirname(destination), { recursive: true }); fs.writeFileSync(destination, code);
    return destination;
  }
  return import(pathToFileURL(compile(path.join(root, 'lib', 'prospecting.ts'))).href);
}
