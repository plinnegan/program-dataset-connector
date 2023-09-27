import { config } from './consts'
import { MappingGenerationError } from './Errors'
import { makeUid, orderCos, getCc, updateGroupMembers } from './utils'

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
        cocSuffix = ` (${co?.shortName || co.name})`
      } else {
        cocFilter = `${cocFilter} && (${coMaps[co.id].filter})`
        cocSuffix = `${cocSuffix} (${co?.shortName || co.name})`
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

function createPiJSON(rowId, pi, deCode, filters, combinedUid, generatedMetadataPublicSharing) {
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
    newPi.sharing.public = generatedMetadataPublicSharing
    pis.push(newPi)
  }
  return pis
}

/**
 * Compare the two objects by looking at the values for the matchFields and return true if all values match
 * @param {Object} newMeta New metadata
 * @param {Object} oldMeta Old metadata
 * @param {Array} matchFields Array of fields which have to have matching values to be considered a match
 */
export function metadataMatch(newMeta, oldMeta, matchFields) {
  for (const field of matchFields) {
    try {
      let newVal = newMeta?.[field]
      let oldVal = oldMeta?.[field]
      if (newVal?.id || Array.isArray(newVal)) {
        newVal = JSON.stringify(newVal)
        oldVal = JSON.stringify(oldVal)
      }
      if (newVal != oldVal) {
        return false
      }
    } catch (e) {
      return false
    }
  }
  return true
}

/**
 * Look at old and new metadata and only return what needs to be updated
 * For example if a old and new version perfectly match, then no change is
 * needed so it can be removed from the delete and the update lists. If an
 * updated has a short name that matches deleted but the filters are different
 * then the PI should be updated so it can be removed from the delete list
 * @param {Object} metaUpdates Object holding old and new metadata
 * @param {string} metaType Type of metadata to compare
 */
export function getChangesOnly(metaUpdates, metaType) {
  const { newMetadataKey, oldMetadataKey, matchFields } = config.comparisonConfig[metaType]
  const newMetadata = metaUpdates[newMetadataKey]
  const oldMetadata = metaUpdates[oldMetadataKey]
  const createUpdateMetaResult = []
  let deleteMetaResult = oldMetadata
  for (const metadata of newMetadata) {
    const oldMatch = oldMetadata.find(({ shortName }) => shortName === metadata.shortName)
    if (oldMatch) {
      // If there's an existing match, then remove it from the delete list
      deleteMetaResult = deleteMetaResult.filter(
        ({ shortName }) => shortName !== metadata.shortName
      )
      // If the PI existed in some form before, determine if it's been changed or not
      if (!metadataMatch(metadata, oldMatch, matchFields)) {
        // If not a full match, then PI only needs updating, so remove from delete list and add to createUpdate list
        // Also swap to use original PIs id
        metadata.id = oldMatch.id
        createUpdateMetaResult.push(metadata)
      }
    } else {
      // If no match for new metadata, then add to createUpdate list and nothing to remove
      createUpdateMetaResult.push(metadata)
    }
  }
  return { [newMetadataKey]: createUpdateMetaResult, [oldMetadataKey]: deleteMetaResult }
}

function calculatePis(rowId, dsUid, deInfo, piUid, coMaps, metadata, generatedPis, generatedMetadataPublicSharing) {
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
  piUpdates.createUpdatePis = createPiJSON(rowId, pi, deCode, combinedFilters, combinedUid, generatedMetadataPublicSharing)
  return getChangesOnly(piUpdates, 'programIndicators')
}

function calculatePiGroup(rowId, generatedPiGroups, piChanges, deShortName, generatedMetadataPublicSharing) {
  const { createUpdatePis, deletePis } = piChanges
  let piGroup = generatedPiGroups.find((piGroup) =>
    piGroup.name.includes(`piMappingGroup-${rowId}`)
  )
  if (piGroup) {
    piGroup.programIndicators = updateGroupMembers(piGroup, createUpdatePis, deletePis)
  } else {
    const uid = makeUid()
    piGroup = {
      name: `piMappingGroup-${rowId} Target DE: ${deShortName} (generated)`,
      id: uid,
      programIndicators: createUpdatePis.map((pi) => ({ id: pi.id })),
      sharing: {
        public: generatedMetadataPublicSharing
        },
    }
  }
  return piGroup
}

function generateInd(indUid, piSource, indTypeUid, deUid, generatedMetadataPublicSharing) {
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
    sharing: {
      public: generatedMetadataPublicSharing
      },
  }
}

function calculateInds(createUpdatePis, deletePis, generatedInds, indTypes, deUid, generatedMetadataPublicSharing) {
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
    createUpdateInds.push(generateInd(indUid, pi, indTypeUid, deUid), generatedMetadataPublicSharing)
  }
  for (const pi of deletePis) {
    const existingInd = generatedInds.filter((ind) => ind.description === pi.description)
    if (existingInd.length) {
      deleteInds.push({ id: existingInd[0].id })
    }
  }
  const indUpdates = { createUpdateInds, deleteInds }
  return getChangesOnly(indUpdates, 'indicators')
}

function calculateIndGroup(rowId, generatedIndGroups, indChanges, generatedMetadataPublicSharing) {
  const { createUpdateInds, deleteInds } = indChanges
  let indGroup = generatedIndGroups.find((indGroup) =>
    indGroup.name.includes(`indMappingGroup-${rowId}`)
  )

  if (indGroup) {
    indGroup.indicators = updateGroupMembers(indGroup, createUpdateInds, deleteInds)
  } else {
    const uid = makeUid()
    indGroup = {
      name:
        `indMappingGroup-${rowId} (/api/analytics/dataValueSet.json?dimension=dx:IN_GROUP-` +
        `${uid}&outputIdScheme=ATTRIBUTE:${config.indCustomAttr.id})  (generated)`,
      id: uid,
      indicators: createUpdateInds.map((ind) => ({ id: ind.id })),
      sharing: {
        public: generatedMetadataPublicSharing
        }, }
  }
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
  existingConfig
) {
  const {generateIndicators, generatedMetadataPublicSharing} = existingConfig || []
  const indTypes = baseMetadata.indicatorTypes.indicatorTypes
  const generatedPis = generatedMetadata.generatedPis.programIndicators
  const generatedPiGroups = generatedMetadata.generatedPiGroups.programIndicatorGroups
  const piChanges = calculatePis(rowId, dsUid, de, piUid, coMaps, baseMetadata, generatedPis, generatedMetadataPublicSharing)
  const { createUpdatePis, deletePis } = piChanges
  if (createUpdatePis.length === 0 && deletePis.length === 0) {
    return null
  }
  const des = baseMetadata.dataElements.dataElements.filter(({ id }) => id === de.id)
  const piGroup = calculatePiGroup(rowId, generatedPiGroups, piChanges, des[0].shortName, generatedMetadataPublicSharing)
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
    const indChanges = calculateInds(createUpdatePis, deletePis, generatedInds, indTypes, de.id, generatedMetadataPublicSharing)
    const { createUpdateInds, deleteInds } = indChanges
    const indGroup = calculateIndGroup(rowId, generatedIndGroups, indChanges, generatedMetadataPublicSharing)
    metaChanges.createUpdateMetadata.indicators = createUpdateInds
    metaChanges.createUpdateMetadata.indicatorGroups = [indGroup]
    metaChanges.deleteMetadata.indicators = deleteInds
    metaChanges.needsDelete = deletePis.length > 0 || deleteInds.length > 0
  }
  return metaChanges
}
