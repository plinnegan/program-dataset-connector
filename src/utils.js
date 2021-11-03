/**
 *
 * @param {object} metadata JSON object for either a data element or data set
 * @param {object} coMaps JSON object with structure {key1: {name: ..., filter...}, key2: {...}, ...}
 * @returns {object} Object to map from the category options against the DE or DS to the filters defined in coMaps
 */
export function getCosFromMetadata(metadata, coMaps) {
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
 * Find the relevant COs associated with the provided DE and DS, and return the filter mappings for them
 * @param {string} dsUid DHIS2 uid representing for a data set
 * @param {string} deUid DHIS2 uid representing for a data element
 * @param {object} metadata JSON object for either a data element or data set
 * @param {object} coMaps JSON object with structure {key1: {name: ..., filter...}, key2: {...}, ...}
 * @returns {object} Object to map from the category options against the DE or DS to the filters defined in coMaps
 */
export function getCosFromRow(dsUid, deUid, metadata, coMaps) {
  const des = metadata.dataElements.dataElements.filter((de) => de.id === deUid)
  let desCos = null
  const dss = metadata.dataSets.dataSets.filter((ds) => ds.id === dsUid)
  let dsCos = null
  if (des.length) {
    const de = des[0]
    desCos = getCosFromMetadata(de, coMaps)
  }
  if (dss.length) {
    const ds = dss[0]
    dsCos = getCosFromMetadata(ds, coMaps)
  }
  return { ...desCos, ...dsCos }
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
