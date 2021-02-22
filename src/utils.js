function getCosFromMetadata(metadata, coMaps) {
  const cos = metadata.categoryCombo.categories.reduce(
    (acc, curr) => [...acc, ...curr.categoryOptions.map((co) => ({ uid: co.id, name: co.name }))],
    []
  )
  const coMapList = cos.map(({ uid, name }) =>
    uid in coMaps ? { [uid]: coMaps[uid] } : { [uid]: { name: name, filter: '' } }
  )
  console.log(coMapList)
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
