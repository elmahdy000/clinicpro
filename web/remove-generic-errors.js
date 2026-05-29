const fs = require('fs');
const path = require('path');

function walkSync(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      if (!filepath.includes('node_modules') && !filepath.includes('.next')) {
        filelist = walkSync(filepath, filelist);
      }
    } else {
      if (filepath.endsWith('.tsx') || filepath.endsWith('.ts')) {
        filelist.push(filepath);
      }
    }
  }
  return filelist;
}

const files = walkSync(path.join(__dirname, 'src'));
let updatedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace `onError: () => toast.error('...')` and `onError: (e) => toast.error('...')`
  // We want to completely remove these lines if they are single line.
  // Note: we can safely replace them with a noop like `onError: (e) => console.error(e),`
  content = content.replace(/onError:\s*\([^)]*\)\s*=>\s*toast\.error\([^)]+\),?/g, 'onError: (e) => console.error(e),');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    updatedCount++;
  }
}

console.log(`Updated ${updatedCount} files.`);
