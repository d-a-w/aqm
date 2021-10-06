import { Injectable, Logger, HttpService } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { QueuePriorityEnum } from 'src/common/enum/priority.enum';
import { Observable, forkJoin, from } from 'rxjs';
import { AxiosResponse } from 'axios';
import { StorageQueueService } from 'src/common/storage-queue/storage-queue.service';
import {
  QueueGetPropertiesResponse,
  ReceivedMessageItem,
} from '@azure/storage-queue';
import { QueueEnum } from 'src/common/enum/queue.enum';
import { Task } from 'src/common/model/task.model';
import { HttpMethodEnum } from 'src/common/enum/httpMethod.enum';
@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private storageQueueService: StorageQueueService,
    private httpService: HttpService,
  ) {}
  @Interval(!!process.env.CRON_INTERVAL ? Number(process.env.CRON_INTERVAL) : 1000)
  handleCron() {
    this.logger.debug(`Called every ${!!process.env.CRON_INTERVAL ? Number(process.env.CRON_INTERVAL) : 1000} milliseconds`);
    forkJoin(
      this.storageQueueService.peekMessage(QueueEnum.HighPriority, 1),
      this.storageQueueService.peekMessage(QueueEnum.MiddlePriority, 1),
      this.storageQueueService.peekMessage(QueueEnum.LowPriority, 1),
    ).subscribe(([highPriorityRes, middlePriorityRes, lowPriorityRes]) => {
      if (highPriorityRes.peekedMessageItems.length) {
        this.processQueue(QueueEnum.HighPriority, 5);
      } else if (middlePriorityRes.peekedMessageItems.length) {
        this.processQueue(QueueEnum.MiddlePriority, 1);
      } else if (lowPriorityRes.peekedMessageItems.length) {
        this.processQueue(QueueEnum.LowPriority, 1);
      }
    });
  }
  processQueue(queue: QueueEnum, quantity: number) {
    this.storageQueueService
      .receveMessage(queue, quantity)
      .subscribe(receveMessageRes => {
        receveMessageRes.receivedMessageItems.forEach(message => {
          let task: Task = JSON.parse(message.messageText);
          console.log(`task: ${JSON.stringify(task)}`);
          switch (task.httpMethod) {
            case HttpMethodEnum.Get:
              this.processAxiosResponse(
                this.httpService.get(task.url),
                message,
                queue,
                task,
              );
              break;
            case HttpMethodEnum.Post:
              this.processAxiosResponse(
                this.httpService.post(task.url, task.param),
                message,
                queue,
                task,
              );
              break;
            case HttpMethodEnum.Put:
              this.processAxiosResponse(
                this.httpService.put(task.url, task.param),
                message,
                queue,
                task,
              );
              break;
            case HttpMethodEnum.Delete:
              this.processAxiosResponse(
                this.httpService.delete(task.url),
                message,
                queue,
                task,
              );
              break;
          }
        });
      });
  }
  processAxiosResponse(
    axiosResponseObservable: Observable<AxiosResponse<any>>,
    message: ReceivedMessageItem,
    queue: QueueEnum,
    task: Task,
  ) {
    if (message.dequeueCount >= task.retry) {
      this.storageQueueService
        .sendMessage(task, this.getPoison(queue))
        .subscribe(
          res => {
            this.storageQueueService.deleteMessage(queue, message).subscribe(
              res => {
                this.logger.debug(
                  `Message deleted successfully: ${JSON.stringify(message)}`,
                );
              },
              err => {
                this.logger.error(
                  `Cannot delete message: ${JSON.stringify(
                    message,
                  )}, Err: ${err}`,
                );
              },
            );
          },
          err => {
            this.logger.error(
              `Cannot move message to poison queue: ${JSON.stringify(
                message,
              )}, Err: ${err}`,
            );
          },
        );
    } else {
      axiosResponseObservable.subscribe(
        res => {
          this.storageQueueService.deleteMessage(queue, message).subscribe(
            () => {
              this.logger.debug(
                `Message executed successfully. Message: ${JSON.stringify(
                  message,
                )} Response: ${JSON.stringify(res.data)}`,
              );
            },
            err => {
              this.logger.error(
                `Cannot delete message: ${JSON.stringify(
                  message,
                )}, Err: ${err}`,
              );
            },
          );
        },
        err => {
          this.storageQueueService
            .updateMessage(
              message.messageId,
              message.popReceipt,
              message.messageText,
              5,
              queue,
            )
            .subscribe(() => {
              this.logger.debug(`Message updated: ${JSON.stringify(message)}`);
            }),
            err => {
              this.logger.error(
                `Cannot update queue message: ${message.messageId}, ${message.popReceipt}, ${message.messageText}, ${queue} Err: ${err}`,
              );
            };
        },
      );
    }
  }

  getPoison(queue: QueueEnum): QueueEnum {
    switch (queue) {
      case QueueEnum.HighPriority:
        return QueueEnum.HighPriorityPoison;
      case QueueEnum.MiddlePriority:
        return QueueEnum.MiddlePriorityPoison;
      case QueueEnum.LowPriority:
        return QueueEnum.LowPriorityPoison;
      default:
        return QueueEnum.Poison;
    }
  }

  getQueueLength(
    priority: QueuePriorityEnum,
  ): Observable<QueueGetPropertiesResponse> {
    const queue = this.storageQueueService.getQueueByPriority(priority);
    return this.storageQueueService.getLength(queue);
  }
}
