const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

const replacements = {
  'bg-\\[#0f0f0f\\]': 'bg-page',
  'bg-surface-900': 'bg-page',
  'bg-surface-850': 'bg-card',
  'bg-surface-800': 'bg-surface',
  'bg-surface-700': 'bg-hover',
  'bg-surface-300': 'bg-divider',
  'text-white/90': 'text-primary/90',
  'text-white/80': 'text-secondary',
  'text-white/70': 'text-secondary',
  'text-white/50': 'text-secondary',
  'text-white/40': 'text-secondary/80',
  'text-white/30': 'text-secondary/50',
  'text-white/20': 'text-secondary/40',
  'text-white': 'text-primary',
  'text-surface-900': 'text-page',
  'text-surface-800': 'text-surface',
  'border-white/20': 'border-border-light/20',
  'border-white/10': 'border-border-light/10',
  'border-white/5': 'border-border-light/5',
  'border-surface-700': 'border-border-light',
  'hover:bg-white/10': 'hover:bg-hover',
  'hover:bg-white/20': 'hover:bg-hover',
  'hover:bg-surface-800': 'hover:bg-surface',
  'hover:bg-surface-700': 'hover:bg-hover',
  'hover:text-white': 'hover:text-primary',
  'placeholder-white/40': 'placeholder-secondary',
  'placeholder-white/30': 'placeholder-secondary/80'
};

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Use a regex that replaces the exact class name, bounded by word boundaries or special characters
  // Because Tailwind classes contain hyphens and slashes, \b doesn't work perfectly.
  // Instead, we can split by common delimiters in JSX (spaces, quotes, backticks, newlines) 
  // or use regex lookarounds.
  
  for (const [key, value] of Object.entries(replacements)) {
    // Escape special regex characters in the key
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Regex matches the class if it is preceded and followed by a space, quote, backtick, or newline
    const regex = new RegExp(`(?<=[\\s"'\\\`])` + escapedKey + `(?=[\\s"'\\\`])`, 'g');
    content = content.replace(regex, value);
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

processDirectory(directoryPath);
console.log('Done replacing colors!');
