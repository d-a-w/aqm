import { Injectable } from '@nestjs/common';
import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  ContainerClient,
  BlobDownloadResponseParsed,
  BlockBlobUploadResponse,
} from '@azure/storage-blob';
import { from, Observable } from 'rxjs';
import { Log } from '../model/log.model';

@Injectable()
export class BlobStorageService {
  account: string;
  accountKey: string;
  blobServiceClient: BlobServiceClient;
  sharedKeyCredential: StorageSharedKeyCredential;
  containerClient: ContainerClient;
  constructor() {
    this.account = process.env.ACCOUNT_NAME || '';
    this.accountKey = process.env.ACCOUNT_KEY || '';

    // Use StorageSharedKeyCredential with storage account and account key
    // StorageSharedKeyCredential is only available in Node.js runtime, not in browsers
    this.sharedKeyCredential = new StorageSharedKeyCredential(
      this.account,
      this.accountKey,
    );
    this.blobServiceClient = new BlobServiceClient(
      // When using AnonymousCredential, following url should include a valid SAS or support public access
      `https://${this.account}.blob.core.windows.net`,
      this.sharedKeyCredential,
    );
    this.containerClient = this.blobServiceClient.getContainerClient(
      'marketplace-data-test',
    );
  }

  upload(content: any, table: string, id: number, format: string): Observable<BlockBlobUploadResponse> {
    const blobName = `${table}/${id}${!!format ? '.'+format : ''}`;
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    return from(blockBlobClient.upload(content, Buffer.byteLength(content)));
  }

  uploadBase64(base64str: any, table: string, id: number, format: string): Observable<BlockBlobUploadResponse> {
    const blobName = `${table}/${id}${!!format ? '.'+format : ''}`;
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    let buffer = Buffer.from(base64str,'base64');
    return from(blockBlobClient.upload(buffer, Buffer.byteLength(buffer)));
  }

  download(url: string): Observable<BlobDownloadResponseParsed>{
    const blockBlobClient = this.containerClient.getBlockBlobClient(url);
    return from(blockBlobClient.download(0));
  }
}
