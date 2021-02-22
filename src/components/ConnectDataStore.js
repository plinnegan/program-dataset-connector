import React from 'react'
import { useDataQuery } from '@dhis2/app-runtime'
import { config } from '../consts'
import Loader from './Loader'
import Error from './Error'
import Page from './Page'

const dataStoreQuery = {
  dataStore: {
    resource: `dataStore/${config.dataStoreName}/${config.dataStoreKey}`,
  },
}

const ConnectDataStore = ({ metadata }) => {
  const { loading, error, data } = useDataQuery(dataStoreQuery)

  return (
    <>
      {loading && <Loader>Loading existing configuration...</Loader>}
      {error && <Error>Error {error.message}</Error>}
      {data && <Page metadata={metadata} existingConfig={data.dataStore} />}
    </>
  )
}

export default ConnectDataStore
