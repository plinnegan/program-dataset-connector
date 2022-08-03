import { Table, TableHead, TableRowHead, TableCellHead, TableBody } from '@dhis2/ui'
import PropTypes from 'prop-types'
import React from 'react'
import RowCatFilter from './RowCatFilter'

const CoFilters = ({ rowData, setRowData, coMappings, setCoMappings }) => {
  return (
    <Table>
      <TableHead>
        <TableRowHead>
          <TableCellHead key="catName">Category Option Name</TableCellHead>
          <TableCellHead key="catFilter">Filter</TableCellHead>
        </TableRowHead>
      </TableHead>
      <TableBody>
        {Object.entries(coMappings).map(([coUid, { name, filter }]) => {
          const rowCoFilter = rowData?.coFilters?.[coUid]?.filter
          return (
            <RowCatFilter
              key={coUid}
              coUid={coUid}
              catName={name}
              catFilter={rowCoFilter ? rowCoFilter : filter}
              coMappings={coMappings}
              rowData={rowData}
              setRowData={setRowData}
              handleClick={setCoMappings}
            />
          )
        })}
      </TableBody>
    </Table>
  )
}

CoFilters.propTypes = {
  rowData: PropTypes.shape({
    deUid: PropTypes.string.isRequired,
    dsUid: PropTypes.string.isRequired,
    piUid: PropTypes.string.isRequired,
    rowId: PropTypes.string.isRequired,
    deName: PropTypes.string.isRequired,
    dsName: PropTypes.string.isRequired,
    piName: PropTypes.string.isRequired,
    coFilters: PropTypes.shape({
      name: PropTypes.string,
      id: PropTypes.string,
    }),
  }).isRequired,
  setRowData: PropTypes.func.isRequired,
  coMappings: PropTypes.objectOf(
    PropTypes.shape({ name: PropTypes.string.isRequired, filter: PropTypes.string.isRequired })
  ),
  setCoMappings: PropTypes.func.isRequired,
}

export default CoFilters
