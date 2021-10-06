import { QueuePriorityEnum } from '../enum/priority.enum';

import { IsDefined, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Log {

  @IsDefined()
  @ApiProperty()
  table: string;
  @IsDefined()
  @ApiProperty()
  id: number;
  @ApiProperty()
  format: string;
}
