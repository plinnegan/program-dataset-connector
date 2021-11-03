import React from 'react'
import PropTypes from 'prop-types'

const Error = ({ children }) => {
  return <span>{children}</span>
}

Error.propTypes = {
  children: PropTypes.node,
}

export default Error
