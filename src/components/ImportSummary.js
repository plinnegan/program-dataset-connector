import React from 'react'
import { Modal, ModalTitle, ModalContent, ModalActions, ButtonStrip, Button } from '@dhis2/ui'

const ImportSummary = ({ handleClose, importResults }) => {
  const { success, message } = importResults
  return (
    <Modal large>
      <ModalTitle>Import Summary</ModalTitle>
      <ModalContent>
        <h4 style={{ color: success ? 'green' : 'red' }}>Import {success ? 'succeeded' : 'failed'}</h4>
        <p>{message}</p>
      </ModalContent>
      <ModalActions>
        <ButtonStrip>
          <Button onClick={handleClose}>Close</Button>
        </ButtonStrip>
      </ModalActions>
    </Modal>
  )
}

export default ImportSummary
