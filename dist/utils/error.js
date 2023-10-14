export class InternalError extends Error {
    constructor(statusNumber, messageString) {
        super();
        this.status = 0;
        this.message = messageString;
        this.status = statusNumber;
    }
}
export const createError = (status, message) => {
    const err = new InternalError(status, message);
    return err;
};
//# sourceMappingURL=error.js.map