import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Button, TableRow, TableCell, InputField } from '@dhis2/ui'

const RowCatFilter = ({ rowId, catName, catFilter, coMappings, handleClick }) => {
  const [rowFilter, setRowFilter] = useState(catFilter)
  const [saved, setSaved] = useState(false)

  const saveFilter = (e) => {
    setSaved(true)
    handleClick({ ...coMappings, [rowId]: { name: catName, filter: rowFilter } })
  }

  return (
    <TableRow>
      <TableCell key={`${rowId}-name`}>{catName}</TableCell>
      <TableCell key={`${rowId}-filter`}>
        <InputField
          valid={saved}
          label=""
          inputWidth="450px"
          name={`${rowId}-filter`}
          value={rowFilter}
          onChange={(e) => setRowFilter(e.value)}
        />
      </TableCell>
      <TableCell key={`${rowId}-save`}>
        <Button primary onClick={(e) => saveFilter(e)}>
          Update
        </Button>
      </TableCell>
    </TableRow>
  )
}

RowCatFilter.propTypes = {
  rowId: PropTypes.string.isRequired,
  catName: PropTypes.string.isRequired,
  catFilter: PropTypes.string.isRequired,
  coMappings: PropTypes.objectOf(
    PropTypes.shape({ name: PropTypes.string.isRequired, filter: PropTypes.string.isRequired })
  ).isRequired,
  handleClick: PropTypes.func.isRequired,
}

export default RowCatFilter
