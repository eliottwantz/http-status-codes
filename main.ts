import { ensureDir } from "@std/fs";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";

type CodeInput = {
  code: number;
  phrase: string;
  constant: string;
  comment: {
    doc: string;
    description: string;
  };
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const CODES_PATH = path.join(__dirname, "codes.jsonc");
const TS_CODES_PATH = path.join(__dirname, "dist", "codes.ts");
const TS_PHRASES_PATH = path.join(__dirname, "dist", "phrases.ts");

async function downloadJsonCodes(): Promise<void> {
  const response = await fetch(
    "https://raw.githubusercontent.com/prettymuchbryce/http-status-codes/refs/heads/master/codes.json"
  );
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  let codesContent = `// File downloaded from https://raw.githubusercontent.com/prettymuchbryce/http-status-codes/refs/heads/master/codes.json at ${new Date().toISOString()}\n\n`;
  codesContent += JSON.stringify(data, null, 2);
  await Deno.writeTextFile(CODES_PATH, codesContent);
}

async function readCodesJsonFile(): Promise<CodeInput[]> {
  const codesData = await Deno.readTextFile(CODES_PATH);
  const start = codesData.indexOf("\n") + 1;
  const codes = JSON.parse(codesData.slice(start));
  return codes;
}

async function generateStatusCodes() {
  const codes = await downloadJsonCodes().then(readCodesJsonFile);

  await ensureDir("./dist");

  let codesTsContent = `// Generated from https://raw.githubusercontent.com/prettymuchbryce/http-status-codes/refs/heads/master/codes.json at ${new Date().toISOString()}. Do not edit!\n\n`;
  let phrasesTsContent = `// Generated from https://raw.githubusercontent.com/prettymuchbryce/http-status-codes/refs/heads/master/codes.json at ${new Date().toISOString()}. Do not edit!\n\n`;

  // Generate individual exports
  for (const code of codes) {
    const jsDoc = `/**
 * ${code.comment.doc}
 *
 * ${code.comment.description}
 *
 */
`;
    codesTsContent += jsDoc;
    phrasesTsContent += jsDoc;
    codesTsContent += `export const ${code.constant} = ${code.code} as const;\n\n`;
    phrasesTsContent += `export const ${code.constant} = "${code.phrase}" as const;\n\n`;
  }

  await Deno.writeTextFile(TS_CODES_PATH, codesTsContent);
  await Deno.writeTextFile(TS_PHRASES_PATH, phrasesTsContent);

  console.log(`TypeScript file ${TS_PHRASES_PATH} has been generated.`);
}

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  generateStatusCodes().catch(console.error);
}
