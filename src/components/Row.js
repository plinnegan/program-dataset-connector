import React from 'react'
import { Button, TableRow, TableCell } from '@dhis2/ui'

const Row = ({ dsName, deName, piName, rowId, handleClick }) => {
  return (
    <TableRow key={rowId}>
      <TableCell key={`${rowId}-dsName`}>{dsName}</TableCell>
      <TableCell key={`${rowId}-deName`}>{deName}</TableCell>
      <TableCell key={`${rowId}-piName`}>{piName}</TableCell>
      <TableCell key={`${rowId}-edit`}>
        <Button secondary onClick={(e) => handleClick(rowId)}>
          Edit
        </Button>
      </TableCell>
    </TableRow>
  )
}

export default Row
