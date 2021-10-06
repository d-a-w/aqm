import { Module } from '@nestjs/common';
import { QueueController } from './queue.controller';
import { StorageQueueService } from 'src/common/storage-queue/storage-queue.service';

@Module({
    controllers: [QueueController],
    providers: [StorageQueueService]
})
export class QueueModule {}
