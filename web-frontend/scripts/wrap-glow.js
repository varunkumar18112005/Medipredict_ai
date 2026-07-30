const fs = require('fs');

const path = 'c:/Users/deepa/Downloads/pdd/pdd/web-frontend/src/app/dashboard/page.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('import BorderGlow')) {
  content = content.replace(
    'import React, { useEffect, useState } from "react";',
    'import React, { useEffect, useState } from "react";\nimport BorderGlow from "../../components/BorderGlow";'
  );
}

function wrapClassWithComponent(html, targetClass, componentOpen, componentClose) {
  let result = '';
  let i = 0;
  
  while (i < html.length) {
    const classIndex = html.indexOf(`className="${targetClass}`, i);
    if (classIndex === -1) {
      const classIndex2 = html.indexOf(`className=\\"${targetClass}`, i);
      if (classIndex2 === -1) {
        result += html.slice(i);
        break;
      }
    }
    
    // find index
    const actualClassIndex = html.indexOf(`className="${targetClass}`, i) !== -1 ? html.indexOf(`className="${targetClass}`, i) : html.indexOf(`className=\\"${targetClass}`, i);

    // Find the opening tag before the classIndex
    let tagOpenIndex = html.lastIndexOf('<', actualClassIndex);
    
    // Find what tag it is
    let tagSpace = html.indexOf(' ', tagOpenIndex);
    let tagName = html.slice(tagOpenIndex + 1, tagSpace);
    
    // Find the end of the opening tag
    let tagEndIndex = html.indexOf('>', actualClassIndex);
    
    // We need to parse until the matching </tagName>
    let depth = 1;
    let j = tagEndIndex + 1;
    while (j < html.length && depth > 0) {
      if (html.startsWith(`<${tagName} `, j) || html.startsWith(`<${tagName}>`, j)) depth++;
      else if (html.startsWith(`</${tagName}>`, j)) depth--;
      j++;
    }
    
    // j is now the character after the > of the closing </tagName>
    let closingTagEnd = html.indexOf('>', j - 1) + 1;
    
    // Now we replace this block
    const beforeDiv = html.slice(i, tagOpenIndex);
    const divBlock = html.slice(tagOpenIndex, closingTagEnd);
    
    result += beforeDiv + componentOpen + divBlock + componentClose;
    i = closingTagEnd;
  }
  return result;
}

// 1. Wrap db-cards
let newContent = wrapClassWithComponent(
  content,
  'db-card',
  '<BorderGlow borderRadius={16} glowIntensity={0.25} className="w-full h-full">',
  '</BorderGlow>'
);

// 2. Wrap welcome-gradient-banner
newContent = wrapClassWithComponent(
  newContent,
  'welcome-gradient-banner',
  '<BorderGlow borderRadius={20} glowIntensity={0.3} className="w-full">',
  '</BorderGlow>'
);

// 3. Wrap action-btn-card (Quick Controls buttons)
newContent = wrapClassWithComponent(
  newContent,
  'action-btn-card',
  '<BorderGlow borderRadius={12} glowIntensity={0.2} className="w-full h-full">',
  '</BorderGlow>'
);

fs.writeFileSync(path, newContent, 'utf8');
console.log('Successfully wrapped db-card, welcome banner, and action buttons!');
