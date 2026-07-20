export interface JwtPayloadRaw {
  id: string;
  code: string;
  email: string;
  userShortName: string;
  exp: number;
  iat: number;
}

export interface JwtPayload {
  id: string;
  code: string;
  email: string;
  userShortName: string;
}
