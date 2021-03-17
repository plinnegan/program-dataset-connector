import React from 'react'
import { Button, ButtonStrip, TableRow, TableCell } from '@dhis2/ui'

const Row = ({ dsName, deName, piName, rowId, handleClick, generateMapping, handleDelete, disabled }) => {
  return (
    <TableRow key={rowId}>
      <TableCell key={`${rowId}-dsName`}>{dsName}</TableCell>
      <TableCell key={`${rowId}-deName`}>{deName}</TableCell>
      <TableCell key={`${rowId}-piName`}>{piName}</TableCell>
      <TableCell key={`${rowId}-edit`}>
        <ButtonStrip>
          <Button disabled={disabled} secondary onClick={(e) => handleClick(rowId)}>
            Edit
          </Button>
          <Button disabled={disabled} primary onClick={(e) => generateMapping(rowId)}>
            Generate Mapping
          </Button>
          <Button disabled={disabled} destructive onClick={(e) => handleDelete(rowId)}>
            Delete
          </Button>
        </ButtonStrip>
      </TableCell>
    </TableRow>
  )
}

export default Row
