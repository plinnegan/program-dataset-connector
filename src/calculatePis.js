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
  const filter = pi.filter.trim()
  const isBracketed = filter[0] === '(' && filter[filter.length - 1] === ')'
  return isBracketed ? filter : `(${filter})`
}

function getCatFilters(metadata, coMap) {
  return metadata.categoryCombo.categories.reduce((acc, curr) => {
    console.log('Curr: ', curr)
    const cos = curr.categoryOptions.map((co) => coMap[co.id])
    console.log('cos: ', cos)
    return { ...acc, [curr.id]: cos }
  }, {})
}

function getFiltersByCat(dsUid, deUid, coMaps, dataSets, dataElements) {
  const ds = getByUid(dsUid, dataSets)
  const de = getByUid(deUid, dataElements)
  return { ...getCatFilters(ds, coMaps), ...getCatFilters(de, coMaps) }
}

function multiplyFilters(startingFilters, newFilters) {
  const result = []
  for (const filter of startingFilters) {
    for (const newFilter of newFilters) {
      result.push(`${filter} && ${newFilter}`)
    }
  }
  return result
}

function generateFilters(piFilter, filtersByCat) {
  let result = [piFilter]
  for (const catUid in filtersByCat) {
    const catFilters = filtersByCat[catUid]
    result = multiplyFilters(result, catFilters)
  }
  return result
}

export default function calculatePis(dsUid, deUid, piUid, coMaps, metadata) {
  const { dataSets, dataElements, programIndicators } = {
    ...metadata.dataSets,
    ...metadata.dataElements,
    ...metadata.programIndicators,
  }
  const baseFilter = getBaseFilter(piUid, programIndicators)
  const filtersByCat = getFiltersByCat(dsUid, deUid, coMaps, dataSets, dataElements)
  const filters = generateFilters(baseFilter, filtersByCat)
}
