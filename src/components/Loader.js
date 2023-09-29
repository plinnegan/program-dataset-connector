import React from 'react'
import PropTypes from 'prop-types'
import { CircularLoader, LinearLoader } from '@dhis2/ui'

const Loader = ({ loadType, amount, children }) => {
  return (
    <div className="loader">
      {loadType === 'linear' ? (
        <LinearLoader width={'600px'} amount={amount} />
      ) : (
        <CircularLoader />
      )}
      {children}
    </div>
  )
}

Loader.propTypes = {
  loadType: PropTypes.string,
  amount: PropTypes.number,
  children: PropTypes.node,
}

export default Loader
