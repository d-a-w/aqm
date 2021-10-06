import { QueuePriorityEnum } from '../enum/priority.enum';

import { IsDefined, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { HttpMethodEnum } from '../enum/httpMethod.enum';

export class Task {
  @ApiProperty({enum: ['high', 'middle', 'low']})
  @IsEnum(QueuePriorityEnum)
  priority: QueuePriorityEnum;
  @ApiProperty()
  @IsDefined()
  param: any;
  @ApiProperty({enum: ['post', 'get', 'put', 'delete']})
  @IsEnum(HttpMethodEnum)
  httpMethod: HttpMethodEnum;
  @ApiProperty()
  @IsDefined()
  url: string;
  @ApiProperty()
  @IsDefined()
  retry: number;
}
