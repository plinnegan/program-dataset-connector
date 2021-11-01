import React from 'react'
import PropTypes from 'prop-types'
import { Table, TableHead, TableRowHead, TableCellHead, TableBody } from '@dhis2/ui'
import RowCatFilter from './RowCatFilter'

const noCoStyle = {
  textAlign: 'center',
  paddingBottom: '20px',
}

const CoFilters = ({ rowData, setRowData, coMappings, setCoMappings }) => {
  const coUids = Object.keys(coMappings)
  return (
    <>
      {coUids.length === 0 && <p style={noCoStyle}>No category options for the selected data element</p>}
      {coUids.length > 0 && (
        <Table>
          <TableHead>
            <TableRowHead>
              <TableCellHead key="catName">Category Option Name</TableCellHead>
              <TableCellHead key="catFilter">Filter</TableCellHead>
              <TableCellHead key="save"></TableCellHead>
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
      )}
    </>
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
  }).isRequired,
  setRowData: PropTypes.func.isRequired,
  coMappings: PropTypes.objectOf(
    PropTypes.shape({ name: PropTypes.string.isRequired, filter: PropTypes.string.isRequired })
  ).isRequired,
  setCoMappings: PropTypes.func.isRequired,
}

export default CoFilters
