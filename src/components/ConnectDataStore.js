import React, { useState, useEffect } from 'react'
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
  const [dataStoreUpdated, setDataStoreUpdated] = useState(false)

  useEffect(() => {
    const dePiMaps = data?.dataStore?.dePiMaps
    if (dePiMaps && Object.keys(dePiMaps).length > 0) {
      const dsUidNameMap = metadata.dataSets.dataSets.reduce((acc, { id, name }) => ({ ...acc, [id]: name }), {})
      const deUidNameMap = metadata.dataElements.dataElements.reduce(
        (acc, { id, name }) => ({ ...acc, [id]: name }),
        {}
      )
      const piUidNameMap = metadata.programIndicators.programIndicators.reduce(
        (acc, { id, name }) => ({ ...acc, [id]: name }),
        {}
      )
      const dePiMapsUpdated = {}
      for ({ rowId, dsUid, deUid, piUid } of Object.values(dePiMaps)) {
        dePiMapsUpdated[rowId] = {
          ...dePiMaps[rowId],
          dsName: dsUidNameMap[dsUid],
          deName: deUidNameMap[deUid],
          piName: piUidNameMap[piUid],
        }
      }
      data.dataStore.dePiMaps = dePiMapsUpdated
      setDataStoreUpdated(true)
    }
  }, [data])

  return (
    <>
      {(loading || !dataStoreUpdated) && <Loader>Loading existing configuration...</Loader>}
      {error && <Error>Error {error.message}</Error>}
      {data && dataStoreUpdated && <Page metadata={metadata} existingConfig={data.dataStore} />}
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
