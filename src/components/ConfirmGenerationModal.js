import { Modal, ModalTitle, ModalContent, ModalActions, ButtonStrip, Button } from '@dhis2/ui'
import PropTypes from 'prop-types'
import React, { useState, useEffect } from 'react'

const ConfirmGenerationModal = ({
  generateMapping,
  rowId,
  setConfirmGeneration,
  getSummaryInfo,
}) => {
  const [summaryInfo, setSummaryInfo] = useState(null)

  const handleClose = () => {
    setConfirmGeneration(false)
  }

  const handleConfirm = () => {
    handleClose()
    generateMapping(rowId)
  }

  useEffect(() => {
    setSummaryInfo(getSummaryInfo(rowId))
  }, [])

  return (
    <Modal>
      <ModalTitle>Confirm mapping generation</ModalTitle>
      <ModalContent>
        {summaryInfo === null ? (
          'Loading...'
        ) : (
          <div>
            You are about to generate {summaryInfo.piCount} program indicators, please click confirm
            to continue.
          </div>
        )}
      </ModalContent>
      <ModalActions>
        <ButtonStrip>
          <Button onClick={handleClose}>Cancel</Button>
          <Button primary onClick={handleConfirm}>
            Confirm
          </Button>
        </ButtonStrip>
      </ModalActions>
    </Modal>
  )
}

ConfirmGenerationModal.propTypes = {
  generateMapping: PropTypes.func.isRequired,
  rowId: PropTypes.string.isRequired,
  setConfirmGeneration: PropTypes.func.isRequired,
  getSummaryInfo: PropTypes.func.isRequired,
}

export default ConfirmGenerationModal
