import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Button, TableRow, TableCell, InputField } from '@dhis2/ui'

const RowCatFilter = ({ coUid, catName, catFilter, coMappings, rowData, setRowData, handleClick }) => {
  const [rowFilter, setRowFilter] = useState(catFilter)
  const [saved, setSaved] = useState(false)
  const coFilters = rowData?.coFilters ? rowData.coFilters : {}

  const saveFilter = (e) => {
    setRowData({
      ...rowData,
      coFilters: { ...coFilters, [coUid]: { name: catName, filter: rowFilter } },
    })
    setSaved(true)
    handleClick({ ...coMappings, [coUid]: { name: catName, filter: rowFilter } })
  }

  return (
    <TableRow>
      <TableCell key={`${coUid}-name`}>{catName}</TableCell>
      <TableCell key={`${coUid}-filter`}>
        <InputField
          valid={saved}
          label=""
          inputWidth="450px"
          name={`${coUid}-filter`}
          value={rowFilter}
          onChange={(e) => setRowFilter(e.value)}
        />
      </TableCell>
      <TableCell key={`${coUid}-save`}>
        <Button primary onClick={(e) => saveFilter(e)}>
          Update
        </Button>
      </TableCell>
    </TableRow>
  )
}

RowCatFilter.propTypes = {
  coUid: PropTypes.string.isRequired,
  catName: PropTypes.string.isRequired,
  catFilter: PropTypes.string.isRequired,
  coMappings: PropTypes.objectOf(
    PropTypes.shape({ name: PropTypes.string.isRequired, filter: PropTypes.string.isRequired })
  ).isRequired,
  handleClick: PropTypes.func.isRequired,
}

export default RowCatFilter
