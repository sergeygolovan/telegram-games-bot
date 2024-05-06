import { Module } from '@nestjs/common';
import { FileStorageService } from './file-storage.service';
import { MinioModule } from 'nestjs-minio-client';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MinioModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        endPoint: configService.get('MINIO_SERVICE_HOST'),
        port: Number(configService.get('MINIO_SERVICE_PORT')),
        accessKey: configService.get('MINIO_SERVICE_ACCESS_KEY'),
        secretKey: configService.get('MINIO_SERVICE_SECRET_KEY'),
        useSSL: false,
      }),
    }),
  ],
  providers: [FileStorageService],
  exports: [FileStorageService],
})
export class FileStorageModule {}
