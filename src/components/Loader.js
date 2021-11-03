import React from 'react'
import PropTypes from 'prop-types'

const Loader = ({ children }) => {
  return <span>{children}</span>
}

Loader.propTypes = {
  children: PropTypes.node,
}

export default Loader
