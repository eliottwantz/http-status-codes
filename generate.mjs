import fs from "node:fs/promises";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CODES_PATH = path.join(__dirname, "codes.jsonc");
const TS_FILE_PATH = path.join(__dirname, "index.ts");

async function downloadJsonCodes() {
  const response = await fetch(
    "https://raw.githubusercontent.com/prettymuchbryce/http-status-codes/refs/heads/master/codes.json"
  );
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  let codesContent = `// File downloaded from https://raw.githubusercontent.com/prettymuchbryce/http-status-codes/refs/heads/master/codes.json at ${new Date().toISOString()}\n\n`;
  codesContent += JSON.stringify(data, null, 2);
  await fs.writeFile(CODES_PATH, codesContent, "utf-8");
}

async function readCodesJsonFile() {
  const codesData = await fs.readFile(CODES_PATH, "utf-8");
  const start = codesData.indexOf("\n") + 1;
  const codes = JSON.parse(codesData.slice(start));
  return codes;
}

async function generateStatusCodes() {
  const codes = await downloadJsonCodes().then(readCodesJsonFile);

  let tsContent = `// Generated from from https://raw.githubusercontent.com/prettymuchbryce/http-status-codes/refs/heads/master/codes.json at ${new Date().toISOString()}. Do not edit!\n\n`;

  // Generate individual exports
  for (const code of codes) {
    tsContent += `/**\n`;
    tsContent += ` * ${code.comment.doc}\n`;
    tsContent += ` *\n`;
    tsContent += ` * ${code.comment.description}\n`;
    tsContent += ` *\n`;
    tsContent += ` */\n`;
    tsContent += `export const ${code.constant} = {\n`;
    tsContent += `  code: ${code.code} as const,\n`;
    tsContent += `  phrase: "${code.phrase}" as const,\n`;
    tsContent += `  constant: "${code.constant}" as const,\n`;
    tsContent += `} as const;\n\n`;
  }

  // Generate HTTP_STATUS_CODES object
  tsContent += "// HTTP Status Codes\n\n";
  tsContent += "export const HTTP_STATUS_CODES = {\n";
  for (const code of codes) {
    tsContent += `  ${code.constant},\n`;
  }
  tsContent += "} as const;\n\n";

  // Add type declarations
  tsContent += `export type StatusCode = typeof HTTP_STATUS_CODES;\n`;
  tsContent += `export type StatusCodeKey = keyof StatusCode;\n`;

  await fs.writeFile(TS_FILE_PATH, tsContent);

  console.log("TypeScript file 'http-status-codes.ts' has been generated.");
}

generateStatusCodes().catch(console.error);
