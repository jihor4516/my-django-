const path = require('path');

const SUPPORTED_LANGS = ['ar', 'fr', 'en'];

function extractLiteralTranslationCalls(content, parser) {
  const translationCallPattern = /\bt\s*\(\s*(['"`])([^'"`\\]*(?:\\.[^'"`\\]*)*)\1(?:\s*,\s*(['"`])([^'"`\\]*(?:\\.[^'"`\\]*)*)\3)?/g;
  let match = translationCallPattern.exec(content);

  while (match) {
    const key = (match[2] || '').trim();
    const fallback = (match[4] || '').trim();

    if (key && !key.includes('${')) {
      parser.set(key, fallback ? { defaultValue: fallback } : {});
    }

    match = translationCallPattern.exec(content);
  }
}

module.exports = {
  input: [
    'app/**/*.{js,jsx}',
    'components/**/*.{js,jsx}',
    'data/**/*.{js,jsx}',
    'lib/**/*.{js,jsx}',
    '!locales/**',
    '!node_modules/**',
    '!.next/**',
  ],
  output: '.',
  options: {
    debug: false,
    removeUnusedKeys: false,
    sort: false,
    func: {
      list: ['t'],
      extensions: ['.js', '.jsx'],
    },
    trans: false,
    lngs: SUPPORTED_LANGS,
    defaultLng: 'ar',
    defaultNs: 'translation',
    ns: ['translation'],
    defaultValue: '',
    keySeparator: '.',
    nsSeparator: false,
    resource: {
      loadPath: path.join('locales', '{{lng}}.json'),
      savePath: path.join('locales', '{{lng}}.json'),
      jsonIndent: 2,
      lineEnding: '\n',
    },
  },
  transform(file, enc, done) {
    const content = file.contents.toString(enc);

    extractLiteralTranslationCalls(content, this.parser);
    done();
  },
};