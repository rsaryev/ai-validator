class AiValidatorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiValidatorError';
  }
}

export function throwNoZodSchemaProvided() {
  throw new AiValidatorError('No Zod schema provided');
}
