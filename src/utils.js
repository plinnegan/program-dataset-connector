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
  const coMapList = withoutDefault.map(({ uid, name }) =>
    uid in coMaps ? { [uid]: coMaps[uid] } : { [uid]: { name: name, filter: '' } }
  )
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
