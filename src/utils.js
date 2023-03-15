/**
 *
 * @param {object} metadata JSON object for either a data element or data set
 * @param {object} coMaps JSON object with structure {key1: {name: ..., filter...}, key2: {...}, ...}
 * @returns {object} Object to map from the category options against the DE or DS to the filters defined in coMaps
 */
export function getCosFiltersFromMetadata(metadata, coMaps) {
  const cos = metadata.categoryCombo.categories.reduce(
    (acc, curr) => [...acc, ...curr.categoryOptions.map((co) => ({ uid: co.id, name: co.name }))],
    []
  )
  const withoutDefault = cos.filter(({ name }) => name !== 'default')
  const coMapList = withoutDefault.map(({ uid, name }) => {
    if (uid in coMaps) {
      return { [uid]: { ...coMaps[uid], name: name } }
    } else {
      return { [uid]: { name: name, filter: '' } }
    }
  })
  return coMapList.reduce((acc, curr) => {
    return { ...acc, ...curr }
  }, {})
}

/**
 * Check if the selected data set has a CC override for the selected data element
 * if so return the CC override, otherwise null
 * @param {string} deUid Data element to check for CC overrides
 * @param {Array} dsArr Array of data sets to check for DE in
 * @returns CC Override if found, otherwise null
 */
export function getCcOverride(de, dsUid) {
  if (!('dataSetElements' in de)) {
    return null
  }
  const dses = de.dataSetElements.filter((dse) => dse.dataSet.id === dsUid)
  if (dses.length > 0) {
    const dse = dses[0]
    if ('categoryCombo' in dse) {
      return { categoryCombo: dse.categoryCombo }
    } else {
      return null
    }
  } else {
    console.warn(`Data set: ${dsUid} not found in the data set elements for ${de.id}`)
    return null
  }
}

/**
 * Get the raw COCs on the metadata item, including overrides
 * @param {Object} metaItem Data element or data set to get the COCs from
 * @param {Object} config Config options for example where to look for CC
 * @returns Array of category option combos
 */
export function getCc(metaItem, config) {
  if ('dsUid' in config) {
    const ccOverride = getCcOverride(metaItem, config.dsUid)
    if (ccOverride && 'categoryCombo' in ccOverride) {
      return ccOverride.categoryCombo
    } else {
      return metaItem.categoryCombo
    }
  }
  return metaItem.categoryCombo
}

/**
 * Find the relevant COs associated with the provided DE and DS, and return the filter mappings for them
 * @param {string} dsUid DHIS2 uid representing for a data set
 * @param {string} deUid DHIS2 uid representing for a data element
 * @param {object} metadata JSON object for either a data element or data set
 * @param {object} coMaps JSON object with structure {key1: {name: ..., filter...}, key2: {...}, ...}
 * @returns {object} Object to map from the category options against the DE or DS to the filters defined in coMaps
 */
export function getCosFromRow(dsUid, deUid, metadata, coMaps) {
  const de = metadata.dataElements.dataElements.find((de) => de.id === deUid)
  let desCosFilters = null
  const ds = metadata.dataSets.dataSets.find((ds) => ds.id === dsUid)
  let dsCosFilters = null
  if (de) {
    const ccOverride = getCcOverride(de, dsUid)
    if (ccOverride) {
      desCosFilters = getCosFiltersFromMetadata(ccOverride, coMaps)
    } else {
      desCosFilters = getCosFiltersFromMetadata(de, coMaps)
    }
  }
  if (ds) {
    dsCosFilters = getCosFiltersFromMetadata(ds, coMaps)
  }
  return { ...desCosFilters, ...dsCosFilters }
}

/**
 * Return a randomly generated uid
 * @returns {string} String matching the regex /[a-Z][a-Z0-9]{10}/
 */
