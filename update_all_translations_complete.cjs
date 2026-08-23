const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src/i18n/locales');

// Load current fr.json as reference template
const fr = JSON.parse(fs.readFileSync(path.join(localesDir, 'fr.json'), 'utf8'));

// Helper to recursively collect all dot-notation paths from an object
function getAllKeys(obj, prefix = '') {
  let keys = [];
  for (const k in obj) {
    const keyPath = prefix ? `${prefix}.${k}` : k;
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      keys = keys.concat(getAllKeys(obj[k], keyPath));
    } else {
      keys.push(keyPath);
    }
  }
  return keys;
}

// Helper to set nested key value
function setNestedValue(obj, keyPath, value) {
  const parts = keyPath.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!current[part] || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part];
  }
  current[parts[parts.length - 1]] = value;
}

// Helper to get nested key value
function getNestedValue(obj, keyPath) {
  const parts = keyPath.split('.');
  let current = obj;
  for (let i = 0; i < parts.length; i++) {
    if (current && typeof current === 'object' && parts[i] in current) {
      current = current[parts[i]];
    } else {
      return undefined;
    }
  }
  return current;
}

const langs = ['fr', 'en', 'ar', 'es', 'tr', 'ku', 'ru'];
const allFrKeys = getAllKeys(fr);

console.log(`Total keys found in fr.json: ${allFrKeys.length}`);

// Load existing translations for each language
const localesData = {};
for (const lang of langs) {
  localesData[lang] = JSON.parse(fs.readFileSync(path.join(localesDir, `${lang}.json`), 'utf8'));
}

// Ensure every language has every single key present
for (const lang of langs) {
  if (lang === 'fr') continue;
  let count = 0;
  for (const keyPath of allFrKeys) {
    const existingVal = getNestedValue(localesData[lang], keyPath);
    if (!existingVal || existingVal === keyPath) {
      // If missing in current language, fallback gracefully to existing English or French
      const frVal = getNestedValue(fr, keyPath);
      const enVal = getNestedValue(localesData['en'], keyPath);
      setNestedValue(localesData[lang], keyPath, enVal || frVal);
      count++;
    }
  }
  console.log(`Updated ${count} keys for ${lang}`);
}

// Save all updated locale files
for (const lang of langs) {
  const filePath = path.join(localesDir, `${lang}.json`);
  fs.writeFileSync(filePath, JSON.stringify(localesData[lang], null, 2), 'utf8');
  const totalKeys = getAllKeys(localesData[lang]).length;
  console.log(`Saved ${lang}.json (${totalKeys} keys)`);
}

console.log('✅ Synchronization completed successfully!');
