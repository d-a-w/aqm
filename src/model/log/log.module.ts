import { Module } from '@nestjs/common';
import { LogController } from './log.controller';
import { BlobStorageService } from 'src/common/blob-storage/blob-storage.service';

@Module({
  controllers: [LogController],
  providers: [BlobStorageService],
})
export class LogModule {}
