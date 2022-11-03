import { Modal, ModalTitle, ModalContent, ModalActions, ButtonStrip, Button } from '@dhis2/ui'
import PropTypes from 'prop-types'
import React, { useState, useEffect } from 'react'
import { getCosFromRow } from '../utils'
import CoFilters from './CoFilters'
import RowFieldSelect from './RowFieldSelect'
import AddCodeButton from './AddCodeButton'
import './Mapping.css'

const Mapping = ({ coMaps, rowDataIn, metadata, handleClose, handleUpdate }) => {
  const [rowData, setRowData] = useState(rowDataIn)
  const [coMappings, setCoMappings] = useState({})
  const [availableDes, setAvailableDes] = useState(metadata.dataElements.dataElements)
  const [missingCode, setMissingCode] = useState(false)
  const disableSave = [rowData.dsUid, rowData.deUid, rowData.piUid].includes('') || missingCode

  useEffect(() => {
    const coMappings = getCosFromRow(rowData.dsUid, rowData.deUid, metadata, coMaps)
    setRowData({ ...rowData, coFilters: coMappings })
    setCoMappings(coMappings)
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
        <div className="selectSection">
          <RowFieldSelect
            metadata={availableDes}
            rowData={rowData}
            label="Data Element"
            updateFields={{ uid: 'deUid', name: 'deName' }}
            onSelect={setRowData}
            missingCode={missingCode}
            setMissingCode={setMissingCode}
          />
          {missingCode && (
            <AddCodeButton
              deUid={rowData.deUid}
              setMissingCode={setMissingCode}
              availableDes={availableDes}
              setAvailableDes={setAvailableDes}
            />
          )}
        </div>
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
        {Object.keys(coMappings).length > 0 ? (
          <CoFilters
            rowData={rowData}
            setRowData={setRowData}
            coMappings={coMappings}
            setCoMappings={setCoMappings}
          />
        ) : (
          <p className="noCoMsg">No category options for the selected data element</p>
        )}
      </ModalContent>
      <ModalActions>
        <ButtonStrip>
          <Button onClick={handleClose}>Close</Button>
          <Button primary disabled={disableSave} onClick={() => handleUpdate(rowData, coMappings)}>
            Save
          </Button>
        </ButtonStrip>
      </ModalActions>
    </Modal>
  )
}

Mapping.propTypes = {
  coMaps: PropTypes.objectOf(
    PropTypes.shape({ name: PropTypes.string.isRequired, filter: PropTypes.string.isRequired })
  ).isRequired,
  rowDataIn: PropTypes.shape({
    deUid: PropTypes.string.isRequired,
    dsUid: PropTypes.string.isRequired,
    piUid: PropTypes.string.isRequired,
    rowId: PropTypes.string.isRequired,
    deName: PropTypes.string.isRequired,
    dsName: PropTypes.string.isRequired,
    piName: PropTypes.string.isRequired,
  }).isRequired,
  metadata: PropTypes.shape({
    dataSets: PropTypes.shape({ dataSets: PropTypes.array }).isRequired,
    dataElements: PropTypes.shape({ dataElements: PropTypes.array }).isRequired,
    programIndicators: PropTypes.shape({ programIndicators: PropTypes.array }).isRequired,
    dataStore: PropTypes.array.isRequired,
  }),
  handleClose: PropTypes.func.isRequired,
  handleUpdate: PropTypes.func.isRequired,
}

export default Mapping
