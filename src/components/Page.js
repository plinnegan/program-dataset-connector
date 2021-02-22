import React, { useState } from 'react'
import { useDataEngine } from '@dhis2/app-runtime'
import { Table, TableHead, TableRowHead, TableCellHead, TableBody } from '@dhis2/ui'
import Row from './Row'
import Mapping from './Mapping'
import { config } from '../consts'
import classes from '../App.module.css'
import calculatePis from '../calculatePis'

const mutation = {
  resource: `dataStore/${config.dataStoreName}/metadata`,
  type: 'update',
  data: ({ data }) => data,
}

const Page = ({ metadata, existingConfig }) => {
  const [dePiMaps, setDePiMaps] = useState(existingConfig.dePiMaps)
  const [coMaps, setCoMap] = useState(existingConfig.coMaps)
  const [showModal, setShowModal] = useState(false)
  const [selectedRowData, setSelectedRowData] = useState({})
  const engine = useDataEngine()

  const handleRowClick = (rowId) => {
    setSelectedRowData(dePiMaps[rowId])
    setShowModal(true)
  }

  const handleClose = () => {
    setShowModal(false)
  }

  const handleRowUpdate = (rowData, coMappings) => {
    const newDePiMaps = Object.entries(dePiMaps).reduce((result, [id, mapInfo]) => {
      return { ...result, [id]: id === rowData.rowId ? rowData : mapInfo }
    }, {})
    const newCoMaps = { ...coMaps, ...coMappings }
    setDePiMaps(newDePiMaps)
    setCoMap(newCoMaps)
    setShowModal(false)
    engine.mutate(mutation, { variables: { data: { dePiMaps: newDePiMaps, coMaps: newCoMaps } } })
  }

  const generatePis = (rowId) => {
    const { dsUid, deUid, piUid } = dePiMaps[rowId]
    calculatePis(dsUid, deUid, piUid, coMaps, metadata)
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
          {Object.entries(dePiMaps).map(([key, { dsName, deName, piName }]) => (
            <Row
              key={key}
              dsName={dsName}
              deName={deName}
              piName={piName}
              rowId={key}
              handleClick={handleRowClick}
              generatePis={generatePis}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default Page
