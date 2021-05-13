import React from 'react'
import PropTypes from 'prop-types'
import { Button, ButtonStrip } from '@dhis2/ui'
import classes from '../App.module.css'

const ActionButtons = ({ addRow, generateAll }) => {
  return (
    <ButtonStrip className={classes.newRowBtn}>
      <Button primary onClick={generateAll}>
        Generate All Mappings
      </Button>
      <Button primary onClick={addRow}>
        Add row
      </Button>
    </ButtonStrip>
  )
}

ActionButtons.propTypes = {
  addRow: PropTypes.func.isRequired,
  generateAll: PropTypes.func.isRequired,
}

export default ActionButtons
