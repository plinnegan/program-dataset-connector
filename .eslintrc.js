const { config } = require('@dhis2/cli-style')

module.exports = {
  extends: [config.eslintReact],
  rules: {
    'import/order': ['off'],
    'react/sort-prop-types': ['off'],
    'max-params': ['off'],
    'react-hooks/exhaustive-deps': ['off'],
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        jsx: 'never',
        ts: 'never',
        tsx: 'never',
      },
    ],
  },
}
