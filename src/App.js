import { useDataQuery, useDataMutation } from '@dhis2/app-runtime'
import React, { useState, useEffect } from 'react'
import classes from './App.module.css'
import ConnectDataStore from './components/ConnectDataStore'
import Error from './components/Error'
import Loader from './components/Loader'
import { config } from './consts'

const ccInfo =
  'categoryCombo(id,categoryOptionCombos(id,name,categoryOptions(id,name,shortName)),categories(id,categoryOptions(id,name)))'

const query = {
  dataSets: {
    resource: 'dataSets',
    params: {
      fields: `id,name,dataSetElements(dataElement(id)),${ccInfo}`,
      paging: 'false',
    },
  },
  dataElements: {
    resource: 'dataElements',
    params: {
      fields: `id,name,code,shortName,dataSetElements(dataSet,${ccInfo}),${ccInfo}`,
      filter: 'domainType:eq:AGGREGATE',
      paging: 'false',
    },
  },
  programIndicators: {
    resource: 'programIndicators',
    params: {
      filter: ['name:!like:rowId-', 'name:!like:(generated)', 'name:!$like:zzDel'],
      fields: ':owner',
      paging: 'false',
    },
  },
  dataStore: {
    resource: 'dataStore',
  },
  mappingAttr: {
    resource: 'attributes',
    params: {
      filter: 'id:eq:b8KbU93phhz',
      fields: 'id,indicatorAttribute',
    },
  },
  indicatorTypes: {
    resource: 'indicatorTypes',
    params: {
      filter: 'factor:eq:1',
      fields: 'id',
    },
  },
}

const dataStoreMutation = {
  resource: `dataStore/${config.dataStoreName}/metadata`,
  type: 'create',
  data: { dePiMaps: {}, coMaps: {}, generateIndicators: false },
}

const indTypeMutation = {
  resource: 'metadata',
  type: 'create',
  data: { indicatorTypes: [config.indType] },
}

const attrMutation = {
  resource: 'metadata',
  type: 'create',
  data: { attributes: [config.indCustomAttr] },
}

const MyApp = () => {
  const { loading, error, data: metadata } = useDataQuery(query)
  const [dataStoreSetup, setDataStoreSetup] = useState(false)
  const [mutateIndType] = useDataMutation(indTypeMutation)
  const [mutateDataStore] = useDataMutation(dataStoreMutation, {
    onComplete: () => setDataStoreSetup(true),
  })
  const [mutateAttribute] = useDataMutation(attrMutation)
  const { dataStoreName } = config

  useEffect(() => {
    if (metadata) {
      if (!metadata.dataStore.includes(dataStoreName)) {
        mutateDataStore()
      }
      if (metadata.mappingAttr.attributes.length === 0) {
        mutateAttribute()
      } else {
        const attr = metadata.mappingAttr.attributes[0]
        if (!attr?.indicatorAttribute) {
          console.log('Custom attribute exists but is missing from indicators')
          mutateAttribute()
        }
      }
      if (metadata.indicatorTypes.indicatorTypes.length === 0) {
        mutateIndType()
      }
    }
  }, [metadata])

  return (
    <div className={classes.container}>
      {loading && <Loader>Loading...</Loader>}
      {error && <Error>Error {error.message}</Error>}
      {metadata && (metadata.dataStore.includes(dataStoreName) || dataStoreSetup) ? (
        <ConnectDataStore metadata={metadata}></ConnectDataStore>
      ) : (
        <Loader>Setting up datastore...</Loader>
      )}
    </div>
  )
}

export default MyApp
