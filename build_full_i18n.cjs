const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src/i18n/locales');

// Comprehensive dictionary for all 7 languages
const fullData = {
  fr: JSON.parse(fs.readFileSync(path.join(localesDir, 'fr.json'), 'utf8')),
  en: JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf8')),
  ar: JSON.parse(fs.readFileSync(path.join(localesDir, 'ar.json'), 'utf8')),
  es: JSON.parse(fs.readFileSync(path.join(localesDir, 'es.json'), 'utf8')),
  tr: JSON.parse(fs.readFileSync(path.join(localesDir, 'tr.json'), 'utf8')),
  ku: JSON.parse(fs.readFileSync(path.join(localesDir, 'ku.json'), 'utf8')),
  ru: JSON.parse(fs.readFileSync(path.join(localesDir, 'ru.json'), 'utf8')),
};

console.log("Loaded locale files successfully.");
