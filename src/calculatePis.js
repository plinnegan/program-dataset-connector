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
function createPiJSON(pi, filters, existingPis) {
  const importData = []
  const pisToDelete = []
  const processedAocCocs = {}
  console.log('filters', filters)
  for (const { cocUid, aocUid, filter, suffix } of filters) {
    const aocCoc = `${aocUid}-${cocUid}`
    processedAocCocs[aocCoc] = true
    const newPi = JSON.parse(JSON.stringify(pi))
    newPi.id = aocCoc in existingPis ? existingPis[aocCoc] : makeUid()
    newPi.filter = filter
    newPi.code = `pi-source-${pi.id}`
    newPi.name = `${pi.name}${suffix} (generated)`
    newPi.aggregateExportCategoryOptionCombo = cocUid
    newPi.aggregateExportAttributeOptionCombo = aocUid
    importData.push(newPi)
  }
  for (const aocCoc in existingPis) {
    if (!(aocCoc in processedAocCocs)) {
      // If existing pi combo is not in new config, it needs deleting
      pisToDelete.push({ id: existingPis[aocCoc] })
    }
  }
  return {
    createUpdatePis: { programIndicators: importData },
    deletePis: { programIndicators: pisToDelete },
  }
}

function getExistingPis(piUid, existingGeneratedPis) {
  const thesePis = existingGeneratedPis.filter((pi) => pi.code === `pi-source-${piUid}`)
  const result = {}
  for (const pi in thesePis) {
    const cocExport = pi.aggregateExportCategoryOptionCombo
    const aocExport = pi.aggregateExportAttributeOptionCombo
    result[`${aocExport}-${cocExport}`] = pi.id
  }
  return result
}

export default function calculatePis(dsUid, deUid, piUid, coMaps, metadata) {
  const { dataSets, dataElements, programIndicators } = {
    ...metadata.dataSets,
    ...metadata.dataElements,
    ...metadata.programIndicators,
  }
  const generatedPis = metadata.generatedPis.programIndicators
  const baseFilter = getBaseFilter(piUid, programIndicators)
  const ds = getByUid(dsUid, dataSets)
  const dsFilters = getFilters(ds, coMaps)
  const de = getByUid(deUid, dataElements)
  const deFilters = getFilters(de, coMaps, dataElements)
  const combinedFilters = combineFilters(baseFilter, dsFilters, deFilters)
  const pi = getByUid(piUid, programIndicators)
  const existingPis = getExistingPis(piUid, generatedPis)
  return createPiJSON(pi, combinedFilters, existingPis)
}