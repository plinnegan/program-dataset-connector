import React from 'react'
import PropTypes from 'prop-types'
import './CircularLoader.css'

const Segment = ({ rotate, skew }) => (
  <div className="segment" style={{ transform: `rotate(${rotate}deg) skew(${skew}deg)` }}></div>
)

const CircularLoader = ({ progress }) => {
  const firstQSkew = Math.max(0, 90 - (90 * progress) / 0.25)
  const secondSkew = Math.max(0, 90 - (90 * (progress - 0.25)) / 0.25)
  const thirdSkew = Math.max(0, 90 - (90 * (progress - 0.5)) / 0.25)
  const fourthSkew = Math.max(0, 90 - (90 * (progress - 0.75)) / 0.25)
  return (
    <div className="circular-progress">
      <div className="circular-progress-circle">
        <Segment rotate={270} skew={firstQSkew} />
        {progress > 0.25 && <Segment rotate={0} skew={secondSkew} />}
        {progress > 0.5 && <Segment rotate={90} skew={thirdSkew} />}
        {progress > 0.75 && <Segment rotate={180} skew={fourthSkew} />}
      </div>
      <div className="circular-progress-inner"></div>
      <div className="circular-progress-value">{Math.round(progress * 100)}%</div>
    </div>
  )
}

Segment.propTypes = {
  rotate: PropTypes.number,
  skew: PropTypes.number,
}

CircularLoader.propTypes = {
  progress: PropTypes.number,
}

export default CircularLoader
