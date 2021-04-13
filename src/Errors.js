export class MappingGenerationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'MappingGenerationError'
  }
}
