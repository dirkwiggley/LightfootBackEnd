import bcrypt from "bcryptjs";
export const hash = (value) => {
    var salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(value, salt);
};
export const compareHash = (value, hash) => {
    return bcrypt.compareSync(value, hash);
};
//# sourceMappingURL=CommonAuth.js.map