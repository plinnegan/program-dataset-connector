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

function createPiJSON(pi, deUid, filters, existingPis) {
  const importData = []
  const pisToDelete = []
  const processedAocCocs = {}
  console.log('filters', filters)
  for (const [idx, { cocUid, aocUid, filter, suffix }] of filters.entries()) {
    const aocCoc = `${aocUid}-${cocUid}`
    processedAocCocs[aocCoc] = true
    const newPi = JSON.parse(JSON.stringify(pi))
    if (aocCoc in existingPis) {
      newPi.id = existingPis[aocCoc].id
      newPi.analyticsPeriodBoundaries = existingPis[aocCoc].analyticsPeriodBoundaries
    } else {
      newPi.id = makeUid()
      for (const apb of newPi.analyticsPeriodBoundaries) {
        delete apb.id
      }
    }
    newPi.id = aocCoc in existingPis ? existingPis[aocCoc] : makeUid()
    newPi.filter = filter
    newPi.code = ''
    newPi.description = `pi-source-${pi.id}`
    newPi.shortName = `${pi.shortName} (${idx})`
    newPi.attributeValues = [
      {
        value: deUid,
        attribute: {
          id: 'b8KbU93phhz',
        },
      },
    ]
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
  const thesePis = existingGeneratedPis.filter((pi) => pi.description === `pi-source-${piUid}`)
  const result = {}
  for (const pi in thesePis) {
    const apb = pi.analyticsPeriodBoundaries
    const cocExport = pi.aggregateExportCategoryOptionCombo
    const aocExport = pi.aggregateExportAttributeOptionCombo
    result[`${aocExport}-${cocExport}`] = { id: pi.id, analyticsPeriodBoundaries: apb }
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
  return createPiJSON(pi, deUid, combinedFilters, existingPis)
}
