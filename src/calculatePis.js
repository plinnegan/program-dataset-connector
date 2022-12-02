import { config } from './consts'
import { MappingGenerationError } from './Errors'
import { makeUid, orderCos, getCc } from './utils'

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

export function getEmptyCategoryCoIds(rawCc, coMaps) {
  const result = []
  for (const cat of rawCc.categories) {
    let allBlank = true
    for (const co of cat.categoryOptions) {
      if (co.name === 'default' || coMaps[co.id].filter !== '') {
        allBlank = false
        break
      }
    }
    if (allBlank) {
      console.log(`All categories options are blank for category ${cat.name}`)
      result.push(...cat.categoryOptions.map(({ id }) => id))
    }
  }
  return result
}

function isNewCoc(result, newCocFilter) {
  const { id: newId, filter: newFilter, suffix: newSuffix } = newCocFilter
  return !result.some(
    ({ id, filter, suffix }) => id === newId && filter === newFilter && suffix === newSuffix
  )
}

function getFilters(metaItem, coMaps, config) {
  const rawCc = getCc(metaItem, config)
  const emptyCategoryCoIds = getEmptyCategoryCoIds(rawCc, coMaps)
  const rawCocs = rawCc?.categoryOptionCombos
  if (!rawCocs || rawCocs.length === 0) {
    throw new MappingGenerationError(
      `Data set or data element ${metaItem?.name} does not appear to have any category option combos associated ` +
        `with the assigned category combo, please generate category ` +
        'option combos in the admin app before attempting to generate the mapping again'
    )
  }
  const cocs = rawCocs.map((coc) => orderCos(coc))
  const result = []
  for (const coc of cocs) {
    let cocFilter = ''
    let cocSuffix = ''
    let skipCoc = false
    for (const co of coc.categoryOptions) {
      if (co.name === 'default') {
        continue
      } else if (!(co.id in coMaps)) {
        throw new MappingGenerationError(
          'Found a category option combo which cannot be constructed from the assigned ' +
            'categories, this typically means the COCs on the data element or data set need ' +
            'updating to align with the categories (CC override changes can also cause this)'
        )
      } else if (coMaps[co.id].filter === '') {
        if (emptyCategoryCoIds.includes(co.id)) {
          continue
        } else {
          console.log(`Skipping coc ${coc.name} because co filter ${co.name} is blank`)
          skipCoc = true
          break
        }
      }
      if (cocFilter === '') {
        cocFilter = `(${coMaps[co.id].filter})`
        cocSuffix = ` (${co.shortName ? co.shortName : co.name})`
      } else {
        cocFilter = `${cocFilter} && (${coMaps[co.id].filter})`
        cocSuffix = `${cocSuffix} (${co.shortName ? co.shortName : co.name})`
      }
    }
    const newCocFilter = { cocUid: coc.id, filter: cocFilter, suffix: cocSuffix }
    if (!skipCoc && isNewCoc(result, newCocFilter)) {
      result.push(newCocFilter)
    }
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

function createPiJSON(rowId, pi, deCode, filters, combinedUid) {
  const pis = []
  for (const { cocUid, aocUid, filter, suffix } of filters.values()) {
    const snUnique = `${aocUid}-${cocUid}-${combinedUid}`
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
        value: deCode,
        attribute: {
          id: config.indCustomAttr.id,
        },
      },
    ]
    newPi.name = `${pi.name}${suffix} (${rowId})`
    newPi.aggregateExportCategoryOptionCombo = cocUid
    newPi.aggregateExportAttributeOptionCombo = aocUid
    pis.push(newPi)
  }
  return pis
}

function calculatePis(rowId, dsUid, deInfo, piUid, coMaps, metadata, generatedPis) {
  const { dataSets, dataElements, programIndicators } = {
    ...metadata.dataSets,
    ...metadata.dataElements,
    ...metadata.programIndicators,
  }
  const { id: deUid, code: deCode } = deInfo
  const deleteOldPis = generatedPis.filter((pi) => pi.description.includes(rowId))
  const combinedUid = `${dsUid.slice(0, 3)}-${deUid.slice(0, 3)}-${piUid.slice(0, 3)}`
  const baseFilter = getBaseFilter(piUid, programIndicators)
  const ds = getByUid(dsUid, dataSets)
  const dsFilters = getFilters(ds, coMaps, {})
  const de = getByUid(deUid, dataElements)
  const deFilters = getFilters(de, coMaps, { dsUid })
  const combinedFilters = combineFilters(baseFilter, dsFilters, deFilters)
  const pi = getByUid(piUid, programIndicators)
  const piUpdates = { deletePis: deleteOldPis }
  piUpdates.createUpdatePis = createPiJSON(rowId, pi, deCode, combinedFilters, combinedUid)
  return piUpdates
}

