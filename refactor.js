const fs = require('fs');
const path = require('path');

const files = [
  "app/(dashboard)/teacher/page.tsx",
  "app/(dashboard)/students/page.tsx",
  "app/(dashboard)/student/page.tsx",
  "app/(dashboard)/reports/page.tsx",
  "app/(dashboard)/classes/[classCode]/student/page.tsx",
  "app/(dashboard)/classes/[classCode]/page.tsx",
  "app/(dashboard)/assignments/[id]/edit/page.tsx",
  "app/(dashboard)/assignments/page.tsx",
  "app/(dashboard)/assignments/submit/page.tsx",
  "app/(dashboard)/assignments/create/page.tsx"
];

for (const relPath of files) {
  const fullPath = path.join(__dirname, relPath);
  if (!fs.existsSync(fullPath)) {
    console.log(`Skipping missing file: ${relPath}`);
    continue;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  if (!content.includes("'use client'") && !content.includes('"use client"')) {
    console.log(`Skipping (already refactored or no use client): ${relPath}`);
    continue;
  }

  // Parse the function signature
  const match = content.match(/(?:export\s+default\s+)(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/);
  if (!match) {
    console.log(`Could not find export default function in ${relPath}`);
    continue;
  }

  const funcName = match[1];
  const paramsStr = match[2];
  const isAsync = content.includes(`export default async function`);
  const clientFuncName = funcName + 'Client';

  // Determine client component filename based on the parent folder
  const parentDir = path.dirname(fullPath);
  let folderName = path.basename(parentDir);
  if (folderName.startsWith('[')) {
      folderName = folderName.replace(/\[|\]/g, ''); // [id] -> id
  }
  const clientFileName = `${folderName}-client.tsx`;
  const componentsDir = path.join(parentDir, '_components');

  if (!fs.existsSync(componentsDir)) {
    fs.mkdirSync(componentsDir);
  }

  // Prepare client component content
  let clientContent = content;
  // Replace export default function FuncName with export function FuncNameClient
  clientContent = clientContent.replace(match[0], `export function ${clientFuncName}(${paramsStr})`);

  fs.writeFileSync(path.join(componentsDir, clientFileName), clientContent, 'utf8');

  // Prepare new server component content
  let serverContent = `import { ${clientFuncName} } from './_components/${clientFileName.replace('.tsx', '')}'\n`;
  
  // If there are types imported like PageProps in student/page.tsx, we should extract them.
  // Actually, we can just let TypeScript complain or we can copy all imports?
  // It's safer to just recreate the signature. If it has PageProps, we can just use `any` or recreate it.
  let serverSignatureParams = paramsStr;
  if (paramsStr.includes('PageProps')) {
      serverContent += `\ninterface PageProps { params: any }\n`;
  } else if (paramsStr && !paramsStr.includes(':')) {
      // just pass it
  }

  serverContent += `\nexport default ${isAsync ? 'async ' : ''}function ${funcName}(${serverSignatureParams}) {\n`;
  
  // Pass args
  const argMatch = paramsStr.match(/{\s*(\w+)\s*}/);
  if (argMatch) {
      serverContent += `  return <${clientFuncName} ${argMatch[1]}={${argMatch[1]}} />\n`;
  } else if (paramsStr.trim()) {
      serverContent += `  return <${clientFuncName} ${paramsStr.split(':')[0].trim()}={${paramsStr.split(':')[0].trim()}} />\n`;
  } else {
      serverContent += `  return <${clientFuncName} />\n`;
  }
  serverContent += `}\n`;

  fs.writeFileSync(fullPath, serverContent, 'utf8');
  console.log(`Refactored: ${relPath}`);
}
