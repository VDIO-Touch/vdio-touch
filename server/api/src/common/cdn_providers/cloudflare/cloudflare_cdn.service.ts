import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AppConfigService } from '@/src/common/app-config/service/app-config.service';
import { firstValueFrom } from 'rxjs';

// Cloudflare API version is pinned in code, not env — bump it here when
// Cloudflare ships a new API version. The host lives in CLOUDFLARE_CDN_API_BASE_URL.
const CLOUDFLARE_API_VERSION = 'client/v4';

@Injectable()
export class CloudflareCdnService {
  constructor(private httpService: HttpService) {}

  /**
   * Purges cached objects on Cloudflare by URL. Cloudflare's purge-by-URL API
   * requires absolute URLs (not bucket-relative paths), so the caller must
   * prepend the CDN base URL before calling this.
   * @param urls - Absolute URLs to purge (e.g. "https://cdn.example.com/<asset>/master.m3u8")
   */
  async clearCache(urls: string[]): Promise<void> {
    try {
      const res = await firstValueFrom(
        this.httpService.post(
          `${AppConfigService.appConfig.CLOUDFLARE_CDN_API_BASE_URL}/${CLOUDFLARE_API_VERSION}/zones/${AppConfigService.appConfig.CLOUDFLARE_CDN_ZONE_ID}/purge_cache`,
          {
            files: urls,
          },
          {
            headers: {
              Authorization: `Bearer ${AppConfigService.appConfig.CLOUDFLARE_CDN_API_TOKEN}`,
            },
          }
        )
      );
      return res.data;
    } catch (e) {
      console.error('Error clearing cache on Cloudflare CDN:', e);
      throw e;
    }
  }
}
