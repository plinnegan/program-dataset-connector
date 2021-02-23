import React, { useEffect } from 'react'
import { useDataQuery, useDataMutation } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import classes from './App.module.css'
import ConnectDataStore from './components/ConnectDataStore'
import Loader from './components/Loader'
import Error from './components/Error'
import { config } from './consts'

const query = {
  dataSets: {
    resource: 'dataSets',
    params: {
      fields:
        'id,name,dataSetElements(dataElement(id)),categoryCombo(id,categoryOptionCombos(id,categoryOptions(id,name)),categories(id,categoryOptions(id,name)))',
      paging: 'false',
    },
  },
  dataElements: {
    resource: 'dataElements',
    params: {
      fields:
        'id,name,categoryCombo(id,categoryOptionCombos(id,categoryOptions(id,name)),categories(id,categoryOptions(id,name)))',
      filter: 'domainType:eq:AGGREGATE',
      paging: 'false',
    },
  },
  programIndicators: {
    resource: 'programIndicators',
    params: { filter: 'name:!like:(generated)', fields: ':owner', paging: 'false' },
  },
  generatedPis: {
    resource: 'programIndicators',
    params: {
      filter: 'name:like:(generated)',
      fields: 'id,code,aggregateExportCategoryOptionCombo,aggregateExportAttributeOptionCombo',
    },
  },
  dataStore: {
    resource: 'dataStore',
  },
}

const mutation = {
  resource: `dataStore/${config.dataStoreName}/metadata`,
  type: 'create',
  data: { piDeMaps: {}, coMap: {} },
}

const MyApp = () => {
  const { loading, error, data: metadata } = useDataQuery(query)
  const [mutate] = useDataMutation(mutation)
  const { dataStoreName } = config

  useEffect(() => {
    if (metadata && !metadata.dataStore.includes(dataStoreName)) {
      mutate()
    }
  }, [metadata])

  return (
    <div className={classes.container}>
      {loading && <Loader>Loading...</Loader>}
      {error && <Error>Error {error.message}</Error>}
      {metadata && metadata.dataStore.includes(dataStoreName) ? (
        <ConnectDataStore metadata={metadata}></ConnectDataStore>
      ) : (
        <Loader>Setting up datastore...</Loader>
      )}
    </div>
  )
}

export default MyApp
