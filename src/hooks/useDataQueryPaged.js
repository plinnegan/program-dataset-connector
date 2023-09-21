import { useState, useEffect } from 'react'

const responseKeyMap = {
  'tracker/events': 'instances',
}

function getPageSize(query, queryKey, defaultSize = 50) {
  const queryPageSize = query[queryKey]?.params?.pageSize
  return queryPageSize || defaultSize
}

function pageNQuery(query, pageNumber) {
  const result = {}
  for (const queryKey in query) {
    const params = query[queryKey]?.params
    result[queryKey] = { ...query[queryKey], params: { ...params, page: pageNumber } }
  }
  return result
}

async function getItemCount(engine, query, params) {
  const queryKeys = Object.keys(query)
  if (queryKeys.length !== 1) {
    throw 'Only single endpoint queries are supported currently'
  }
  const queryKey = queryKeys[0]
  const pageInfoParams = { ...params, pageSize: 1 }
  if ('paging' in (query[queryKey]?.params || {})) {
    query[queryKey].params.paging = true
  }
  const pageInfo = await engine.query(query, { variables: pageInfoParams })
  const pageData = pageInfo[queryKey]
  const total = pageData?.pager ? pageData.pager.total : pageData.total
  return total
}

/**
 * Take a query with page and pageSize params and request the data one page
 * at a time, then return the full result
 * @param {Engine} engine App platform Engine instance for making requests to DHIS2
 * @param {Query} query App platform Query object for specifying query info
 * @param {Object} params Object holding the parameters for the query
 * @param {boolean} merge Determine if the pages should be merged
 * @return Generator which yields the paged results
 */
export async function* getPaged(engine, query, params) {
  const queryKeys = Object.keys(query)
  if (queryKeys.length !== 1) {
    throw 'Only single endpoint queries are supported currently'
  }
  const queryKey = queryKeys[0]
  const pageSize = getPageSize(query, queryKey)
  const endpoint = query[queryKey].resource
  const dataKey = responseKeyMap[endpoint] || endpoint
  const total = await getItemCount(engine, query, params)
  const totalPages = Math.ceil(total / pageSize)
  for (let i = 1; i <= totalPages; i++) {
    const pageQuery = pageNQuery(query, i)
    const pageData = await engine.query(pageQuery, { variables: params })
    yield pageData[queryKey][dataKey]
  }
}

async function getTotalPages(engine, query, params) {
  let totalPages = 0
  for (const queryKey in query) {
    const singleQueryTotal = await getItemCount(engine, { [queryKey]: query[queryKey] }, params)
    const pageSize = getPageSize(query, queryKey)
    totalPages += Math.ceil(singleQueryTotal / pageSize)
  }
  return totalPages
}

export default function useDataQueryPaged(engine, query, params) {
  const [data, setData] = useState(undefined)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [progress, setProgress] = useState(0)

  console.log('Progress: ', progress)

  const refetch = async (currentParams = {}) => {
    setError(undefined)
    setLoading(true)
    const partialData = {}
    try {
      let pagesProcessed = 0
      const totalPages = await getTotalPages(engine, query, params)
      for (const queryKey in query) {
        const resource = query[queryKey].resource
        partialData[queryKey] = { [resource]: [] }
        for await (const data of getPaged(engine, { [queryKey]: query[queryKey] }, currentParams)) {
          pagesProcessed++
          setProgress(pagesProcessed / totalPages)
          partialData[queryKey][resource].push(...data)
        }
        // results.push(getPaged(engine, { [queryKey]: query[queryKey] }, currentParams, true))
      }
      setData(partialData)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!params?.lazy) {
      refetch(params)
    }
  }, [])

  return { data, loading, error, progress, refetch }
}
