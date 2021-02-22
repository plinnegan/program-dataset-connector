import React from 'react'
import { SingleSelectField, SingleSelectOption } from '@dhis2/ui'

const RowFieldSelect = ({ metadata, rowData, label, updateFields, onSelect }) => {
  const handleSelect = (e) => {
    const selectedMeta = metadata.filter((meta) => meta.id === e.selected)[0]
    onSelect({ ...rowData, [updateFields.uid]: selectedMeta.id, [updateFields.name]: selectedMeta.name })
  }
  return (
    <SingleSelectField label={label} filterable selected={rowData[updateFields.uid]} onChange={(e) => handleSelect(e)}>
      {metadata.map(({ id, name }) => (
        <SingleSelectOption label={name} key={id} value={id} />
      ))}
    </SingleSelectField>
  )
}

export default RowFieldSelect
