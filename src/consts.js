export const config = {
  dataStoreName: 'event-aggregate-mapper',
  dataStoreKey: 'metadata',
  indCustomAttr: {
    id: 'b8KbU93phhz',
    name: 'Data element for aggregate data export',
    publicAccess: 'r-------',
    valueType: 'TEXT',
    programIndicatorAttribute: true,
    indicatorAttribute: true,
  },
  indType: {
    name: 'Number (Factor 1)',
    id: 'JkWynlWMjJR',
    number: true,
    factor: 1,
  },
}

export const ADDED_MISSING_CODE_MSG =
  'Target data element was missing a code required for mapping, so code field has been populated with the uid.'

export const ERROR_ADDING_CODE_MSG =
  'Target data element is missing a code, error adding code automatically.'
