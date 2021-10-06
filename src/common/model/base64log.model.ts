import { QueuePriorityEnum } from '../enum/priority.enum';

import { IsDefined, IsEnum } from 'class-validator';
import { Log } from './log.model';
import { ApiProperty } from '@nestjs/swagger';

export class Base64Log extends Log{
  @IsDefined()
  @ApiProperty()
  file: string;
}