function calculatePiGroup(rowId, generatedPiGroups, createUpdatePis, deShortName) {
  const piGroups = generatedPiGroups.filter((piGroup) =>
    piGroup.name.includes(`piMappingGroup-${rowId}`)
  )
  let piGroup
  if (piGroups.length) {
    piGroup = piGroups[0]
  } else {
    const uid = makeUid()
    piGroup = {
      name: `piMappingGroup-${rowId} Target DE: ${deShortName} (generated)`,
      id: uid,
    }
  }
  piGroup.programIndicators = createUpdatePis.map((pi) => ({ id: pi.id }))
  return piGroup
}

function generateInd(indUid, piSource, indTypeUid, deUid) {
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
        value: deUid,
        attribute: {
          id: config.indCustomAttr.id,
        },
      },
    ],
  }
}

function calculateInds(createUpdatePis, deletePis, generatedInds, indTypes, deUid) {
  const createUpdateInds = []
  const deleteInds = []
  const indTypeUid = indTypes[0].id
  for (const pi of createUpdatePis) {
    const existingInd = generatedInds.filter((ind) => ind.description === pi.description)
    let indUid
    if (existingInd.length === 0) {
      indUid = makeUid()
    } else {
      indUid = existingInd[0].id
    }
    createUpdateInds.push(generateInd(indUid, pi, indTypeUid, deUid))
  }
  for (const pi of deletePis) {
    const existingInd = generatedInds.filter((ind) => ind.description === pi.description)
    if (existingInd.length) {
      deleteInds.push({ id: existingInd[0].id })
    }
  }
  return {
    createUpdateInds,
    deleteInds,
  }
}

function calculateIndGroup(rowId, generatedIndGroups, createUpdateInds) {
  const IndGroups = generatedIndGroups.filter((indGroup) =>
    indGroup.name.includes(`indMappingGroup-${rowId}`)
  )
  let indGroup
  if (IndGroups.length) {
    indGroup = IndGroups[0]
  } else {
    const uid = makeUid()
    indGroup = {
      name:
        `indMappingGroup-${rowId} (/api/analytics/dataValueSet.json?dimension=dx:IN_GROUP-` +
        `${uid}&outputIdScheme=ATTRIBUTE:${config.indCustomAttr.id})  (generated)`,
      id: uid,
    }
  }
  indGroup.indicators = createUpdateInds.map((ind) => ({ id: ind.id }))
  return indGroup
}

export default function generateDataMapping(
  rowId,
  dsUid,
  de,
  piUid,
  coMaps,
  baseMetadata,
  generatedMetadata,
  generateIndicators
) {
  const indTypes = baseMetadata.indicatorTypes.indicatorTypes
  const generatedPis = generatedMetadata.generatedPis.programIndicators
  const generatedPiGroups = generatedMetadata.generatedPiGroups.programIndicatorGroups
  const { createUpdatePis, deletePis } = calculatePis(
    rowId,
    dsUid,
    de,
    piUid,
    coMaps,
    baseMetadata,
    generatedPis
  )

  const des = baseMetadata.dataElements.dataElements.filter(({ id }) => id === de.id)
  const piGroup = calculatePiGroup(rowId, generatedPiGroups, createUpdatePis, des[0].shortName)
  const metaChanges = {
    createUpdateMetadata: {
      programIndicators: createUpdatePis,
      programIndicatorGroups: [piGroup],
    },
    deleteMetadata: {
      programIndicators: deletePis,
    },
    needsDelete: deletePis.length > 0,
  }
  if (generateIndicators) {
    const generatedInds = generatedMetadata.generatedInds.indicators
    const generatedIndGroups = generatedMetadata.generatedIndGroups.indicatorGroups
    const { createUpdateInds, deleteInds } = calculateInds(
      createUpdatePis,
      deletePis,
      generatedInds,
      indTypes,
      de.id
    )
    const indGroup = calculateIndGroup(rowId, generatedIndGroups, createUpdateInds)
    metaChanges.createUpdateMetadata.indicators = createUpdateInds
    metaChanges.createUpdateMetadata.indicatorGroups = [indGroup]
    metaChanges.deleteMetadata.indicators = deleteInds
    metaChanges.needsDelete = deletePis.length > 0 || deleteInds.length > 0
  }
  return metaChanges
}
