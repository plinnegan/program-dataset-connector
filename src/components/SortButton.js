import React from 'react'
import PropTypes from 'prop-types'
import classes from '../App.module.css'

const SortButton = ({ handleClick }) => {
  return (
    <span style={{ padding: '10px, 0, 0, 0' }}>
      <div onClick={handleClick} className={classes.arrow}></div>
    </span>
  )
}

export default SortButton

SortButton.propTypes = {
  handleClick: PropTypes.func.isRequired,
}
