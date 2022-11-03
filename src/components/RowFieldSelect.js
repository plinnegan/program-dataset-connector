import { SingleSelectField, SingleSelectOption, Tooltip } from '@dhis2/ui'
import PropTypes from 'prop-types'
import React, { useEffect } from 'react'

const RowFieldSelect = ({
  metadata,
  rowData,
  label,
  updateFields,
  onSelect,
  missingCode,
  setMissingCode,
}) => {
  const handleSelect = (e) => {
    const selectedMeta = metadata.filter((meta) => meta.id === e.selected)[0]
    checkCode(selectedMeta)
    onSelect({
      ...rowData,
      [updateFields.uid]: selectedMeta.id,
      [updateFields.name]: selectedMeta.name,
    })
  }

  const checkCode = (selectedMeta) => {
    if (updateFields.uid === 'deUid' && !selectedMeta.code) {
      setMissingCode(true)
    } else {
      setMissingCode(false)
    }
  }

  // Check on initial render if the existing DE has a code
  useEffect(() => {
    const initiallySelected = rowData[updateFields.uid]
    const selectedMeta = metadata.filter((meta) => meta.id === initiallySelected)[0]
    if (selectedMeta) {
      checkCode(selectedMeta)
    }
  }, [])

  const selectField = (
    <SingleSelectField
      label={label}
      filterable
      selected={rowData[updateFields.uid]}
      onChange={(e) => handleSelect(e)}
      error={missingCode}
      validationText={missingCode ? 'Data element missing a code' : ''}
    >
      {metadata.map(({ id, name }) => (
        <SingleSelectOption label={name} key={id} value={id} />
      ))}
    </SingleSelectField>
  )

  if (missingCode) {
    return (
      <Tooltip content="The T2A tool requires all target data elements to have codes">
        {selectField}
      </Tooltip>
    )
  } else {
    return selectField
  }
}

RowFieldSelect.defaultProps = {
  missingCode: false,
  setMissingCode: () => {},
}

RowFieldSelect.propTypes = {
  metadata: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string, name: PropTypes.string }))
    .isRequired,
  rowData: PropTypes.shape({
    deUid: PropTypes.string.isRequired,
    dsUid: PropTypes.string.isRequired,
    piUid: PropTypes.string.isRequired,
    rowId: PropTypes.string.isRequired,
    deName: PropTypes.string.isRequired,
    dsName: PropTypes.string.isRequired,
    piName: PropTypes.string.isRequired,
  }).isRequired,
  label: PropTypes.string.isRequired,
  updateFields: PropTypes.shape({
    uid: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
  onSelect: PropTypes.func.isRequired,
  missingCode: PropTypes.bool,
  setMissingCode: PropTypes.func,
}

export default RowFieldSelect
