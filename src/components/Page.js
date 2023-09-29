import { useDataEngine, useDataMutation, useAlert } from '@dhis2/app-runtime'
import { addCodeMutation } from '../mutations'
import {
  Table,
  TableHead,
  TableRowHead,
  TableCellHead,
  TableBody,
  TableFoot,
  TableRow,
  TableCell,
  Button,
  Checkbox,
  InputField,
} from '@dhis2/ui'
import PropTypes from 'prop-types'
import React, { useState, useEffect } from 'react'
import classes from '../App.module.css'
import generateDataMapping from '../calculatePis'
import { config, ADDED_MISSING_CODE_MSG, ERROR_ADDING_CODE_MSG } from '../consts'
import { MappingGenerationError } from '../Errors'
import {
  makeUid,
  removeKey,
  sortByKeyValue,
  filterRowsByText,
  updateDes,
  getPiCount,
  generateSelectedMetadata,
} from '../utils'
import ActionButtons from './ActionButtons'
import ImportSummary from './ImportSummary'
import Mapping from './Mapping'
import Row from './Row'
import SortButton from './SortButton'
import './Page.css'
import useDataQueryPaged from '../hooks/useDataQueryPaged'

const dataStoreMutation = {
  resource: `dataStore/${config.dataStoreName}/metadata`,
  type: 'update',
  data: ({ data }) => data,
}

const createUpdateMutation = {
  resource: `metadata`,
  type: 'create',
  data: ({ data }) => data,
}

const deleteMutation = {
  resource: `metadata`,
  type: 'create',
  data: ({ data }) => data,
  params: {
    importStrategy: 'DELETE',
  },
}

function getGeneratedMeta(generateIndicators) {
  const generatedMeta = {
    generatedPis: {
      resource: 'programIndicators',
      params: {
        filter: 'name:like:rowId-',
        fields:
          'id,name,shortName,expression,filter,code,description,aggregateExportCategoryOptionCombo,aggregateExportAttributeOptionCombo,attributeValues',
      },
    },
    generatedPiGroups: {
      resource: 'programIndicatorGroups',
      params: {
        filter: 'name:like:rowId-',
        fields: 'id,name,programIndicators',
      },
    },
  }
  if (generateIndicators) {
    generatedMeta.generatedInds = {
      resource: 'indicators',
      params: {
        filter: 'name:like:rowId-',
        fields:
          'id,name,shortName,numeratorDescription,indicatorType,code,description,aggregateExportCategoryOptionCombo,aggregateExportAttributeOptionCombo,attributeValues',
      },
    }
    generatedMeta.generatedIndGroups = {
      resource: 'indicatorGroups',
      params: {
        filter: 'name:like:rowId-',
        fields: 'id,name,indicators',
      },
    }
  }
  return generatedMeta
}

