import fs from "node:fs/promises";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function getCodeJsonFile() {
  const response = await fetch(
    "https://raw.githubusercontent.com/prettymuchbryce/http-status-codes/refs/heads/master/codes.json"
  );
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  return data;
}
async function generateStatusCodes() {
  try {
    const codes = await getCodeJsonFile();

    let tsContent = "export const HTTP_STATUS_CODES = {\n";

    for (const code of codes) {
      tsContent += `  /**\n`;
      tsContent += `   * ${code.comment.doc}\n`;
      tsContent += `   *\n`;
      tsContent += `   * ${code.comment.description}\n`;
      tsContent += `   *\n`;
      tsContent += `   */\n`;
      tsContent += `  ${code.constant}: {\n`;
      tsContent += `    code: ${code.code} as const,\n`;
      tsContent += `    phrase: "${code.phrase}" as const,\n`;
      tsContent += `    constant: "${code.constant}" as const,\n`;
      tsContent += `  },\n\n`;
    }

    tsContent += "} as const;\n";

    const outputPath = path.join(__dirname, "http-status-codes.ts");
    await fs.writeFile(outputPath, tsContent);

    console.log("TypeScript file 'http-status-codes.ts' has been generated.");
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

// generateStatusCodes();
