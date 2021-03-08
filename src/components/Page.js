import React, { useState, useEffect } from 'react'
import { useDataEngine, useDataQuery } from '@dhis2/app-runtime'
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
  AlertBar,
} from '@dhis2/ui'
import Row from './Row'
import Mapping from './Mapping'
import { config } from '../consts'
import classes from '../App.module.css'
import { calculatePis, calculateInds } from '../calculateInds'
import { makeUid, getCosFromRow } from '../utils'

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

const generatedMeta = {
  generatedPis: {
    resource: 'programIndicators',
    params: {
      filter: 'name:like:(generated)',
      fields: 'id,code,description,aggregateExportCategoryOptionCombo,aggregateExportAttributeOptionCombo',
    },
  },
  generatedInds: {
    resource: 'indicators',
    params: {
      filter: 'name:like:(generated)',
      fields: 'id,code,description,aggregateExportCategoryOptionCombo,aggregateExportAttributeOptionCombo',
    },
  },
}

const Page = ({ metadata, existingConfig }) => {
  const [dePiMaps, setDePiMaps] = useState(existingConfig.dePiMaps)
  const [coMaps, setCoMap] = useState(existingConfig.coMaps)
  const [showModal, setShowModal] = useState(false)
  const [selectedRowData, setSelectedRowData] = useState({})
  const { loading, data, refetch } = useDataQuery(generatedMeta)
  const [showWarning, setShowWarning] = useState(false)
  const [warning, setWarning] = useState('')
  const engine = useDataEngine()

  useEffect(() => {
    const newRows = Object.values(dePiMaps).filter((dePiMap) => 'newRow' in dePiMap)
    if (newRows.length > 0) {
      handleRowClick(newRows[0].rowId)
    }
  }, [dePiMaps])

  const handleRowClick = (rowId) => {
    setSelectedRowData(dePiMaps[rowId])
    setShowModal(true)
  }

  const handleClose = () => {
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
    engine.mutate(dataStoreMutation, { variables: { data: { dePiMaps: newDePiMaps, coMaps: newCoMaps } } })
  }

  const onDelete = (rowId) => {
    const newDePiMaps = Object.entries(dePiMaps).reduce((acc, [id, mapInfo]) => {
      if (id === rowId) {
        return acc
      } else {
        return { ...acc, [id]: mapInfo }
      }
    }, {})
    setDePiMaps(newDePiMaps)
    engine.mutate(dataStoreMutation, { variables: { data: { dePiMaps: newDePiMaps, coMaps: coMaps } } })
  }

  const generateInds = (rowId) => {
    const { dsUid, deUid, piUid } = dePiMaps[rowId]
    const rowCoMapping = getCosFromRow(dsUid, deUid, metadata, coMaps)
    const rowFilters = Object.values(rowCoMapping).reduce((acc, { filter }) => [...acc, filter], [])
    if (rowFilters.includes('')) {
      setWarning('Cannot generate PIs, missing filters')
      setShowWarning(true)
      return
    }
    const { programIndicators: generatedPis, indicators: generatedInds } = {
      ...data.generatedPis,
      ...data.generatedInds,
    }
    const { createUpdatePis, deletePis } = calculatePis(rowId, dsUid, deUid, piUid, coMaps, metadata, generatedPis)
    const indTypes = metadata.indicatorTypes.indicatorTypes
    const { createUpdateInds, deleteInds } = calculateInds(createUpdatePis, deletePis, generatedInds, indTypes)
    const createUpdatePayload = { ...createUpdatePis, ...createUpdateInds }
    const deletePayload = { ...deletePis, ...deleteInds }
    if (deletePayload.programIndicators.length || deletePayload.indicators.length) {
      engine.mutate(deleteMutation, {
        variables: { data: deletePayload },
        onComplete: () => {
          engine.mutate(createUpdateMutation, {
            variables: { data: createUpdatePayload },
            onComplete: refetch,
          })
        },
      })
    } else {
      engine.mutate(createUpdateMutation, {
        variables: { data: createUpdatePayload },
        onComplete: refetch,
      })
    }
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
    setDePiMaps({ ...dePiMaps, [rowId]: newRow })
  }

  return (
    <div className={classes.pageDiv}>
      <h1>Event to Aggregate Mappings</h1>
      <p>
        This application is used to link program indicators to a data elements in a specific data set. This is used to
        generate copies of the program indicator for each of the disaggregations assigned to the data element in the
        data set (including dissagregations on the data set itself)
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
      <Table>
        <TableHead>
          <TableRowHead>
            <TableCellHead key="dsName">Data Set</TableCellHead>
            <TableCellHead key="deName">Data Element</TableCellHead>
            <TableCellHead key="piName">Program Indicator</TableCellHead>
            <TableCellHead key="edit"></TableCellHead>
          </TableRowHead>
        </TableHead>
        <TableBody>
          {Object.keys(dePiMaps).length > 0 &&
            Object.entries(dePiMaps).map(([key, { dsName, deName, piName }]) => (
              <Row
                key={key}
                dsName={dsName}
                deName={deName}
                piName={piName}
                rowId={key}
                handleClick={handleRowClick}
                generateInds={generateInds}
                handleDelete={onDelete}
                disabled={loading}
              />
            ))}
        </TableBody>
        <TableFoot>
          <TableRow>
            <TableCell colSpan="4">
              <Button primary onClick={() => addRow()}>
                Add row
              </Button>
            </TableCell>
          </TableRow>
        </TableFoot>
      </Table>
      {showWarning && (
        <AlertBar icon permanent warning onHidden={(e) => setShowWarning(false)}>
          {warning}
        </AlertBar>
      )}
      <Button primary className={classes.newRowBtn} onClick={() => addRow()}>
        Add row
      </Button>
    </div>
  )
}

export default Page
