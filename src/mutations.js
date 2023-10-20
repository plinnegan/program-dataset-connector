import { config } from './consts'

export const addCodeMutation = {
  type: 'update',
  resource: 'dataElements',
  id: ({ id }) => id,
  partial: true,
  data: ({ code }) => ({ code }),
}

export const dataStoreMutation = {
  resource: `dataStore/${config.dataStoreName}/metadata`,
  type: 'update',
  data: ({ data }) => data,
}

export const createUpdateMutation = {
  resource: `metadata`,
  type: 'create',
  data: ({ data }) => data,
}

export const deleteMutation = {
  resource: `metadata`,
  type: 'create',
  data: ({ data }) => data,
  params: {
    importStrategy: 'DELETE',
  },
}
