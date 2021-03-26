import React from 'react'
import { Button, ButtonStrip, TableRow, TableCell, CircularLoader } from '@dhis2/ui'

const loaderTd = {
  width: '60px',
  height: '50px',
}

const Row = ({ dsName, deName, piName, rowId, handleClick, generateMapping, handleDelete, loading }) => {
  return (
    <TableRow key={rowId}>
      <TableCell key={`${rowId}-dsName`}>{dsName}</TableCell>
      <TableCell key={`${rowId}-deName`}>{deName}</TableCell>
      <TableCell key={`${rowId}-piName`}>{piName}</TableCell>
      <TableCell key={`${rowId}-edit`}>
        <ButtonStrip>
          <Button disabled={loading} secondary onClick={(e) => handleClick(rowId)}>
            Edit
          </Button>
          <Button disabled={loading} primary onClick={(e) => generateMapping(rowId)}>
            Generate Mapping
          </Button>
          <Button disabled={loading} destructive onClick={(e) => handleDelete(rowId)}>
            Delete
          </Button>
        </ButtonStrip>
      </TableCell>
      <TableCell>
        <div style={loaderTd}>{loading && <CircularLoader small />}</div>
      </TableCell>
    </TableRow>
  )
}

export default Row
