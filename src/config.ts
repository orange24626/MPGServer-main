import * as dotenv from "dotenv";

const isDev = process.env.NODE_ENV === "development";

isDev && dotenv.config();

export function getGameOrigin() {
  if (!process.env.GAME_ORIGIN) throw new Error("GAME_ORIGIN is not defined");
  return process.env.GAME_ORIGIN;
}

export function getDataBaseUrl() {
  return process.env.DATABASE_URL;
}

export function getPgHost() {
  return process.env.PG_HOST;
}

export function getPgPort() {
  return process.env.PG_PORT;
}

export function getPgUser() {
  return process.env.PG_USER;
}

export function getPgPassword() {
  return process.env.PG_PASSWORD;
}

export function getRootUser() {
  const username = process.env.ROOT_USER;
  if (!username) throw new Error("root username not set in .env file");
  return username;
}

export function getRootPassword() {
  const password = process.env.ROOT_PASSWORD;
  if (!password) throw new Error("root password not set in .env file");
  return password;
}

export function getRedisURL() {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("REDIS_URL is not defined");
  }
  return url;
}

export function getDBURL() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not defined");
  }
  return url;
}

export function getServerType() {
  if (!process.env.SERVER_TYPE) {
    throw new Error("SERVER_TYPE is not defined");
  }
  return process.env.SERVER_TYPE;
}

export const CurrencySymbols: any = {
  CNY: "¥",
  USD: "$",
  EUR: "€",
  BRL: "R$",
};
