export const config = {
  dataStoreName: 'event-aggregate-mapper',
  dataStoreKey: 'metadata',
  api: {
    fetchPageSize: 50,
  },
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
  comparisonConfig: {
    programIndicators: {
      newMetadataKey: 'createUpdatePis',
      oldMetadataKey: 'deletePis',
      matchFields: ['name', 'shortName', 'expression', 'filter', 'description', 'attributeValues'],
    },
    indicators: {
      newMetadataKey: 'createUpdateInds',
      oldMetadataKey: 'deleteInds',
      matchFields: [
        'name',
        'shortName',
        'numeratorDescription',
        'description',
        'indicatorType',
        'attributeValues',
      ],
    },
  },
}

export const messages = {
  noUpdates: { msg: 'No updates detected', type: 'success' },
  deleteError: {
    msg: 'Error deleting previous mapping metadata, please remove references to this metadata in the system before regenerating',
    type: 'critical',
  },
  importError: { msg: 'Error importing new mapping metadata.', type: 'critical' },
}

export const ADDED_MISSING_CODE_MSG =
  'Target data element was missing a code required for mapping, so code field has been populated with the uid.'

export const ERROR_ADDING_CODE_MSG =
  'Target data element is missing a code, error adding code automatically.'
