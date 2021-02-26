import React from 'react'
import { Table, TableHead, TableRowHead, TableCellHead, TableBody } from '@dhis2/ui'
import RowCatFilter from './RowCatFilter'

const noCoStyle = {
  textAlign: 'center',
  paddingBottom: '20px',
}

const CoFilters = ({ coMappings, setCoMappings }) => {
  const coUids = Object.keys(coMappings)
  return (
    <>
      {coUids.length === 0 && <p style={noCoStyle}>No category options for the selected data element</p>}
      {coUids.length > 0 && (
        <Table>
          <TableHead>
            <TableRowHead>
              <TableCellHead key="catName">Category Name</TableCellHead>
              <TableCellHead key="catFilter">Filter</TableCellHead>
              <TableCellHead key="save"></TableCellHead>
            </TableRowHead>
          </TableHead>
          <TableBody>
            {Object.entries(coMappings).map(([key, { name, filter }]) => (
              <RowCatFilter
                key={key}
                rowId={key}
                catName={name}
                catFilter={filter}
                coMappings={coMappings}
                handleClick={setCoMappings}
              />
            ))}
          </TableBody>
        </Table>
      )}
    </>
  )
}

export default CoFilters
