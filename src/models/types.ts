import { Decimal } from "@prisma/client/runtime/library";

export enum PermissionAction {
  list = "list",
  create = "create",
  edit = "edit",
  delete = "delete",
  show = "show",
  charge = "charge",
  approve = "approve",
  reject = "reject",
  changePassword = "changePassword",
}

export interface MoneyPoolMachine {
  betLevel: number;
  operatorId: number;
  level: number;
  gameID: number;
  totalIn?: Decimal;
  totalOut?: Decimal;
  maxRtp: Decimal;
  updatedAt?: Date;
}
