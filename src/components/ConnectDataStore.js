import React from 'react'
import PropTypes from 'prop-types'
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

ConnectDataStore.propTypes = {
  metadata: PropTypes.shape({
    dataSets: PropTypes.shape({ dataSets: PropTypes.array }).isRequired,
    dataElements: PropTypes.shape({ dataElements: PropTypes.array }).isRequired,
    programIndicators: PropTypes.shape({ programIndicators: PropTypes.array }).isRequired,
    dataStore: PropTypes.array.isRequired,
  }),
}

export default ConnectDataStore
