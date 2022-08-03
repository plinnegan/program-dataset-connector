import { Button, ButtonStrip, Checkbox, TableRow, TableCell, CircularLoader } from '@dhis2/ui'
import PropTypes from 'prop-types'
import React, { useState } from 'react'
import classes from '../App.module.css'
import ConfirmGenerationModal from './ConfirmGenerationModal'

const Row = ({
  dsName,
  deName,
  piName,
  rowId,
  handleClick,
  generateMapping,
  handleDelete,
  loading,
  rowSelected,
  selectRow,
  getSummaryInfo,
}) => {
  const [confirmGeneration, setConfirmGeneration] = useState(false)

  const handleGenerateRow = () => {
    setConfirmGeneration(true)
  }

  return (
    <>
      {confirmGeneration && (
        <ConfirmGenerationModal
          generateMapping={generateMapping}
          rowId={rowId}
          setConfirmGeneration={setConfirmGeneration}
          getSummaryInfo={getSummaryInfo}
        />
      )}
      <TableRow key={rowId}>
        <TableCell>
          <Checkbox checked={rowSelected} onChange={() => selectRow(rowId)} />
        </TableCell>
        <TableCell key={`${rowId}-id`}>{rowId}</TableCell>
        <TableCell key={`${rowId}-dsName`}>{dsName}</TableCell>
        <TableCell key={`${rowId}-deName`}>{deName}</TableCell>
        <TableCell key={`${rowId}-piName`}>{piName}</TableCell>

        <TableCell className={classes.actionTd} key={`${rowId}-edit`}>
          <ButtonStrip>
            <Button disabled={loading} secondary onClick={() => handleClick(rowId)}>
              Edit
            </Button>
            <Button disabled={loading} primary onClick={handleGenerateRow}>
              Generate Mapping
            </Button>
            <Button disabled={loading} destructive onClick={() => handleDelete(rowId)}>
              Delete
            </Button>
          </ButtonStrip>
        </TableCell>
        <TableCell className={classes.loaderTd}>
          <div className={classes.loaderDiv}>{loading && <CircularLoader small />}</div>
        </TableCell>
      </TableRow>
    </>
  )
}

Row.propTypes = {
  dsName: PropTypes.string.isRequired,
  deName: PropTypes.string.isRequired,
  piName: PropTypes.string.isRequired,
  rowId: PropTypes.string.isRequired,
  handleClick: PropTypes.func.isRequired,
  generateMapping: PropTypes.func.isRequired,
  handleDelete: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  rowSelected: PropTypes.bool.isRequired,
  selectRow: PropTypes.func,
  getSummaryInfo: PropTypes.func,
}

export default Row
