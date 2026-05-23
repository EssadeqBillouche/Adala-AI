const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const projectsEnumsDir = path.join(srcDir, 'projects', 'entities', 'enums');
const convEnumsDir = path.join(srcDir, 'conversations', 'entities', 'enums');
const legalEnumsDir = path.join(srcDir, 'legal-sources', 'entities', 'enums');

function mkdir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

mkdir(convEnumsDir);
mkdir(legalEnumsDir);

function moveFiles(sourcePrefix, destDir) {
  if (!fs.existsSync(projectsEnumsDir)) return;
  const files = fs.readdirSync(projectsEnumsDir).filter(f => f.startsWith(sourcePrefix) && fs.statSync(path.join(projectsEnumsDir, f)).isFile());
  for (const file of files) {
    fs.renameSync(path.join(projectsEnumsDir, file), path.join(destDir, file));
  }
}

// Conversations Enums
moveFiles('conv-status.', convEnumsDir);
moveFiles('message-role.', convEnumsDir);

// Legal Sources Enums
moveFiles('source-type.', legalEnumsDir);
moveFiles('legal-domain.', legalEnumsDir);
moveFiles('jurisdiction.', legalEnumsDir);
moveFiles('embedding-status.', legalEnumsDir);

console.log('Enums extracted successfully.');
