import {
  SQSClient,
  GetQueueUrlCommand,
  SendMessageCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  DeleteMessageBatchCommand,
  ListQueuesCommand,
  Message,
} from "@aws-sdk/client-sqs";

import { customAlphabet } from "nanoid";

const accessKeyId = "AKIAY33N63FTX67PYGEI";

const secretAccessKey = process.env.DEV_SECRETKEY as string;

const alphabet = "0123456789";

const nanoid = customAlphabet(alphabet, 18);

export const MaxNumberOfMessages = 10;

export enum MESSAGEGROUP {
  HISTORY = "game-history-group",
}

export enum ACTIONS {
  CREATEHISTORY = "createHistory",
  DELETEHISTORY = "deleteHistory",
  UPDATEPROFIT = "updateProfit",
  PUSHDETAIL = "pushDetail",
  PUSHDETAIL48 = "pushDetail48",

}

class SqsService {
  private client;

  private queueUrl: string | undefined;

  constructor() {
    // this.client = accessKeyId && secretAccessKey ? new SQSClient({ region, credentials: { accessKeyId, secretAccessKey } }) : null

    this.client =
      process.env.NODE_ENV === "production"
        ? new SQSClient({ region: process.env.AWS_REGION })
        : new SQSClient({ region: process.env.AWS_REGION, credentials: { accessKeyId, secretAccessKey } });

    this.init();
  }

  public init = async () => {
    try {
      // const command = new ListQueuesCommand({ MaxResults: 100 })

      // const data =  await this.client.send(command);

      // console.log(data, 111111)

      this.queueUrl = process.env.SQS_URL;

      // if(!this.client || !queueName) throw 'sqs client can not init'

      // const command = new GetQueueUrlCommand({ QueueName: queueName })

      // const data = await this.client.send(command)

      // this.queueUrl = data.QueueUrl

      console.log(`aws-sqs初始化成功: queueUrl: ${this.queueUrl}`);
    } catch (error) {
      throw JSON.stringify(error);
    }
  };

  public sendMessage = async (message: string, group: MESSAGEGROUP, action: ACTIONS) => {
    try {
      if (!this.client) throw "sqs client can not init";

      const command = new SendMessageCommand({
        QueueUrl: this.queueUrl,

        MessageAttributes: {
          Action: { DataType: "String", StringValue: action },
        },

        // MessageGroupId: group,

        // MessageDeduplicationId: Date.now() + nanoid(),

        MessageBody: message,
      });

      return await this.client.send(command);
    } catch (error) {
      throw JSON.stringify(error);
    }
  };

  public receiveMessage = async () => {
    try {
      if (!this.client) throw "sqs client can not init";

      const command = new ReceiveMessageCommand({
        MaxNumberOfMessages,

        AttributeNames: ["All"],

        MessageAttributeNames: ["All"],

        QueueUrl: this.queueUrl,

        WaitTimeSeconds: 10,
      });

      return await this.client.send(command);
    } catch (error) {
      throw JSON.stringify(error);
    }
  };

  public deleteMessage = async (ReceiptHandle: string) => {
    try {
      if (!this.client) throw "sqs client can not init";

      return await this.client.send(
        new DeleteMessageCommand({
          QueueUrl: this.queueUrl,

          ReceiptHandle: ReceiptHandle,
        }),
      );
    } catch (error) {
      throw JSON.stringify(error);
    }
  };

  public DeleteMessageBatchCommand = async (Messages: Message[]) => {
    try {
      if (!this.client) throw "sqs client can not init";

      return await this.client.send(
        new DeleteMessageBatchCommand({
          QueueUrl: this.queueUrl,

          Entries: Messages.map((message) => ({
            Id: message.MessageId,

            ReceiptHandle: message.ReceiptHandle,
          })),
        }),
      );
    } catch (error) {
      throw JSON.stringify(error);
    }
  };
}

export const sqsClient = new SqsService();
