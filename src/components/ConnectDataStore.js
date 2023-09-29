import { useDataQuery } from '@dhis2/app-runtime'
import PropTypes from 'prop-types'
import React from 'react'
import { config } from '../consts'
import Error from './Error'
import Loader from './Loader'
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
      {loading && <Loader>Loading existing mapping configuration...</Loader>}
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
