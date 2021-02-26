import React, { useState, useEffect } from 'react'
import { Modal, ModalTitle, ModalContent, ModalActions, ButtonStrip, Button } from '@dhis2/ui'
import { getCosFromRow } from '../utils'
import RowFieldSelect from './RowFieldSelect'
import CoFilters from './CoFilters'

const Mapping = ({ coMaps, rowDataIn, metadata, handleClose, handleUpdate }) => {
  const [rowData, setRowData] = useState(rowDataIn)
  const [coMappings, setCoMappings] = useState({})
  const [availableDes, setAvailableDes] = useState(metadata.dataElements.dataElements)

  useEffect(() => {
    setCoMappings(getCosFromRow(rowData.dsUid, rowData.deUid, metadata, coMaps))
  }, [rowData.deUid, rowData.dsUid])

  const handleDsSelect = (rowData) => {
    const dss = metadata.dataSets.dataSets
    const des = metadata.dataElements.dataElements
    const ds = dss.filter((ds) => ds.id === rowData.dsUid)[0]
    const selectedDe = des.filter((de) => de.id === rowData.deUid)[0]
    const filteredDeUids = ds.dataSetElements.map((dse) => dse.dataElement.id)
    const deOpts = des.filter((de) => filteredDeUids.includes(de.id))
    if (selectedDe && !filteredDeUids.includes(selectedDe.id)) {
      rowData.deUid = ''
      rowData.deName = ''
    }
    setAvailableDes(deOpts)
    setRowData(rowData)
  }

  return (
    <Modal large>
      <ModalTitle>Configure Mapping</ModalTitle>
      <ModalContent>
        <RowFieldSelect
          metadata={metadata.dataSets.dataSets}
          rowData={rowData}
          label="Data Set"
          updateFields={{ uid: 'dsUid', name: 'dsName' }}
          onSelect={handleDsSelect}
        />
        <br />
        <RowFieldSelect
          metadata={availableDes}
          rowData={rowData}
          label="Data Element"
          updateFields={{ uid: 'deUid', name: 'deName' }}
          onSelect={setRowData}
        />
        <br />
        <RowFieldSelect
          metadata={metadata.programIndicators.programIndicators}
          rowData={rowData}
          label="Program Indicator"
          updateFields={{ uid: 'piUid', name: 'piName' }}
          onSelect={setRowData}
        />
        <br />
        <br />
        <CoFilters coMappings={coMappings} setCoMappings={setCoMappings} />
      </ModalContent>
      <ModalActions>
        <ButtonStrip>
          <Button onClick={handleClose}>Close</Button>
          <Button primary onClick={(e) => handleUpdate(rowData, coMappings)}>
            Save
          </Button>
        </ButtonStrip>
      </ModalActions>
    </Modal>
  )
}

export default Mapping
