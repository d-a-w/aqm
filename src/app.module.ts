import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { QueueModule } from './model/queue/queue.module';
import { LogModule } from './model/log/log.module';
import { CronModule } from './service/cron/cron.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [QueueModule, LogModule, CronModule, ScheduleModule.forRoot()],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {

  
}
