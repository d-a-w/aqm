import { Controller, Get, Query, Param, Post, Body } from '@nestjs/common';
import { StorageQueueService } from 'src/common/storage-queue/storage-queue.service';
import { QueueEnum } from 'src/common/enum/queue.enum';
import { ReceivedMessageItem, PeekedMessageItem } from '@azure/storage-queue';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Task } from 'src/common/model/task.model';
import { ApiBody, ApiResponse } from '@nestjs/swagger';

@Controller('queue')
export class QueueController {
  constructor(private storageQueueService: StorageQueueService) {}

  @Get('dequeue-last-message/:queue')
  @ApiResponse({ status: 200, type: Object })
  dequeueLastMessage(
    @Param('queue') queue: QueueEnum,
  ): Observable<ReceivedMessageItem[]> {
    return this.storageQueueService
      .receveMessage(queue, 1)
      .pipe(map(res => res.receivedMessageItems));
  }

  @Get('peek-messages/:queue')
  @ApiResponse({ status: 200, type: Object })
  getLastMessage(
    @Param('queue') queue: QueueEnum,
  ): Observable<PeekedMessageItem[]> {
    return this.storageQueueService
      .peekMessage(queue, 5)
      .pipe(map(res => res.peekedMessageItems));
  }

  @Get('length/:queue')
  @ApiResponse({ status: 200, type: Object })
  queueLength(
    @Param('queue') queue: QueueEnum,
  ): Observable<number> {
    return this.storageQueueService
      .getLength(queue)
      .pipe(map(res => res.approximateMessagesCount));
  }

  @Post()
  @ApiBody({ type: Task })
  @ApiResponse({ status: 200, type: Task })
  postMessage(@Body() task: Task) {
    return this.storageQueueService
      .sendMessage(
        task,
        this.storageQueueService.getQueueByPriority(task.priority),
      )
      .pipe(
        map(res => {
          delete res._response;
          return res;
        }),
      );
  }
}
