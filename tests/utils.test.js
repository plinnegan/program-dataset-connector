import { makeUid, getCosFromMetadata, getCosFromRow } from '../src/utils'
import { exampleCoMaps, exampleMetadata } from './test-data/utils.testdata'

test('getCosFromMetadata: Gets filters correctly', () => {
  const exampleDe = exampleMetadata.dataElements.dataElements[0]
  const result = getCosFromMetadata(exampleDe, exampleCoMaps).catId01
  expect(result.name).toBe('Category01')
  expect(result.filter).toBe("#{someDeUid} == 'value1'")
})

test('getCosFromMetadata: Default CO removed', () => {
  const exampleDe = exampleMetadata.dataElements.dataElements[0]
  expect(getCosFromMetadata(exampleDe, exampleCoMaps).default).toBeUndefined()
})

test('getCosFromRow: Check DE and DS mappings included', () => {
  const result = getCosFromRow('ds01', 'de01', exampleMetadata, exampleCoMaps)
  expect(result).toStrictEqual({
    catId01: { name: 'Category01', filter: "#{someDeUid} == 'value1'" },
    catId02: { name: 'Category02', filter: "#{someDeUid} == 'value2'" },
    catId03: { name: 'Category03', filter: "#{someDeUid} == 'value3'" },
    catId04: { name: 'Category04', filter: "#{someDeUid} == 'value4'" },
    catId05: { name: 'Category05', filter: "#{someDeUid} == 'value5'" },
  })
})

test('makeUid: Makes uid of correct length', () => {
  expect(makeUid().length).toBe(11)
})
