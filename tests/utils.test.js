import {
  makeUid,
  getCosFiltersFromMetadata,
  getCosFromRow,
  orderCos,
  updateGroupMembers,
  sameKeys,
} from '../src/utils'
import { exampleCoMaps, exampleMetadata } from './test-data/utils.testdata'

test('getCosFiltersFromMetadata: Gets filters correctly', () => {
  const exampleDe = exampleMetadata.dataElements.dataElements[0]
  const result = getCosFiltersFromMetadata(exampleDe, exampleCoMaps).catId01
  expect(result.name).toBe('catId01')
  expect(result.filter).toBe("#{someDeUid} == 'value1'")
})

test('getCosFiltersFromMetadata: Default CO removed', () => {
  const exampleDe = exampleMetadata.dataElements.dataElements[0]
  expect(getCosFiltersFromMetadata(exampleDe, exampleCoMaps).default).toBeUndefined()
})

test('getCosFromRow: Check DE and DS mappings included', () => {
  const rowData = { deUid: 'de01', dsUid: 'ds01', coFilters: {} }
  const result = getCosFromRow(rowData, exampleMetadata, exampleCoMaps)
  expect(result).toStrictEqual({
    catId01: { name: 'catId01', filter: "#{someDeUid} == 'value1'" },
    catId02: { name: 'catId02', filter: "#{someDeUid} == 'value2'" },
    catId03: { name: 'catId03', filter: "#{someDeUid} == 'value3'" },
    catId04: { name: 'catId04', filter: "#{someDeUid} == 'value4'" },
    catId05: { name: 'catId05', filter: "#{someDeUid} == 'value5'" },
  })
})

test('getCosFromRow: Check existing filters override', () => {
  const rowData = {
    deUid: 'de01',
    dsUid: 'ds01',
    coFilters: {
      catId01: { name: 'catId01', filter: "#{someDeUid} == 'otherValue1'" },
      catId03: { name: 'catId03', filter: "#{someDeUid} == 'otherValue3'" },
      catId05: { name: 'catId05', filter: "#{someDeUid} == 'otherValue5'" },
      catId06: { name: 'catId06', filter: "#{someDeUid} == 'otherValue6'" },
    },
  }
  const result = getCosFromRow(rowData, exampleMetadata, exampleCoMaps)
  expect(result).toStrictEqual({
    catId01: { name: 'catId01', filter: "#{someDeUid} == 'otherValue1'" },
    catId02: { name: 'catId02', filter: "#{someDeUid} == 'value2'" },
    catId03: { name: 'catId03', filter: "#{someDeUid} == 'otherValue3'" },
    catId04: { name: 'catId04', filter: "#{someDeUid} == 'value4'" },
    catId05: { name: 'catId05', filter: "#{someDeUid} == 'otherValue5'" },
  })
})

test('makeUid: Makes uid of correct length', () => {
  expect(makeUid().length).toBe(11)
})

test('orderCos: Orders Cos by order in COC name', () => {
  const cocTest = {
    id: 'cocTestUid1',
    name: 'Male, <5y',
    categoryOptions: [
      { id: 'coTestUid01', name: '<5y' },
      { id: 'coTestUid02', name: 'Male' },
    ],
  }
  const result = orderCos(cocTest)
  expect(result).toEqual({
    ...cocTest,
    categoryOptions: [
      { id: 'coTestUid02', name: 'Male' },
      { id: 'coTestUid01', name: '<5y' },
    ],
  })
})

test('orderCos: Correctly includes cos with partial name matches', () => {
  const cocTest = {
    id: 'cocTestUid1',
    name: 'Female, Female sex worker',
    categoryOptions: [
      { id: 'coTestUid01', name: 'Female sex worker' },
      { id: 'coTestUid02', name: 'Female' },
    ],
  }
  const result = orderCos(cocTest)
  expect(result).toEqual({
    ...cocTest,
    categoryOptions: [
      { id: 'coTestUid02', name: 'Female' },
      { id: 'coTestUid01', name: 'Female sex worker' },
    ],
  })
})

test('Update group members correctly adds and removes members', () => {
  const group = {
    programIndicators: [{ id: 'abc' }, { id: 'bcd' }, { id: 'cde' }, { id: 'def' }],
  }
  const createUpdateMembers = [{ id: 'abc' }, { id: 'efg' }]
  const deleteMembers = [{ id: 'bcd' }, { id: 'fgh' }]
  const expected = [{ id: 'abc' }, { id: 'cde' }, { id: 'def' }, { id: 'efg' }]
  expect(updateGroupMembers(group, createUpdateMembers, deleteMembers)).toEqual(expected)
})

describe('sameKeys tests', () => {
  const o1 = { 1: 'val1', two: 'val2', testKey: 'val3' }

  test('Returns true when object have matching keys', () => {
    const o2 = { two: 'diffVal1', testKey: 'diffVal2', 1: 'diffVal3' }
    expect(sameKeys(o1, o2)).toEqual(true)
  })

  test('Returns false when missing keys', () => {
    const o2 = { 1: 'val1', two: 'val2' }
    expect(sameKeys(o1, o2)).toEqual(false)
  })

  test('Returns false when extra keys', () => {
    const o2 = { 1: 'val1', two: 'val2', testKey: 'val3', extra: 'extraVal' }
    expect(sameKeys(o1, o2)).toEqual(false)
  })
})
