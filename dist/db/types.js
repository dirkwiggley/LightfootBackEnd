export const objectIsUserInterface = (obj) => {
    const test = obj;
    if (test.login === null || test.login === undefined)
        return false;
    if (test.active === null || test.active === undefined)
        return false;
    return true;
};
// TODO: flesh this out
export const objectIsDecodedToken = (obj) => {
    const test = obj;
    return test.timestamp !== null && test.timestamp !== undefined;
};
//# sourceMappingURL=types.js.map