import { Injectable } from '@nestjs/common';
import { AppConfigService } from '@/src/common/app-config/service/app-config.service';
import { terminal, Utils } from 'video-touch-common';
import console from 'node:console';

@Injectable()
export class R2ClientService {
  async syncMainManifestFile(assetId: string): Promise<any> {
    let mainManifestPath = Utils.getMainManifestPath(assetId, AppConfigService.appConfig.TEMP_VIDEO_DIRECTORY);
    const r2ManifestPath = Utils.getServerManifestPath(assetId);

    const res = await this.syncFileToR2(mainManifestPath, r2ManifestPath);

    console.log('manifest uploaded to R2:', res);
    return res;
  }

  /**
   * Syncs a single file to R2
   * @param localFile - Absolute path to local file
   * @param r2FilePath - Remote path including filename (e.g., "videos/video.mp4")
   */
  async syncFileToR2(localFile: string, r2FilePath: string) {
    console.log(`[R2] Uploading file: ${localFile} -> ${r2FilePath}`);

    const command = `rclone copyto "${localFile}" "${this.getRemote(r2FilePath)}" --inplace`;

    return terminal(command);
  }

  /**
   * Syncs a directory to R2
   * @param localDir - Absolute path to local folder
   * @param r2Dir - Remote folder path (e.g., "videos/folder_id")
   */
  async syncDirToR2(localDir: string, r2Dir: string) {
    console.log(`[R2] Syncing directory: ${localDir} -> ${r2Dir}`);

    const command = `rclone sync "${localDir}" "${this.getRemote(r2Dir)}" \
      --inplace \
      --transfers 16 \
      --delete-after \
      --fast-list`;

    return terminal(command);
  }

  /**
   * R2 speaks the S3 API, so this is rclone's s3 backend pointed at the
   * Cloudflare endpoint. no_check_bucket is required: R2 rejects the
   * pre-flight bucket check rclone otherwise makes on every transfer.
   */
  private getRemote(remotePath: string): string {
    return `:s3,provider=Cloudflare,access_key_id='${AppConfigService.appConfig.R2_ACCESS_KEY_ID}',secret_access_key='${AppConfigService.appConfig.R2_SECRET_ACCESS_KEY}',endpoint='${this.getEndpoint()}',region='auto',no_check_bucket=true:${AppConfigService.appConfig.R2_BUCKET_NAME}/${remotePath}`;
  }

  private getEndpoint(): string {
    return (
      AppConfigService.appConfig.R2_ENDPOINT ||
      `https://${AppConfigService.appConfig.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    );
  }
}
