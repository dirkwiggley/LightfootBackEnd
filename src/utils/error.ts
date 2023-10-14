export class InternalError extends Error {
  status: number = 0;

  constructor(statusNumber: number, messageString: string) {
    super();
    this.message = messageString;
    this.status = statusNumber;
  }
}

export const createError = (status: number, message: string) => {
  const err = new InternalError(status, message);
  return err;
};
