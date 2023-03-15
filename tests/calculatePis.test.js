import { getEmptyCategoryCoIds, metadataMatch, getChangesOnly } from '../src/calculatePis'
import { metadataMatchTests, getChangesOnlyTests } from './test-data/caluclatePis.testdata'
import { config } from '../src/consts'

describe('getEmptyCategoryCoIds function correctly gets the empty categories', function () {
  const coMaps = {
    cat1CoUid01: { filter: 'true' },
    cat1CoUid02: { filter: 'true' },
    cat1CoUid03: { filter: '' },
    cat2CoUid01: { filter: 'true' },
    cat2CoUid02: { filter: 'true' },
    cat2CoUid03: { filter: '' },
    cat3CoUid01: { filter: '' },
    cat3CoUid02: { filter: '' },
    cat3CoUid03: { filter: '' },
  }

  test('Default category combo is handled correctly', function () {
    const defaultCc = {
      categories: [{ categoryOptions: [{ id: 'xYerKDKCefk', name: 'default' }] }],
    }
    const result = getEmptyCategoryCoIds(defaultCc, coMaps)
    expect(result).toEqual([])
  })

  test('Empty categories are filtered out', function () {
    const testCc = {
      categories: [
        {
          categoryOptions: [
            { id: 'cat1CoUid01', name: 'cat1Co1' },
            { id: 'cat1CoUid02', name: 'cat1Co2' },
            { id: 'cat1CoUid03', name: 'cat1Co3' },
          ],
        },
        {
          categoryOptions: [
            { id: 'cat2CoUid01', name: 'cat2Co1' },
            { id: 'cat2CoUid02', name: 'cat2Co2' },
            { id: 'cat2CoUid03', name: 'cat2Co3' },
          ],
        },
        {
          categoryOptions: [
            { id: 'cat3CoUid01', name: 'cat3Co1' },
            { id: 'cat3CoUid02', name: 'cat3Co2' },
            { id: 'cat3CoUid03', name: 'cat3Co3' },
          ],
        },
      ],
    }
    const result = getEmptyCategoryCoIds(testCc, coMaps)
    expect(result).toEqual(['cat3CoUid01', 'cat3CoUid02', 'cat3CoUid03'])
  })
})

describe('Metadata match tests', () => {
  for (const testCase of metadataMatchTests) {
    const { newMeta, oldMeta, metaType, expected, description } = testCase
    test(`metadataMatch: ${description}`, function () {
      const matchFields = config.comparisonConfig[metaType].matchFields
      const result = metadataMatch(newMeta, oldMeta, matchFields)
      expect(result).toEqual(expected)
    })
  }
})

describe('getChangesOnly tests', () => {
  for (const testCase of getChangesOnlyTests) {
    const { metaUpdates, metaType, description, expected } = testCase
    test(`getChangesOnly: ${description}`, function () {
      const result = getChangesOnly(metaUpdates, metaType)
      expect(result).toEqual(expected)
    })
  }
})
