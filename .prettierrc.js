const { config } = require('@dhis2/cli-style')

module.exports = {
  ...require(config.prettier),
  trailingComma: 'es5',
  tabWidth: 2,
  semi: false,
  singleQuote: true,
  quoteProps: 'consistent',
  printWidth: 120,
}
