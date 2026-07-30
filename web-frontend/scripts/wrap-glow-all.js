const fs = require('fs');
const path = require('path');

function getFiles(dir, filesList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const name = dir + '/' + file;
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, filesList);
    } else {
      if (name.endsWith('.tsx') && !name.includes('layout.tsx') && name !== 'c:/Users/deepa/Downloads/pdd/pdd/web-frontend/src/app/dashboard/page.tsx') {
        filesList.push(name);
      }
    }
  }
  return filesList;
}

const targetFiles = getFiles('c:/Users/deepa/Downloads/pdd/pdd/web-frontend/src/app/dashboard');

function wrapClassWithComponent(html, targetClass, componentOpen, componentClose) {
  let result = '';
  let i = 0;
  
  while (i < html.length) {
    const actualClassIndex = html.indexOf(`className="${targetClass}`, i) !== -1 ? html.indexOf(`className="${targetClass}`, i) : html.indexOf(`className=\\"${targetClass}`, i);

    if (actualClassIndex === -1) {
      result += html.slice(i);
      break;
    }

    let tagOpenIndex = html.lastIndexOf('<', actualClassIndex);
    let tagSpace = html.indexOf(' ', tagOpenIndex);
    let tagName = html.slice(tagOpenIndex + 1, tagSpace > tagOpenIndex && tagSpace < actualClassIndex ? tagSpace : actualClassIndex);
    // basic tag parsing
    if (tagName.includes('>')) tagName = tagName.split('>')[0];
    if (tagName.includes('\n')) tagName = tagName.split('\n')[0];
    tagName = tagName.trim();

    let tagEndIndex = html.indexOf('>', actualClassIndex);
    
    let depth = 1;
    let j = tagEndIndex + 1;
    while (j < html.length && depth > 0) {
      if (html.startsWith(`<${tagName} `, j) || html.startsWith(`<${tagName}>`, j) || html.startsWith(`<${tagName}\n`, j)) depth++;
      else if (html.startsWith(`</${tagName}>`, j)) depth--;
      j++;
    }
    
    let closingTagEnd = html.indexOf('>', j - 1) + 1;
    
    const beforeDiv = html.slice(i, tagOpenIndex);
    const divBlock = html.slice(tagOpenIndex, closingTagEnd);
    
    result += beforeDiv + componentOpen + divBlock + componentClose;
    i = closingTagEnd;
  }
  return result;
}

for (const filepath of targetFiles) {
  let content = fs.readFileSync(filepath, 'utf8');
  let originalContent = content;
  
  if (!content.includes('import BorderGlow')) {
    content = content.replace(
      'import React',
      'import React' // anchor
    );
    // Find the last import
    const lastImport = content.lastIndexOf('import ');
    const lastImportEnd = content.indexOf('\n', lastImport) + 1;
    content = content.slice(0, lastImportEnd) + 'import BorderGlow from "@/components/BorderGlow";\n' + content.slice(lastImportEnd);
  }

  content = wrapClassWithComponent(
    content,
    'db-card',
    '<BorderGlow borderRadius={16} glowIntensity={0.25} className="w-full h-full">',
    '</BorderGlow>'
  );

  if (content !== originalContent) {
    // try to fix path to components
    content = content.replace('@/components/BorderGlow', '../../components/BorderGlow');
    fs.writeFileSync(filepath, content, 'utf8');
    console.log('Wrapped file:', filepath);
  }
}
