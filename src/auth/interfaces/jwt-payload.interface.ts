export interface JwtPayloadRaw {
  id: string;
  exp: number;
  iat: number;
}

export interface JwtPayload {
  id: string;
}
