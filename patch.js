const fs = require('fs');
const file = 'node_modules/pdf2docx-wasm/pyodide.asm.js';
let data = fs.readFileSync(file, 'utf8');
if (!data.includes('createRequire')) {
  data = "import { createRequire as _createRequire } from 'module';\nimport { fileURLToPath as _fileURLToPath } from 'url';\nimport { dirname as _dirname } from 'path';\nconst require = _createRequire(import.meta.url);\nconst __dirname = _dirname(_fileURLToPath(import.meta.url));\n" + data;
  fs.writeFileSync(file, data, 'utf8');
  console.log('pyodide.asm.js patched!');
}
const file2 = 'node_modules/pdf2docx-wasm/pyodide.js';
let data2 = fs.readFileSync(file2, 'utf8');
if (!data2.includes('createRequire')) {
  data2 = "import { createRequire as _createRequire } from 'module';\nimport { fileURLToPath as _fileURLToPath } from 'url';\nimport { dirname as _dirname } from 'path';\nconst require = _createRequire(import.meta.url);\nconst __dirname = _dirname(_fileURLToPath(import.meta.url));\n" + data2;
  fs.writeFileSync(file2, data2, 'utf8');
  console.log('pyodide.js patched!');
}
