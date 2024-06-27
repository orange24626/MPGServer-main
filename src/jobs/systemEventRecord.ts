import { SystemEventType } from "@prisma/client";
import { AuthConsumerService, GameEventConsumerService, OperatorEventConsumerService } from "services/consumers";

export interface SystemEventRecordJob {
  event: SystemEventType;
  payload: {
    playerId: number;
    gameID?: number;
    bet?: number;
    win?: number;
    charge?: number;
    withdraw?: number;
  };
}

export const dealSystemEventRecordJob = async (
  job: any,
  done: (error?: Error | null, value?: SystemEventRecordJob) => void,
) => {
  const { event, payload } = job.data;
  const { playerId, gameID, bet, win } = payload;
  console.log("dealSystemEventRecordJob==============", JSON.stringify({ event, payload }));
  switch (event) {
    case SystemEventType.Login:
      AuthConsumerService.afterLogin(playerId, gameID);
      break;
    case SystemEventType.Register:
      AuthConsumerService.afterRegister(playerId, gameID);
      break;
    case SystemEventType.GameBet:
      if (!bet) throw new Error("bet amount is required");
      if (!gameID) throw new Error("gameID is required");
      GameEventConsumerService.afterBet(playerId, gameID, bet);
      break;
    case SystemEventType.GameWin:
      if (!win) throw new Error("win amount is required");
      if (!gameID) throw new Error("gameID is required");
      GameEventConsumerService.afterWin(playerId, gameID, win);
      break;
    case SystemEventType.Charge:
      OperatorEventConsumerService.afterCharge(playerId, payload.charge || 0);
      break;
    case SystemEventType.Withdraw:
      OperatorEventConsumerService.afterWithdraw(playerId, payload.withdraw || 0);
      break;
    default:
      throw new Error("event type not supported");
  }
  done(null, job.data);
};

export const triggerLoginJob = async (params: { playerId: number; gameID: number }) => {
  const { playerId, gameID } = params;
  // await SystemEventRecordQueue.add({
  //   event: SystemEventType.Login,
  //   payload: {
  //     playerId,
  //     gameID,
  //   },
  // });
};

export const triggerRegisterJob = async (params: { playerId: number; gameID?: number }) => {
  const { playerId, gameID } = params;
  console.log("triggerRegisterJob=====================", playerId, gameID);
  // await SystemEventRecordQueue.add({
  //   event: SystemEventType.Register,
  //   payload: {
  //     playerId,
  //     gameID,
  //   },
  // });
};

export const triggerBetJob = async (params: { playerId: number; gameID: number; bet: number }) => {
  const { playerId, gameID, bet } = params;
  // await SystemEventRecordQueue.add({
  //   event: SystemEventType.GameBet,
  //   payload: {
  //     playerId,
  //     gameID,
  //     bet,
  //   },
  // });
};

export const triggerWinJob = async (params: { playerId: number; gameID: number; win: number }) => {
  const { playerId, gameID, win } = params;
  // await SystemEventRecordQueue.add({
  //   event: SystemEventType.GameWin,
  //   payload: {
  //     playerId,
  //     gameID,
  //     win,
  //   },
  // });
};

export const triggerWithdrawJob = async (params: { playerId: number; withdraw: number }) => {
  const { playerId, withdraw } = params;
  // await SystemEventRecordQueue.add({
  //   event: SystemEventType.Withdraw,
  //   payload: {
  //     playerId,
  //     withdraw,
  //   },
  // });
};

export const triggerChargeJob = async (params: { playerId: number; charge: number }) => {
  const { playerId, charge } = params;
  // await SystemEventRecordQueue.add({
  //   event: SystemEventType.Charge,
  //   payload: {
  //     playerId,
  //     charge,
  //   },
  // });
};
