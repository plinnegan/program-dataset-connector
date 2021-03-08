import { makeUid } from './utils'
import { config } from './consts'

class PiCalculationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'PiCalculationError'
  }
}

function getByUid(uid, metadata) {
  const matches = metadata.filter((metaItem) => metaItem.id === uid)
  if (matches.length === 0) {
    throw new PiCalculationError(`Could not find PI with UID ${uid} in metadata`)
  }
  return matches[0]
}

function getBaseFilter(piUid, allPis) {
  const pi = getByUid(piUid, allPis)
  const filter = 'filter' in pi ? pi.filter.trim() : ''
  const isBracketed = filter[0] === '(' && filter[filter.length - 1] === ')'
  return isBracketed || filter === '' ? filter : `(${filter})`
}

function getFilters(metaItem, coMaps) {
  const cocs = metaItem.categoryCombo.categoryOptionCombos
  const result = []
  for (const coc of cocs) {
    let cocFilter = ''
    let cocSuffix = ''
    for (const co of coc.categoryOptions) {
      if (co.name === 'default') continue
      if (cocFilter === '') {
        cocFilter = `(${coMaps[co.id].filter})`
        cocSuffix = ` (${co.name})`
      } else {
        cocFilter = `${cocFilter} && (${coMaps[co.id].filter})`
        cocSuffix = `${cocSuffix} (${co.name})`
      }
    }
    result.push({ cocUid: coc.id, filter: cocFilter, suffix: cocSuffix })
  }
  return result
}

function combineFilters(baseFilter, dsFilters, deFilters) {
  const result = []
  for (const dsFilterInfo of dsFilters) {
    const { cocUid: aocUid, filter: dsFilter, suffix: dsSuffix } = dsFilterInfo
    for (const deFilterInfo of deFilters) {
      const { cocUid, filter: deFilter, suffix: deSuffix } = deFilterInfo
      const newFilterArr = [baseFilter, dsFilter, deFilter].filter((arrItem) => arrItem !== '')
      const newSuffixArr = [dsSuffix, deSuffix].filter((suffix) => suffix !== '(default)')
      result.push({
        cocUid,
        aocUid,
        filter: newFilterArr.join(' && '),
        suffix: newSuffixArr.join(''),
      })
    }
  }
  return result
}

function createPiJSON(rowId, pi, deUid, filters, combinedUid) {
  const importData = []
  for (const { cocUid, aocUid, filter, suffix } of filters.values()) {
    const snUnique = `${aocUid.slice(0, 3)}-${cocUid.slice(0, 3)}-${combinedUid}`
    const newPi = JSON.parse(JSON.stringify(pi))
    for (const apb of newPi.analyticsPeriodBoundaries) {
      delete apb.id
    }
    newPi.id = makeUid()
    newPi.filter = filter
    newPi.code = ''
    newPi.description = `${rowId}-${aocUid}-${cocUid}`
    newPi.shortName = snUnique
    newPi.attributeValues = [
      {
        value: deUid,
        attribute: {
          id: config.indCustomAttr.id,
        },
      },
    ]
    newPi.name = `${pi.name}${suffix} (generated)`
    newPi.aggregateExportCategoryOptionCombo = cocUid
    newPi.aggregateExportAttributeOptionCombo = aocUid
    importData.push(newPi)
  }
  return { programIndicators: importData }
}

export function calculatePis(rowId, dsUid, deUid, piUid, coMaps, metadata, generatedPis) {
  const { dataSets, dataElements, programIndicators } = {
    ...metadata.dataSets,
    ...metadata.dataElements,
    ...metadata.programIndicators,
  }
  const deleteOldPis = generatedPis.filter((pi) => pi.description.includes(rowId))
  const combinedUid = `${dsUid.slice(0, 3)}-${deUid.slice(0, 3)}-${piUid.slice(0, 3)}`
  const baseFilter = getBaseFilter(piUid, programIndicators)
  const ds = getByUid(dsUid, dataSets)
  const dsFilters = getFilters(ds, coMaps)
  const de = getByUid(deUid, dataElements)
  const deFilters = getFilters(de, coMaps, dataElements)
  const combinedFilters = combineFilters(baseFilter, dsFilters, deFilters)
  const pi = getByUid(piUid, programIndicators)
  const piUpdates = { deletePis: { programIndicators: deleteOldPis } }
  piUpdates.createUpdatePis = createPiJSON(rowId, pi, deUid, combinedFilters, combinedUid)
  return piUpdates
}

function generateInd(indUid, piSource, indTypeUid) {
  const piAttr = piSource.attributeValues.filter((attrVal) => attrVal.attribute.id === config.indCustomAttr.id)
  if (piAttr.length === 0) {
    throw ValueError(
      `Program indicator ${piSource.id} does not have de mapping attribute value for custom attribute ${config.indCustomAttr.id}`
    )
  }
  return {
    id: indUid,
    name: piSource.name,
    shortName: piSource.shortName,
    aggregateExportCategoryOptionCombo: piSource.aggregateExportCategoryOptionCombo,
    aggregateExportAttributeOptionCombo: piSource.aggregateExportAttributeOptionCombo,
    description: piSource.description,
    denominatorDescription: '1',
    numeratorDescription: piSource.name,
    numerator: `I{${piSource.id}}`,
    denominator: '1',
    indicatorType: { id: indTypeUid },
    attributeValues: [
      {
        value: piAttr[0].value,
        attribute: {
          id: config.indCustomAttr.id,
        },
      },
    ],
  }
}

export function calculateInds(createUpdatePis, deletePis, generatedInds, indTypes) {
  const createUpdateInds = []
  const deleteInds = []
  const indTypeUid = indTypes[0].id
  for (const pi of createUpdatePis.programIndicators) {
    const existingInd = generatedInds.filter((ind) => ind.description === pi.description)
    let indUid
    if (existingInd.length === 0) {
      indUid = makeUid()
    } else {
      indUid = existingInd[0].id
    }
    createUpdateInds.push(generateInd(indUid, pi, indTypeUid))
  }
  for (const pi of deletePis.programIndicators) {
    const existingInd = generatedInds.filter((ind) => ind.description === pi.description)
    if (existingInd.length) {
      deleteInds.push({ id: existingInd[0].id })
    }
  }
  return {
    createUpdateInds: { indicators: createUpdateInds },
    deleteInds: { indicators: deleteInds },
  }
}
