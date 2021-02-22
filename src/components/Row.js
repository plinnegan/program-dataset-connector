import React from 'react'
import { Button, ButtonStrip, TableRow, TableCell } from '@dhis2/ui'

const Row = ({ dsName, deName, piName, rowId, handleClick, generatePis }) => {
  return (
    <TableRow key={rowId}>
      <TableCell key={`${rowId}-dsName`}>{dsName}</TableCell>
      <TableCell key={`${rowId}-deName`}>{deName}</TableCell>
      <TableCell key={`${rowId}-piName`}>{piName}</TableCell>
      <TableCell key={`${rowId}-edit`}>
        <ButtonStrip>
          <Button secondary onClick={(e) => handleClick(rowId)}>
            Edit
          </Button>
          <Button primary onClick={(e) => generatePis(rowId)}>
            Generate PIs
          </Button>
        </ButtonStrip>
      </TableCell>
    </TableRow>
  )
}

export default Row