const Page = ({ metadata, existingConfig }) => {
  const [dePiMaps, setDePiMaps] = useState(existingConfig.dePiMaps)
  const [orderedRowIds, setOrderedRowIds] = useState(Object.keys(dePiMaps))
  const [filteredRowIds, setFilteredRowIds] = useState(orderedRowIds)
  const [filterText, setFilterText] = useState('')
  const [rowsLoading, setRowsLoading] = useState(
    Object.keys(dePiMaps).reduce((acc, rowId) => ({ ...acc, [rowId]: false }), {})
  )
  const [rowsSelected, setRowsSelected] = useState(
    Object.keys(dePiMaps).reduce((acc, rowId) => ({ ...acc, [rowId]: false }), {})
  )
  const [allRowsSelected, setAllRowsSelected] = useState(false)
  const [coMaps, setCoMap] = useState(existingConfig.coMaps)
  const [showModal, setShowModal] = useState(false)
  const [showImportStatus, setShowImportStatus] = useState(false)
  const [importResults, setImportResults] = useState({
    success: null,
    message: 'Import not complete',
  })
  const [selectedRowData, setSelectedRowData] = useState({})
  const generatedMeta = getGeneratedMeta(existingConfig?.generateIndicators)
  const engine = useDataEngine()
  // const { data: generatedMetadata, refetch } = useDataQuery(generatedMeta)
  const {
    data: generatedMetadata,
    loading,
    progress,
    refetch: refetch,
  } = useDataQueryPaged(engine, generatedMeta, {
    pageSize: 5,
  })
  console.log('generatedMetadata: ', generatedMetadata)
  const { show } = useAlert(
    ({ msg }) => msg,
    ({ type }) => ({ [type]: true })
  )
  const [mutate] = useDataMutation(addCodeMutation, {
    onComplete: () => {
      show({ msg: ADDED_MISSING_CODE_MSG, type: 'warning' })
    },
    onError: () => {
      show({ msg: ERROR_ADDING_CODE_MSG, type: 'critical' })
    },
  })

  useEffect(() => {
    const newRows = Object.values(dePiMaps).filter((dePiMap) => 'newRow' in dePiMap)
    if (newRows.length > 0) {
      handleRowClick(newRows[0].rowId)
    }
    setOrderedRowIds(Object.keys(dePiMaps))
  }, [dePiMaps])

  useEffect(() => {
    setFilteredRowIds(filterRowsByText(dePiMaps, orderedRowIds, filterText))
  }, [orderedRowIds])

  const handleRowClick = (rowId) => {
    setSelectedRowData(dePiMaps[rowId])
    // setShowModal(true)
  }

  const handleClose = () => {
    const noBlankRows = {}
    for (const [key, values] of Object.entries(dePiMaps)) {
      if (values.newRow === undefined) {
        noBlankRows[key] = values
      }
    }
    setDePiMaps(noBlankRows)
    setShowModal(false)
  }

  const handleRowUpdate = (rowData, coMappings) => {
    delete rowData.newRow
    const newDePiMaps = Object.entries(dePiMaps).reduce((result, [id, mapInfo]) => {
      return { ...result, [id]: id === rowData.rowId ? rowData : mapInfo }
    }, {})
    const newCoMaps = { ...coMaps, ...coMappings }
    setDePiMaps(newDePiMaps)
    setCoMap(newCoMaps)
    setShowModal(false)
    engine.mutate(dataStoreMutation, {
      variables: { data: { ...existingConfig, dePiMaps: newDePiMaps, coMaps: newCoMaps } },
    })
  }

  const showDeleteError = () =>
    show({
      msg: `Error deleting mapping metadata, please remove references to this metadata in the system before deleting.`,
      type: 'critical',
    })

  const onDelete = async (rowId) => {
    const generatedPis = generatedMetadata.generatedPis.programIndicators
    const generatedPiGroups = generatedMetadata.generatedPiGroups.programIndicatorGroups
    const delPis = generatedPis.filter((pi) => pi.description.includes(rowId))
    const delPiGroups = generatedPiGroups.filter((piGroup) => piGroup.name.includes(rowId))
    const delData = {
      programIndicators: delPis,
      programIndicatorGroups: delPiGroups,
    }
    if (existingConfig?.generateIndicators) {
      const generatedInds = generatedMetadata.generatedInds.indicators
      const generatedIndGroups = generatedMetadata.generatedIndGroups.indicatorGroups
      const delInds = generatedInds.filter((ind) => ind.description.includes(rowId))
      const delIndGroups = generatedIndGroups.filter((indGroup) => indGroup.name.includes(rowId))
      delData.indicators = delInds
      delData.indicatorGroups = delIndGroups
    }

    const newDePiMaps = removeKey(dePiMaps, rowId)
    setRowsLoading(removeKey(rowsLoading, rowId))
    setRowsSelected(removeKey(rowsSelected, rowId))
    try {
      const res = await engine.mutate(deleteMutation, {
        variables: {
          data: delData,
        },
        onError: showDeleteError,
      })
      if (res.status === 'OK') {
        const dsRes = await engine.mutate(dataStoreMutation, {
          variables: { data: { ...existingConfig, dePiMaps: newDePiMaps, coMaps: coMaps } },
          onError: showDeleteError,
        })
        if (dsRes.status === 'OK') {
          setDePiMaps(newDePiMaps)
        } else {
          showDeleteError()
        }
      } else {
        showDeleteError()
      }
    } catch (err) {
      showDeleteError()
    }
  }

  const generateMappingComplete = (rowId) => {
    setRowsLoading({ ...rowsLoading, [rowId]: false })
    setShowImportStatus(true)
  }

  function generateSelected() {
    const rowIds = Object.keys(rowsSelected).filter((rowId) => rowsSelected[rowId])
    if (rowIds.length) {
      generateMapping(rowIds)
    } else {
      show({ msg: 'Please select at least one row to continue', type: 'warning' })
    }
  }

  const getCodeFromId = (des, deUid) => {
    for (const { id, code } of des) {
      if (id === deUid) {
        return code
      }
    }
  }

  const generateMapping = (rowIds) => {
    console.log(rowIds)
    // const multiRowUpdate = Array.isArray(rowIds)
    // const rowId = multiRowUpdate ? rowIds.shift() : rowIds
    // const { dsUid, deUid, piUid, coFilters: coRowFilters } = dePiMaps[rowId]
    // const deCode = getCodeFromId(metadata.dataElements.dataElements, deUid)
    // if (deCode === undefined) {
    //   mutate({ id: deUid, code: deUid })
    // }
    // metadata.dataElements.dataElements = updateDes(metadata.dataElements.dataElements, deUid)
    // const coFilters = { ...coMaps, ...coRowFilters }
    // setRowsLoading({ ...rowsLoading, [rowId]: true })
    // try {
    //   const results = generateDataMapping(
    //     rowId,
    //     dsUid,
    //     { id: deUid, code: deUid },
    //     piUid,
    //     coFilters,
    //     metadata,
    //     generatedMetadata,
    //     existingConfig?.generateIndicators
    //   )
    //   if (results === null) {
    //     show({
    //       msg: 'No updates detected',
    //       type: 'success',
    //     })
    //     setRowsLoading({ ...rowsLoading, [rowId]: false })
    //     if (multiRowUpdate && rowIds.length) {
    //       generateMapping(rowIds)
    //     }
    //     return
    //   }
    //   if (results.needsDelete) {
    //     engine.mutate(deleteMutation, {
    //       variables: { data: results.deleteMetadata },
    //       onError: () => {
    //         show({
    //           msg: `Error deleting previous mapping metadata, please remove references to this metadata in the system before regenerating`,
    //           type: 'critical',
    //         })
    //         setRowsLoading({ ...rowsLoading, [rowId]: false })
    //         if (multiRowUpdate && rowIds.length) {
    //           generateMapping(rowIds)
    //         }
    //       },
    //       onComplete: () => {
    //         engine.mutate(createUpdateMutation, {
    //           variables: { data: results.createUpdateMetadata },
    //           onError: () => {
    //             show({
    //               msg: 'Error importing new mapping metadata.',
    //               type: 'critical',
    //             })
    //             setRowsLoading({ ...rowsLoading, [rowId]: false })
    //             if (multiRowUpdate && rowIds.length) {
    //               generateMapping(rowIds)
    //             }
    //           },
    //           onComplete: () => {
    //             refetch()
    //             setImportResults({ success: true, message: 'Imported successfully' })
    //             generateMappingComplete(rowId)
    //             if (multiRowUpdate && rowIds.length) {
    //               generateMapping(rowIds)
    //             }
    //           },
    //         })
    //       },
    //     })
    //   } else {
    //     engine.mutate(createUpdateMutation, {
    //       variables: { data: results.createUpdateMetadata },
    //       onError: () => {
    //         show({
    //           msg: 'Error importing new mapping metadata.',
    //           type: 'critical',
    //         })
    //         setRowsLoading({ ...rowsLoading, [rowId]: false })
    //         if (multiRowUpdate && rowIds.length) {
    //           generateMapping(rowIds)
    //         }
    //       },
    //       onComplete: () => {
    //         refetch()
    //         setImportResults({ success: true, message: 'Imported successfully' })
    //         generateMappingComplete(rowId)
    //         if (multiRowUpdate && rowIds.length) {
    //           generateMapping(rowIds)
    //         }
    //       },
    //     })
    //   }
    // } catch (e) {
    //   if (e instanceof MappingGenerationError) {
    //     setImportResults({ success: false, message: e.message })
    //     generateMappingComplete(rowId)
    //     if (multiRowUpdate && rowIds.length) {
    //       generateMapping(rowIds)
    //     }
    //   } else {
    //     throw e
    //   }
    // }
  }

  const handleSelectRow = (rowId) => {
    setRowsSelected({ ...rowsSelected, [rowId]: !rowsSelected[rowId] })
  }

  const handleAllRowsSelected = () => {
    const newRowsSelected = {}
    for (const rowId in rowsSelected) {
      newRowsSelected[rowId] = !allRowsSelected
    }
    setRowsSelected(newRowsSelected)
    setAllRowsSelected(!allRowsSelected)
  }

  const addRow = () => {
    const rowId = `rowId-${makeUid()}`
    const newRow = {
      dsUid: '',
      dsName: '',
      deUid: '',
      deName: '',
      piUid: '',
      piName: '',
      rowId: rowId,
      newRow: true,
    }
    setRowsLoading({ ...rowsLoading, [rowId]: false })
    setRowsSelected({ ...rowsSelected, [rowId]: false })
    setDePiMaps({ ...dePiMaps, [rowId]: newRow })
  }

  const sortByColumn = (columnProp) => {
    setOrderedRowIds(sortByKeyValue(dePiMaps, columnProp))
  }

  const handleFilterChange = (e) => {
    setFilterText(e.value)
    setFilteredRowIds(filterRowsByText(dePiMaps, orderedRowIds, e.value))
  }

  const getSummaryInfo = (rowId) => {
    const { deUid, dsUid, coFilters } = dePiMaps[rowId]
    return { piCount: getPiCount(coFilters, deUid, dsUid, metadata) }
  }

  const handleSingleMetadataGeneration = async (rowid) => {
    const queries = {}
    if(rowid){
      queries.programIndicator = {}
      queries.programIndicator.resource = 'programIndicators';
      queries.programIndicator.params = {};
      queries.programIndicator.params.filter = `name:like:${rowid}`;
      queries.programIndicator.params.fields = 'id,name,shortName,expression,filter,code,description,aggregateExportCategoryOptionCombo,aggregateExportAttributeOptionCombo,attributeValues';

      queries.programIndicatorGroup = {}
      queries.programIndicatorGroup.resource = 'programIndicatorGroups';
      queries.programIndicatorGroup.params = {};
      queries.programIndicatorGroup.params.filter = `name:like:${rowid}`;
      queries.programIndicatorGroup.params.fields = 'id,name,programIndicators';

      // queries.indicator = {}
      // queries.indicator.resource = 'indicators';
      // queries.indicator.params = {};
      // queries.indicator.params.filter = `name:like:${rowid}`;
      // queries.indicator.params.fields = 'id,name,shortName,numeratorDescription,indicatorType,code,description,aggregateExportCategoryOptionCombo,aggregateExportAttributeOptionCombo,attributeValues';
    }

    const receiveQueryResults = await generateSelectedMetadata(queries, engine)

    // console.log(queries)
    console.log(receiveQueryResults)
  }

  return (
    <div className={classes.pageDiv}>
      {loading || !generatedMetadata ? (
        // TODO: Replace this with a loading bar based on the progress variable
        <p>Loading existing PIs {progress}</p>
      ) : (
        <>
          <h1>Program Dataset Connector</h1>
          <p>
            This application is used to link program indicators to a data elements in a specific
            data set. This is used to generate copies of the program indicator for each of the
            disaggregations assigned to the data element in the data set (including dissagregations
            on the data set itself)
          </p>
          <br />
          <br />
          {showModal && (
            <Mapping
              coMaps={coMaps}
              rowDataIn={selectedRowData}
              handleClose={handleClose}
              handleUpdate={handleRowUpdate}
              metadata={metadata}
            ></Mapping>
          )}
          {showImportStatus && (
            <ImportSummary
              handleClose={() => setShowImportStatus(false)}
              importResults={importResults}
            />
          )}
          <div className="versionText">Version: {process.env.REACT_APP_VERSION}</div>
          <InputField
            className={classes.filterInput}
            inputWidth={'20vw'}
            label="Filter"
            name="filter"
            value={filterText}
            onChange={(e) => handleFilterChange(e)}
          />
          <Table className={classes.dataTable}>
            <TableHead>
              <TableRowHead>
                <TableCellHead key="selected">
                  <Checkbox checked={allRowsSelected} onChange={handleAllRowsSelected} />
                </TableCellHead>
                <TableCellHead key="rowId">Row ID</TableCellHead>
                <TableCellHead key="dsName">
                  Data Set <SortButton handleClick={() => sortByColumn('dsName')} />
                </TableCellHead>
                <TableCellHead key="deName">
                  Data Element <SortButton handleClick={() => sortByColumn('deName')} />
                </TableCellHead>
                <TableCellHead key="piName">
                  Program Indicator <SortButton handleClick={() => sortByColumn('piName')} />
                </TableCellHead>
                <TableCellHead key="edit"></TableCellHead>
                <TableCellHead key="status"></TableCellHead>
              </TableRowHead>
            </TableHead>
            <TableBody>
              {Object.keys(dePiMaps).length > 0 &&
                filteredRowIds.map((key) => {
                  if (!(key in dePiMaps)) {
                    return
                  }
                  const { dsName, deName, piName } = dePiMaps[key]
                  return (
                    <Row
                      key={key}
                      dsName={dsName}
                      deName={deName}
                      piName={piName}
                      rowId={key}
                      handleClick={handleRowClick}
                      generateMapping={generateMapping}
                      handleDelete={onDelete}
                      loading={rowsLoading[key]}
                      rowSelected={rowsSelected[key]}
                      selectRow={handleSelectRow}
                      handleSingleMetadataGeneration={handleSingleMetadataGeneration}
                      getSummaryInfo={getSummaryInfo}
                    />
                  )
                })}
            </TableBody>
            <TableFoot>
              <TableRow>
                <TableCell colSpan="5">
                  <Button primary onClick={() => addRow()}>
                    Add row
                  </Button>
                </TableCell>
              </TableRow>
            </TableFoot>
          </Table>
          <ActionButtons addRow={addRow} generateSelected={generateSelected} />
        </>
      )}
    </div>
  )
}

Page.propTypes = {
  metadata: PropTypes.shape({
    dataSets: PropTypes.shape({ dataSets: PropTypes.array }).isRequired,
    dataElements: PropTypes.shape({ dataElements: PropTypes.array }).isRequired,
    programIndicators: PropTypes.shape({ programIndicators: PropTypes.array }).isRequired,
    dataStore: PropTypes.array.isRequired,
  }),
  existingConfig: PropTypes.shape({
    coMaps: PropTypes.objectOf(
      PropTypes.shape({ name: PropTypes.string.isRequired, filter: PropTypes.string.isRequired })
    ).isRequired,
    dePiMaps: PropTypes.objectOf(
      PropTypes.shape({
        deUid: PropTypes.string.isRequired,
        dsUid: PropTypes.string.isRequired,
        piUid: PropTypes.string.isRequired,
        rowId: PropTypes.string.isRequired,
        deName: PropTypes.string.isRequired,
        dsName: PropTypes.string.isRequired,
        piName: PropTypes.string.isRequired,
      })
    ).isRequired,
    generateIndicators: PropTypes.bool,
  }).isRequired,
}

export default Page
