import { Injectable, OnModuleInit } from '@nestjs/common';
import fs from 'fs';
import * as AWS from 'aws-sdk';
import { AppConfigService } from '@/src/common/app-config/service/app-config.service';
import { UploadObjModel } from '@/src/common/aws/s3/models/upload-obj.model';

/**
 * R2 speaks the S3 API, so this is the S3 client pointed at the Cloudflare
 * endpoint. This worker's image has no rclone (unlike upload-video-worker),
 * and it only ever pushes a single thumbnail object, so it uses the SDK
 * directly the same way S3ClientService does.
 */
@Injectable()
export class R2ClientService implements OnModuleInit {
  private r2: AWS.S3;

  onModuleInit() {
    this.r2 = new AWS.S3({
      endpoint: this.getEndpoint(),
      accessKeyId: AppConfigService.appConfig.R2_ACCESS_KEY_ID,
      secretAccessKey: AppConfigService.appConfig.R2_SECRET_ACCESS_KEY,
      // R2 has no regions, but the SDK requires one.
      region: 'auto',
      signatureVersion: 'v4',
      s3ForcePathStyle: true,
      httpOptions: {
        timeout: 0
      }
    });
  }

  getEndpoint(): string {
    return (
      AppConfigService.appConfig.R2_ENDPOINT ||
      `https://${AppConfigService.appConfig.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    );
  }

  async uploadObject(uploadObjModel: UploadObjModel, removeSourceFile: boolean = false) {
    let { bucket, key, filePath, contentType } = uploadObjModel;
    try {
      let params = {
        Bucket: bucket,
        Key: key,
        Body: fs.createReadStream(filePath),
        ContentType: contentType
      };

      let res = await this.r2.upload(params).promise();
      if (removeSourceFile) {
        this.removeFile(filePath);
      }
      return res;
    } catch (e: any) {
      throw new Error(e);
    }
  }

  removeFile(filePath) {
    fs.unlink(filePath, (err) => {
      if (err) throw err;
    });
  }
}