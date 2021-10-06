import { Injectable, Logger } from '@nestjs/common';
import { QueueEnum } from './../enum/queue.enum';
import {
  StorageSharedKeyCredential,
  QueueClient,
  QueueServiceClient,
  QueueSendMessageResponse,
  QueuePeekMessagesResponse,
  ReceivedMessageItem,
  QueueGetPropertiesResponse,
  QueueUpdateMessageResponse,
} from '@azure/storage-queue';
import { Observable, from } from 'rxjs';
import { Task } from '../model/task.model';
import { QueuePriorityEnum } from '../enum/priority.enum';

@Injectable()
export class StorageQueueService {
  private readonly logger = new Logger(StorageQueueService.name);
  account: string;
  accountKey: string;
  queueServiceClient: QueueServiceClient;
  sharedKeyCredential: StorageSharedKeyCredential;
  constructor() {
    this.account = process.env.ACCOUNT_NAME || '';
    this.accountKey = process.env.ACCOUNT_KEY || '';
    this.sharedKeyCredential = new StorageSharedKeyCredential(
      this.account,
      this.accountKey,
    );
    this.queueServiceClient = new QueueServiceClient(
      // When using AnonymousCredential, following url should include a valid SAS or support public access
      `https://${this.account}.queue.core.windows.net`,
      this.sharedKeyCredential,
    );
  }

  sendMessage(
    message: Task,
    queue: QueueEnum,
  ): Observable<QueueSendMessageResponse> {
    return from(
      this.queueServiceClient
        .getQueueClient(queue)
        .sendMessage(JSON.stringify(message), { messageTimeToLive: -1 }),
    );
  }

  updateMessage(
    messageId: string,
    popReceipt: string,
    message: string,
    visibilityTimeout: number,
    queue: QueueEnum,
  ): Observable<QueueUpdateMessageResponse> {
    return from(
      this.queueServiceClient
        .getQueueClient(queue)
        .updateMessage(messageId, popReceipt, message, visibilityTimeout),
    );
  }
  peekMessage(
    queue: QueueEnum,
    numberOfMessages: number,
  ): Observable<QueuePeekMessagesResponse> {
    return from(
      this.queueServiceClient.getQueueClient(queue).peekMessages({
        numberOfMessages: !!numberOfMessages ? numberOfMessages : 5,
      }),
    );
  }

  receveMessage(queue: QueueEnum, quantity: number) {
    return from(
      this.queueServiceClient.getQueueClient(queue).receiveMessages({
        numberOfMessages: quantity,
        visibilityTimeout: this.getVisibilityTimeout(queue),
      }),
    );
  }

  deleteMessage(queue: QueueEnum, message: ReceivedMessageItem) {
    return from(
      this.queueServiceClient
        .getQueueClient(queue)
        .deleteMessage(message.messageId, message.popReceipt),
    );
  }

  getLength(queue: QueueEnum): Observable<QueueGetPropertiesResponse> {
    return from(this.queueServiceClient.getQueueClient(queue).getProperties());
  }

  getQueueByPriority(priority: QueuePriorityEnum): QueueEnum {
    switch (priority) {
      case QueuePriorityEnum.High:
        return QueueEnum.HighPriority;
      case QueuePriorityEnum.Middle:
        return QueueEnum.MiddlePriority;
      case QueuePriorityEnum.Low:
        return QueueEnum.LowPriority;
    }
  }

  getVisibilityTimeout(queue: QueueEnum): number {
    switch (queue) {
      case QueueEnum.HighPriority:
        return Number(process.env.HIGH_PRIORITY_VISIBILITY_TIMEOUT || 30);
      case QueueEnum.MiddlePriority:
        return Number(process.env.MIDDLE_PRIORITY_VISIBILITY_TIMEOUT || 30);
      case QueueEnum.LowPriority:
        return Number(process.env.LOW_PRIORITY_VISIBILITY_TIMEOUT || 30);
    }
  }
}
