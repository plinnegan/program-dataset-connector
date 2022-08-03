export const addCodeMutation = {
  type: 'update',
  resource: 'dataElements',
  id: ({ id }) => id,
  partial: true,
  data: ({ code }) => ({ code }),
}
