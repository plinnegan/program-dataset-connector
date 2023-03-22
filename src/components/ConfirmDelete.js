import React from 'react'
import PropTypes from 'prop-types'
import { Button, ButtonStrip, Modal, ModalTitle, ModalContent, ModalActions } from '@dhis2/ui'

const ConfirmDelete = ({ onDelete, closeModal }) => {
  const handleDelete = () => {
    closeModal()
    onDelete()
  }

  return (
    <Modal>
      <ModalTitle>Confirm delete</ModalTitle>
      <ModalContent>
        Are you sure you want to delete this mapping? This action cannot be undone.
      </ModalContent>
      <ModalActions>
        <ButtonStrip>
          <Button onClick={closeModal}>Cancel</Button>
          <Button destructive onClick={handleDelete}>
            Delete
          </Button>
        </ButtonStrip>
      </ModalActions>
    </Modal>
  )
}

ConfirmDelete.propTypes = {
  onDelete: PropTypes.func.isRequired,
  closeModal: PropTypes.func.isRequired,
}

export default ConfirmDelete
