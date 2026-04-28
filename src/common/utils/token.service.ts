// import jwt from "jsonwebtoken";
// import type { SignOptions, VerifyOptions, JwtPayload } from "jsonwebtoken";
// interface GenerateTokenParams {
//   payload: string | object | Buffer;
//   secret_key: string;
//   options?: SignOptions;
// }

// export const GenerateToken = ({
//   payload,
//   secret_key,
//   options = {},
// }: GenerateTokenParams): string => {
//   return jwt.sign(payload, secret_key, options);
// };

// interface VerifyTokenParams {
//   token: string;
//   secret_key: string;
//   options?: VerifyOptions;
// }

// export const VerifyToken = ({
//   token,
//   secret_key,
//   options = {},
// }: VerifyTokenParams): string | JwtPayload => {
//   return jwt.verify(token, secret_key, options);
// };

import jwt from "jsonwebtoken";
import type { SignOptions, VerifyOptions, JwtPayload } from "jsonwebtoken";

interface GenerateTokenParams {
  payload: string | object | Buffer;
  secret_key: string;
  options?: SignOptions;
}

export const GenerateToken = ({
  payload,
  secret_key,
  options = {},
}: GenerateTokenParams): string => {
  return jwt.sign(payload, secret_key, options);
};

interface VerifyTokenParams {
  token: string;
  secret_key: string;
  options?: VerifyOptions;
}

export const VerifyToken = <T extends JwtPayload = JwtPayload>({
  token,
  secret_key,
  options = {},
}: VerifyTokenParams): T => {
  return jwt.verify(token, secret_key, options) as T;
};