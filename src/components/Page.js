import React, { useState, useEffect } from 'react'
import { useDataEngine } from '@dhis2/app-runtime'
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
import calculatePis from '../calculatePis'
import { makeUid, getCosFromRow } from '../utils'

const dataStoreMutation = {
  resource: `dataStore/${config.dataStoreName}/metadata`,
  type: 'update',
  data: ({ data }) => data,
}

const createUpdatePisMutation = {
  resource: `metadata`,
  type: 'create',
  data: ({ data }) => data,
}

const deletePisMutation = {
  resource: `metadata`,
  type: 'create',
  data: ({ data }) => data,
  params: {
    importStrategy: 'DELETE',
  },
}

const Page = ({ metadata, existingConfig }) => {
  const [dePiMaps, setDePiMaps] = useState(existingConfig.dePiMaps)
  const [coMaps, setCoMap] = useState(existingConfig.coMaps)
  const [showModal, setShowModal] = useState(false)
  const [selectedRowData, setSelectedRowData] = useState({})
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

  const generatePis = (rowId) => {
    const { dsUid, deUid, piUid } = dePiMaps[rowId]
    const rowCoMapping = getCosFromRow(dsUid, deUid, metadata, coMaps)
    const rowFilters = Object.values(rowCoMapping).reduce((acc, { filter }) => [...acc, filter], [])
    if (rowFilters.includes('')) {
      setWarning('Cannot generate PIs, missing filters')
      setShowWarning(true)
      return
    }
    const { createUpdatePis, deletePis } = calculatePis(dsUid, deUid, piUid, coMaps, metadata)
    console.log('createUpdatePis', createUpdatePis)
    console.log('deletePis', deletePis)
    engine.mutate(createUpdatePisMutation, { variables: { data: createUpdatePis } })
    engine.mutate(deletePisMutation, { variables: { data: deletePis } })
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
                generatePis={generatePis}
                handleDelete={onDelete}
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
