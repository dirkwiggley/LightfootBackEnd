import bcrypt from "bcryptjs";

export const hash = (value: string) => {
  var salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(value, salt);
};

export const compareHash = (value: string, hash: any) => {
  return bcrypt.compareSync(value, hash);
};
