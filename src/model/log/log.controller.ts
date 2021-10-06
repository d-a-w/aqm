import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  Get,
  Param,
  Res,
} from '@nestjs/common';
import { BlobStorageService } from 'src/common/blob-storage/blob-storage.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Log } from 'src/common/model/log.model';
import { map } from 'rxjs/operators';
import { ApiBody, ApiConsumes, ApiResponse } from '@nestjs/swagger';
import { Stream } from 'stream';
import { Response } from 'express';
import { Base64Log } from 'src/common/model/base64log.model';

@Controller('log')
export class LogController {
  constructor(private blobStorage: BlobStorageService) {}
  @Post('form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        table: {
          type: 'string',
        },
        id: {
          type: 'number',
        },
        format: {
          type: 'string',
        },
      },
    },
  })
  @ApiResponse({ status: 200, type: Object })
  uploadBlob(@UploadedFile() file, @Body() log: Log) {
    return this.blobStorage
      .upload(file.buffer, log.table, log.id, log.format)
      .pipe(
        map(res => {
          delete res.contentMD5;
          return res;
        }),
      );
  }

  @Post('base-64')
  @ApiResponse({ status: 200, type: Object })
  uploadBase64(@Body() log: Base64Log) {
    return this.blobStorage
      .uploadBase64(log.file, log.table, log.id, log.format)
      .pipe(
        map(res => {
          delete res.contentMD5;
          return res;
        }),
      );
  }
  
  @Get('/:path')
  @ApiResponse({ status: 200, type: Stream })
  downloadBlob(@Param('path') path: string, @Res() response: Response) {

    return this.blobStorage.download(path).pipe(
      map(res => {
        return res.readableStreamBody.pipe(response)
      })
    );
  }
}
