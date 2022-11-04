import React from 'react'
import PropTypes from 'prop-types'
import { addCodeMutation } from '../mutations'
import { updateDes } from '../utils'
import { useDataMutation, useAlert } from '@dhis2/app-runtime'
import { Button } from '@dhis2/ui'
import './Mapping.css'

const AddCodeButton = ({ deUid, setMissingCode, availableDes, setAvailableDes }) => {
  const { show } = useAlert(
    ({ msg }) => msg,
    ({ type }) => ({ [type]: true })
  )

  const [mutate] = useDataMutation(addCodeMutation, {
    onComplete: () => {
      show({ msg: 'Code added', type: 'success' })
      setAvailableDes(updateDes(availableDes, deUid))
      setMissingCode(false)
    },
    onError: () => {
      show({ msg: 'Error adding code', type: 'critical' })
    },
  })

  const handleClick = () => {
    console.log(`Updating data element: ${deUid}, adding code with value: ${deUid}`)
    mutate({ id: deUid, code: deUid })
  }

  return (
    <Button className="addCodeBtn" onClick={handleClick}>
      Add code
    </Button>
  )
}

AddCodeButton.propTypes = {
  deUid: PropTypes.string.isRequired,
  setMissingCode: PropTypes.func.isRequired,
  availableDes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ),
  setAvailableDes: PropTypes.func.isRequired,
}

export default AddCodeButton
