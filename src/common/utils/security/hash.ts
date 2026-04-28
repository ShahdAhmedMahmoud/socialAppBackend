import { hashSync, compareSync } from "bcrypt";
import { SALT_ROUNDS } from "../../../config/config.service.js";
export const Hash = ({
  plainText,
  salt_rounds = SALT_ROUNDS,
} :{ plainText: string; salt_rounds?: number }): string => {
  return hashSync(plainText, Number(salt_rounds));
};
export const Compare = ({ plainText, cipherText } :{ plainText: string; cipherText: string  }) => {
  return compareSync(plainText, cipherText);
};


