function getCosFromMetadata(metadata, coMaps) {
  const cos = metadata.categoryCombo.categories.reduce(
    (acc, curr) => [...acc, ...curr.categoryOptions.map((co) => ({ uid: co.id, name: co.name }))],
    []
  )
  const coMapList = cos.map(({ uid, name }) =>
    uid in coMaps ? { [uid]: coMaps[uid] } : { [uid]: { name: name, filter: '' } }
  )
  return coMapList.reduce((acc, curr) => {
    return { ...acc, ...curr }
  }, {})
}

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

export function makeUid() {
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  var uid = possible.charAt(Math.floor(Math.random() * (possible.length - 10)))
  for (var i = 0; i < 10; i++) {
    uid += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return uid
}
