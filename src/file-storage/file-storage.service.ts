import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MinioService } from 'nestjs-minio-client';
import internal from 'stream';

@Injectable()
export class FileStorageService implements OnModuleInit {
  private bucketName: string;
  constructor(
    private readonly configService: ConfigService,
    private readonly minioService: MinioService,
  ) {}

  async onModuleInit() {
    await ConfigModule.envVariablesLoaded;
    this.bucketName = this.configService.get('MINIO_SERVICE_BUCKET_NAME');
  }

  async getObject(
    fileName: string,
    bucketName?: string,
  ): Promise<internal.Readable | null> {
    try {
      return await this.minioService.client.getObject(
        bucketName || this.bucketName,
        fileName,
      );
    } catch (e) {
      console.error(e);
    }

    return null;
  }
}
