const { config } = require('@dhis2/cli-style')

module.exports = {
  extends: [config.eslintReact],
  rules: {
    'import/order': ['off'],
    'react/sort-prop-types': ['off'],
    'max-params': ['off'],
  },
}
