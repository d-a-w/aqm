import { Module, HttpModule } from '@nestjs/common';
import { CronService } from './cron.service';
import { StorageQueueService } from 'src/common/storage-queue/storage-queue.service';

@Module({
  providers: [CronService, StorageQueueService],
  imports: [HttpModule]
})
export class CronModule {}
