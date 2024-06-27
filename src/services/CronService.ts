import cron from "node-cron";

import { Message } from "@aws-sdk/client-sqs";

import { sqsClient, ACTIONS } from "services/SqsService";

import { GameHistoryService } from "services";

import random from "random";
import { FortuneDoubleService } from "./games";

const createHistory = async (body: string | undefined): Promise<boolean> => {
  
  try {

    if (!body) return true;

    const { input, balanceBefore } = JSON.parse(body);

    console.log(`订单：${input.historyId} 创建中=======`, JSON.stringify(input), `balanceBefore: ${balanceBefore}`);

    await GameHistoryService.createById(input, balanceBefore);

    console.log(`订单：${input.historyId} 创建成功`);

    return true;

  } catch (error: any) {
    
    console.log(`createHistory error: ${JSON.stringify(error)}`);

    return false;
  }
};

const deleteHistory = async (body: string | undefined): Promise<boolean> => {
  
  try {

    if (!body) return true;

    await GameHistoryService.delete(body);

    return true;

  } catch (error) {
    
    console.log(`deleteHistory: ${JSON.stringify(error)}`);

    return false;
  }
};

const updateProfit = async (body: string | undefined): Promise<boolean> => {

  return true;
};

const pushDetail = async (body: string | undefined): Promise<boolean> => {
  try {
    if (!body) return true;
    console.log(`pushDetail: ${body}`);
    const { historyId, detailRecord, status, balanceAfter } = JSON.parse(body);
    await GameHistoryService.pushDetail(historyId, detailRecord, status, balanceAfter);
    console.log(`订单：${historyId} pushDetail成功`);
    return true;
  } catch (error: any) {
    console.log(`pushDetail error: ${JSON.stringify(error)}`);
    return false;
  }
};
const pushDetail48 = async (body: string | undefined): Promise<boolean> => {
  try {
    if (!body) return true;
    console.log(`pushDetail: ${body}`);
    const { historyId, detailRecord, status, balanceAfter ,totalWin, ge} = JSON.parse(body);
    await FortuneDoubleService.pushDetail48(historyId, detailRecord, balanceAfter,totalWin, ge);
    console.log(`订单：${historyId} pushDetail成功`);
    return true;
  } catch (error: any) {
    console.log(`pushDetail error: ${JSON.stringify(error)}`);
    return false;
  }
};
const actionMap = new Map([
  [ACTIONS.CREATEHISTORY, createHistory],
  [ACTIONS.DELETEHISTORY, deleteHistory],
  [ACTIONS.UPDATEPROFIT, updateProfit],
  [ACTIONS.PUSHDETAIL, pushDetail],
  [ACTIONS.PUSHDETAIL48, pushDetail48],
]);

const dealHistoryQueue = async (Messages: Message[]) => {
  try {
    const deleteMessages: Message[] = [];

    for (let index = 0; index < Messages.length; index++) {
      
      const Message = Messages[index];
      
      if (!Message.MessageAttributes || !Message.MessageAttributes.Action) continue;

      const action = actionMap.get(Message.MessageAttributes!.Action.StringValue as ACTIONS);

      if (action) {
        
        if (Message.Body && Message.Body !== "") {

          const success = await action(Message.Body);
          
          if(success) deleteMessages.push(Message);
          
        }
      }
    }
  
    if (deleteMessages.length > 0) await sqsClient.DeleteMessageBatchCommand(deleteMessages);
  
  } catch (error) {
  
    console.log(`dealHistoryQueue ${error}`);
  
    throw error;
  }
};

export const CronStart = () => {

  let running = false;

  const start = random.int(0, 59);

  cron.schedule(`${start} * * * * *`, async () => {

    console.log(`cron 执行开始 pid ${process.pid}`);

    if (running) return;

    running = true;

    let repeat = true;

    while (repeat) {
      
      try {
      
        const data = await sqsClient.receiveMessage();

        if (!data.Messages) repeat = false;

        if (data.Messages) await dealHistoryQueue(data.Messages);

      } catch (error: any) {

        console.log(`cron error: ${error}`);
        
        repeat = false;
      }
    }
    
    running = false;

    console.log(`cron 执行结束 pid ${process.pid}`);
  });

  console.log(`pid ${process.pid} 定时任务开始执行, 执行时间为每分钟的第${start}秒`);
};
