import React from 'react'
import { Table, TableHead, TableRowHead, TableCellHead, TableBody } from '@dhis2/ui'
import RowCatFilter from './RowCatFilter'
import { defaultCoUid } from '../consts'

const noCoStyle = {
  textAlign: 'center',
  paddingBottom: '20px',
}

const CoFilters = ({ coMappings, setCoMappings }) => {
  const filteredCoUids = Object.keys(coMappings).filter((coUid) => coUid !== defaultCoUid)
  return (
    <>
      {filteredCoUids.length === 0 && <p style={noCoStyle}>No category options for the selected data element</p>}
      {filteredCoUids.length > 0 && (
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
