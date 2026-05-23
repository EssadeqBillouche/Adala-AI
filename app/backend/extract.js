const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const projectsDir = path.join(srcDir, 'projects');
const convDir = path.join(srcDir, 'conversations');
const legalDir = path.join(srcDir, 'legal-sources');

function mkdir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

mkdir(path.join(convDir, 'entities'));
mkdir(path.join(convDir, 'dto'));
mkdir(path.join(legalDir, 'entities'));
mkdir(path.join(legalDir, 'dto'));

function moveFiles(sourcePrefix, destDir) {
  const files = fs.readdirSync(projectsDir).filter(f => f.startsWith(sourcePrefix) && fs.statSync(path.join(projectsDir, f)).isFile());
  for (const file of files) {
    fs.renameSync(path.join(projectsDir, file), path.join(destDir, file));
  }
}

function moveEntities(sourcePrefixes, destDir) {
  const dir = path.join(projectsDir, 'entities');
  const files = fs.readdirSync(dir).filter(f => sourcePrefixes.some(prefix => f.startsWith(prefix)));
  for (const file of files) {
    fs.renameSync(path.join(dir, file), path.join(destDir, 'entities', file));
  }
}

function moveDto(sourcePrefixes, destDir) {
  const dir = path.join(projectsDir, 'dto');
  const files = fs.readdirSync(dir).filter(f => sourcePrefixes.some(prefix => f.includes(prefix)));
  for (const file of files) {
    fs.renameSync(path.join(dir, file), path.join(destDir, 'dto', file));
  }
}

// Move Conversations and Messages
moveFiles('conversations.', convDir);
moveFiles('messages.', convDir);
moveEntities(['conversation.entity.ts', 'message.entity.ts', 'message-citation.entity.ts'], convDir);
moveDto(['conversation', 'message'], convDir);

// Move Legal Sources
moveFiles('legal-sources.', legalDir);
moveEntities(['legal-source.entity.ts'], legalDir);
moveDto(['legal-source'], legalDir);

console.log('Extraction script completed successfully.');
