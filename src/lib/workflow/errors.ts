export class WorkflowError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400,
    public readonly retryable = false,
  ) {
    super(message)
    this.name = 'WorkflowError'
  }
}

export function asWorkflowError(error: unknown) {
  if (error instanceof WorkflowError) return error
  return new WorkflowError('INTERNAL_ERROR', 'The workflow request could not be completed', 500)
}
