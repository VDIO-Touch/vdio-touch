import { Injectable } from '@nestjs/common';
import { AppConfigService } from '@/src/common/app-config/service/app-config.service';
import { terminal, Utils } from 'video-touch-common';
import console from 'node:console';

/**
 * rclone infers Content-Type from the file extension, but it has no mapping for
 * .m3u8: it is absent from Go's builtin table, and the worker image ships no
 * /etc/mime.types. Playlists would upload as application/octet-stream unless the
 * type is set explicitly. Every other extension we upload (.ts, .mp4, .mp3,
 * .json) is detected correctly, so only playlists need the override.
 *
 * Installing a mime database instead is not an option: Debian maps .ts to Qt
 * Linguist sources, which would retag every video segment as text.
 */
const M3U8_CONTENT_TYPE = 'application/vnd.apple.mpegurl';

@Injectable()
export class R2ClientService {
  async syncMainManifestFile(assetId: string): Promise<any> {
    let mainManifestPath = Utils.getMainManifestPath(assetId, AppConfigService.appConfig.TEMP_VIDEO_DIRECTORY);
    const r2ManifestPath = Utils.getServerManifestPath(assetId);

    const res = await this.syncFileToR2(mainManifestPath, r2ManifestPath, M3U8_CONTENT_TYPE);

    console.log('manifest uploaded to R2:', res);
    return res;
  }

  /**
   * Syncs a single file to R2
   * @param localFile - Absolute path to local file
   * @param r2FilePath - Remote path including filename (e.g., "videos/video.mp4")
   * @param contentType - Overrides rclone's extension-based detection
   */
  async syncFileToR2(localFile: string, r2FilePath: string, contentType?: string) {
    console.log(`[R2] Uploading file: ${localFile} -> ${r2FilePath}`);

    let command = `rclone copyto "${localFile}" "${this.getRemote(r2FilePath)}" --inplace`;
    if (contentType) {
      command += ` --header-upload "Content-Type: ${contentType}"`;
    }

    return terminal(command);
  }

  /**
   * Syncs a directory to R2
   * @param localDir - Absolute path to local folder
   * @param r2Dir - Remote folder path (e.g., "videos/folder_id")
   */
  async syncDirToR2(localDir: string, r2Dir: string) {
    console.log(`[R2] Syncing directory: ${localDir} -> ${r2Dir}`);

    const remote = this.getRemote(r2Dir);
    const flags = `--inplace --transfers 16 --fast-list`;

    // Two passes, because --header-upload applies to every file in a transfer.
    // Segments first, so the playlist only appears once what it references is
    // already uploaded.
    const segmentsRes = await terminal(`rclone sync "${localDir}" "${remote}" ${flags} --delete-after \
      --exclude "*.m3u8"`);
    console.log('[R2] segments synced:', segmentsRes);

    return terminal(`rclone copy "${localDir}" "${remote}" ${flags} \
      --include "*.m3u8" \
      --header-upload "Content-Type: ${M3U8_CONTENT_TYPE}"`);
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
