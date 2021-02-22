import { makeUid } from './utils'

class PiCalculationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'PiCalculationError'
  }
}

function getByUid(uid, metadata) {
  const matches = metadata.filter((metaItem) => metaItem.id === uid)
  if (matches.length === 0) {
    throw PiCalculationError(`Could not find PI with UID ${piUid} in metadata`)
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
      result.push({
        cocUid,
        aocUid,
        filter: baseFilter === '' ? `${dsFilter} && ${deFilter}` : `${baseFilter} && ${dsFilter} && ${deFilter}`,
        suffix: dsSuffix + deSuffix,
      })
    }
  }
  return result
}

// TODO: Need to make sure Generate PIs removes previous PIs before running.
function createPiJSON(pi, filters) {
  const importData = []
  for (const { cocUid, aocUid, filter, suffix } in filters) {
    const newPi = JSON.parse(JSON.stringify(pi))
    newPi.filter = filter
    newPi.name = `${newPi.name}${suffix}`
    newPi.aggregateExportCategoryOptionCombo = cocUid
    newPi.aggregateExportAttributeOptionCombo = aocUid
    importData.push(newPi)
  }
  return { programIndicators: importData }
}

export default function calculatePis(dsUid, deUid, piUid, coMaps, metadata) {
  const { dataSets, dataElements, programIndicators } = {
    ...metadata.dataSets,
    ...metadata.dataElements,
    ...metadata.programIndicators,
  }
  const baseFilter = getBaseFilter(piUid, programIndicators)
  const ds = getByUid(dsUid, dataSets)
  const dsFilters = getFilters(ds, coMaps)
  const de = getByUid(deUid, dataElements)
  const deFilters = getFilters(de, coMaps, dataElements)
  const combinedFilters = combineFilters(baseFilter, dsFilters, deFilters)
  const pi = getByUid(piUid, programIndicators)
  const piJson = createPiJSON(pi, combinedFilters)
  return piJson
}
