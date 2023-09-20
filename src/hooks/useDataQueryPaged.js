import { useState, useEffect } from 'react'

/**
 * Take a query with page and pageSize params and request the data one page
 * at a time, then return the full result
 * @param {Engine} engine App platform Engine instance for making requests to DHIS2
 * @param {Query} query App platform Query object for specifying query info
 * @param {Object} params Object holding the parameters for the query
 * @param {boolean} merge Determine if the pages should be merged
 * @return Generator which yields the paged results
 */
export async function getPaged(engine, query, params) {
  const responseKeyMap = {
    'tracker/events': 'instances',
  }
  const pageSize = params.pageSize || 50
  const queryKeys = Object.keys(query)
  if (queryKeys.length !== 1) {
    throw 'Only single endpoint queries are supported currently'
  }
  const queryKey = queryKeys[0]
  const endpoint = query[queryKey].resource
  const dataKey = responseKeyMap[endpoint] || endpoint
  const pageInfoParams = { ...params, pageSize: 1 }
  if ('paging' in (query[queryKey]?.params || {})) {
    query[queryKey].params.paging = true
  }
  const pageInfo = await engine.query(query, { variables: pageInfoParams })
  const pageData = pageInfo[queryKey]
  const total = pageData?.pager ? pageData.pager.total : pageData.total
  const totalPages = Math.ceil(total / pageSize)
  let mergedResult = []
  for (let i = 1; i <= totalPages; i++) {
    const pageParams = { ...params, page: i }
    const pageData = await engine.query(query, { variables: pageParams })
    mergedResult = [...mergedResult, ...pageData[queryKey][dataKey]]
  }
  return mergedResult
}

export default function useDataQueryPaged(engine, query, params) {
  const [data, setData] = useState(undefined)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const refetch = (currentParams = {}) => {
    setError(undefined)
    setLoading(true)
    const results = []
    const queryKeys = []
    const partialData = {}
    try {
      for (const queryKey in query) {
        queryKeys.push(queryKey)
        results.push(getPaged(engine, { [queryKey]: query[queryKey] }, currentParams, true))
      }
      Promise.all(results)
        .then((data) => {
          for (let i = 0; i < data.length; i++) {
            const resource = query[queryKeys[i]].resource
            partialData[queryKeys[i]] = { [resource]: data[i] }
          }
          console.log(partialData)
          setData(partialData)
        })
        .catch((err) => {
          setError(err)
        })
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

  return { data, loading, error, refetch }
}
