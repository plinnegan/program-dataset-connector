export function getCosFromDe(deUid, metadata, coMaps) {
  const des = metadata.dataElements.dataElements.filter((de) => de.id === deUid)
  if (des.length) {
    const de = des[0]
    const cos = de.categoryCombo.categories.reduce(
      (acc, curr) => [...acc, ...curr.categoryOptions.map((co) => ({ uid: co.id, name: co.name }))],
      []
    )
    console.log(cos)
    const coMapList = cos.map(({ uid, name }) =>
      uid in coMaps ? { [uid]: coMaps[uid] } : { [uid]: { name: name, filter: '' } }
    )
    console.log(coMapList)
    return coMapList.reduce((acc, curr) => {
      return { ...acc, ...curr }
    }, {})
  }
}
