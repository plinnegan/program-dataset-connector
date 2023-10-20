import { useState, useEffect } from 'react'

const responseKeyMap = {
  'tracker/events': 'instances',
}

function endpointNotPaged(endpoint) {
  const noPagingSupport = ['dataStore']
  return noPagingSupport.some((noPagingSupport) => endpoint.includes(noPagingSupport))
}

function getPageSize(query, queryKey, defaultSize = 50) {
  const queryPageSize = query[queryKey]?.params?.pageSize
  return queryPageSize || defaultSize
}

function pageNQuery(query, pageNumber) {
  const result = {}
  for (const queryKey in query) {
    const params = query[queryKey]?.params
    let pageParams = params
    if (typeof params === 'function') {
      pageParams = (pageParams) => ({ ...params(pageParams), page: pageNumber })
    } else {
      pageParams = { ...params, page: pageNumber }
    }
    console.log('pageParams: ', pageParams)
    result[queryKey] = { ...query[queryKey], params: pageParams }
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
  let totalPages = 1
  if (!endpointNotPaged(endpoint)) {
    const total = await getItemCount(engine, query, params)
    totalPages = Math.ceil(total / pageSize)
  }
  for (let i = 1; i <= totalPages; i++) {
    const pageQuery = pageNQuery(query, i)
    const pageData = await engine.query(pageQuery, { variables: params })
    if (!(queryKey in pageData)) {
      yield pageData
    } else if (!(dataKey in pageData[queryKey])) {
      yield pageData[queryKey]
    } else {
      yield pageData[queryKey][dataKey]
    }
  }
}

async function getTotalPages(engine, query, params, setProgress = () => {}) {
  let totalPages = 0
  const totalEndpoints = Object.keys(query).length
  let currentQuery = 1
  for (const queryKey in query) {
    if (endpointNotPaged(queryKey)) {
      console.log('Single page for no pagination support endpoint: ', queryKey)
      totalPages += 1
    } else {
      const singleQueryTotal = await getItemCount(engine, { [queryKey]: query[queryKey] }, params)
      setProgress((0.1 * currentQuery) / totalEndpoints)
      currentQuery++
      const pageSize = getPageSize(query, queryKey)
      totalPages += Math.ceil(singleQueryTotal / pageSize)
    }
  }
  return totalPages
}

export default function useDataQueryPaged(engine, query, initParams) {
  const [data, setData] = useState(undefined)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [progress, setProgress] = useState(0)

  const refetch = async (currentParams = {}, callbacks) => {
    const params = { ...initParams, ...currentParams }
    const { onComplete, onError } = callbacks || {}
    setError(undefined)
    setLoading(true)
    const partialData = {}
    try {
      let pagesProcessed = 0
      const totalPages = await getTotalPages(engine, query, params, setProgress)
      for (const queryKey in query) {
        const resource = query[queryKey].resource
        partialData[queryKey] = { [resource]: [] }
        for await (const data of getPaged(engine, { [queryKey]: query[queryKey] }, params)) {
          pagesProcessed++
          setProgress(0.1 + 0.9 * (pagesProcessed / totalPages))
          partialData[queryKey][resource].push(...data)
        }
      }
      setData(partialData)
      onComplete && onComplete(partialData)
    } catch (err) {
      setError(err)
      onError && onError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!initParams?.lazy) {
      refetch(initParams)
    }
  }, [])

  return { data, loading, error, progress, refetch }
}
