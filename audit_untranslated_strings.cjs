const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      arrayOfFiles.push(fullPath);
    }
  });
  return arrayOfFiles;
}

const allFiles = getAllFiles(srcDir);
const report = [];

allFiles.forEach(file => {
  const relPath = path.relative(__dirname, file);
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    
    // Ignore imports, comments, console log
    if (line.trim().startsWith('//') || line.trim().startsWith('import') || line.trim().startsWith('*')) return;
    
    // Check JSX text nodes (e.g. >Texte<) that are not only whitespace, numbers or symbols
    const jsxTextMatches = line.match(/>([^<>{}]+)</g);
    if (jsxTextMatches) {
      jsxTextMatches.forEach(match => {
        const text = match.replace(/^>|<$/g, '').trim();
        // If text contains French letters or multi-word French text and no t(...) call
        if (text.length > 2 && /[a-zA-ZàâäéèêëîïôöùûüçÀÂÄÉÈÊËÎÏÔÖÙÛÜÇ]/.test(text) && !/^\d+$/.test(text) && !/^[\s\d\w-_.@\/\\:;(),!?&'"+=*#%€$]+$/.test(text) === false) {
          if (!line.includes('t(') && !line.includes('i18n')) {
            report.push({ file: relPath, line: lineNum, text, lineContent: line.trim() });
          }
        }
      });
    }

    // Check placeholder="...", label="...", title="..." with hardcoded French text
    const attrMatches = line.match(/(placeholder|label|title|alt|description|buttonText)=["']([^"']+)["']/g);
    if (attrMatches) {
      attrMatches.forEach(match => {
        if (!line.includes('t(')) {
          report.push({ file: relPath, line: lineNum, text: match, lineContent: line.trim() });
        }
      });
    }
  });
});

console.log(`Found ${report.length} potential hardcoded string occurrences in TS/TSX files:`);
const byFile = {};
report.forEach(item => {
  byFile[item.file] = byFile[item.file] || [];
  byFile[item.file].push(item);
});

Object.keys(byFile).forEach(f => {
  console.log(`\n📄 ${f} (${byFile[f].length} occurrences)`);
  byFile[f].slice(0, 10).forEach(i => {
    console.log(`   L${i.line}: ${i.lineContent}`);
  });
  if (byFile[f].length > 10) console.log(`   ... and ${byFile[f].length - 10} more`);
});
