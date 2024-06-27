import { GameHistoryStatus } from "@prisma/client";

export interface GameHistoryFilter {
  gameID?: number;
  gameId?: number;
  status?: GameHistoryStatus;
  orderId?: number;
  isTesting?: boolean;
  historyId?: bigint;
  operatorId?: number;
  createdAt?: {
    gte?: Date | string;
    lte?: Date | string;
  };
  updatedAt?: {
    gte?: Date | string;
    lte?: Date | string;
  };
  id?: {
    in?: number[];
  };
  operatorAccountID?: string;
}
