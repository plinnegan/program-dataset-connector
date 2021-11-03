import { useConfig } from '@dhis2/app-runtime'
import { TableRow, TableCell, InputField } from '@dhis2/ui'
import PropTypes from 'prop-types'
import React, { useState } from 'react'
import { getBaseUrl } from '../utils'

const RowCatFilter = ({
  coUid,
  catName,
  catFilter,
  coMappings,
  rowData,
  setRowData,
  handleClick,
}) => {
  const [rowFilter, setRowFilter] = useState(catFilter)
  const [filterError, setFilterError] = useState('')
  const { appUrl } = useConfig()
  const baseUrl = getBaseUrl(appUrl)
  const coFilters = rowData?.coFilters ? rowData.coFilters : {}

  const handleFilterChange = filterText => {
    setRowFilter(filterText)
    if (filterText.length === 0) {
      setFilterError('')
    } else {
      fetch(`${baseUrl}/api/programIndicators/filter/description`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: filterText,
      })
        .catch(err => {
          console.log(`Error checking PI filter: ${err}`)
        })
        .then(result => {
          return result.json()
        })
        .then(data => {
          const { message, description } = data
          if (message !== 'Valid') {
            setFilterError(description)
          } else {
            setFilterError('')
          }
        })
    }
    console.log(`Updating filter: ${filterText}`)
    setRowData({
      ...rowData,
      coFilters: { ...coFilters, [coUid]: { name: catName, filter: filterText } },
    })
    handleClick({ ...coMappings, [coUid]: { name: catName, filter: filterText } })
  }

  return (
    <TableRow>
      <TableCell key={`${coUid}-name`}>{catName}</TableCell>
      <TableCell key={`${coUid}-filter`}>
        <InputField
          label=""
          inputWidth="500px"
          name={`${coUid}-filter`}
          value={rowFilter}
          error={filterError.length > 0}
          validationText={filterError}
          onChange={e => handleFilterChange(e.value)}
        />
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
  rowData: PropTypes.shape({
    deUid: PropTypes.string.isRequired,
    dsUid: PropTypes.string.isRequired,
    piUid: PropTypes.string.isRequired,
    rowId: PropTypes.string.isRequired,
    deName: PropTypes.string.isRequired,
    dsName: PropTypes.string.isRequired,
    piName: PropTypes.string.isRequired,
    coFilters: PropTypes.shape({
      name: PropTypes.string.isRequired,
      id: PropTypes.string.isRequired,
    }),
  }).isRequired,
  setRowData: PropTypes.func.isRequired,
}

export default RowCatFilter