export function makeUid() {
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  var uid = possible.charAt(Math.floor(Math.random() * (possible.length - 10)))
  for (var i = 0; i < 10; i++) {
    uid += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return uid
}

/**
 * Remove key from state
 */
export function removeKey(obj, key) {
  return Object.entries(obj).reduce((acc, [thisKey, value]) => {
    if (key === thisKey) {
      return acc
    } else {
      return { ...acc, [thisKey]: value }
    }
  }, {})
}

/**
 * Return a copy of an object with the top level keys sorted by the
 * @param {Object} obj: Object with keys to be sorted
 * @param {*} key
 */
export function sortByKeyValue(obj, key) {
  const valKeyMap = Object.entries(obj).reduce((acc, [topKey, val]) => {
    if (val[key] in acc) {
      return { ...acc, [val[key]]: [...acc[val[key]], topKey] }
    } else {
      return { ...acc, [val[key]]: [topKey] }
    }
  }, {})
  const sortedValArr = Object.values(obj)
    .map((val) => val[key])
    .sort()
  let result = []
  const processedVals = []
  for (const val of sortedValArr) {
    if (!processedVals.includes(val)) {
      result = [...result, ...valKeyMap[val]]
      processedVals.push(val)
    }
  }
  return result
}

/**
 * Return only the rowIds of the mappings which contain the given string
 * @param {Object} dePiMaps Object holding all mappings
 * @param {String} text Test string to filter on
 */
export function filterRowsByText(dePiMaps, orderedRowIds, text) {
  if (text === '') {
    return orderedRowIds
  }
  const textLower = text.toLocaleLowerCase()
  const result = []
  for (const rowId of orderedRowIds) {
    const { dsName, deName, piName } = dePiMaps[rowId]
    const dsLower = dsName.toLocaleLowerCase()
    const deLower = deName.toLocaleLowerCase()
    const piLower = piName.toLocaleLowerCase()
    if (dsLower.includes(textLower) || deLower.includes(textLower) || piLower.includes(textLower)) {
      result.push(rowId)
    }
  }
  return result
}

/**
 * Order COs in COC to match order in COC name
 * @param {Object} coc Object representing a category option combo in the system
 * @returns {Object} Object representing a COC, but with the category options sorted
 */
export function orderCos(coc) {
  const { name, id, categoryOptions } = coc
  const indexes = {}
  for (const co of categoryOptions) {
    indexes[name.indexOf(co.name)] = co // Store each co name by it's location in the coc name
  }
  // Use the fact that js auto orders numerical keys in objects to sort automatically
  return { id, name, categoryOptions: Object.values(indexes) }
}

/**
 * Get the base url to use for custom requests
 * @param {String} appUrl Url the app is currently running on
 * @returns {String} Url ro use for api requests
 */
export function getBaseUrl(appUrl) {
  if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
    return 'http://localhost:8080'
  } else {
    return appUrl
  }
}

/**
 * Update the array of data elements by adding the code to the specified de
 * @param {Array} availableDes Array of data elements
 * @param {String} deUid Data element uid to be updated
 * @returns Array of data elements with the code updated
 */
export const updateDes = (availableDes, deUid) => {
  const desOut = availableDes.map((de) => {
    if (de.id === deUid) {
      de.code = deUid
    }
    return de
  })
  return desOut
}

function getCosByCat(items, itemUid, mapCoUids, config) {
  const counts = []
  for (const item of items) {
    if (item.id === itemUid) {
      const cc = getCc(item, config)
      for (const cat of cc.categories) {
        let catCount = 0
        for (const co of cat.categoryOptions) {
          if (mapCoUids.includes(co.id)) {
            catCount += 1
          }
        }
        counts.push(Math.max(1, catCount))
      }
    }
  }
  return counts
}

/**
 * Count how many PIs are expected to be generated
 * @param {Object} coMaps Object with key:value as coUid:coFilter
 * @param {String} deUid DHIS2 uid for the target data element
 * @param {String} dsUid DHIS2 uid for the target data set
 * @param {Object} metadata Holding all DE and DS info for the system
 * @returns
 */
export function getPiCount(coMaps, deUid, dsUid, metadata) {
  const des = metadata.dataElements.dataElements
  const ds = metadata.dataSets.dataSets
  const coMapUids = Object.keys(coMaps).filter(
    (coUid) => coMaps[coUid].filter && coMaps[coUid].filter.length > 0
  )
  const cosByCat = [
    ...getCosByCat(des, deUid, coMapUids, { dsUid }),
    ...getCosByCat(ds, dsUid, coMapUids, {}),
  ]
  return cosByCat.reduce((acc, curr) => Math.max(1, curr) * acc, 1)
}
