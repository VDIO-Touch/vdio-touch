import { Injectable, OnModuleInit } from '@nestjs/common';
import { AppConfigService } from '@/src/common/app-config/service/app-config.service';
import * as fs from 'node:fs';
import { createWriteStream } from 'fs';
import { HttpService } from '@nestjs/axios';
import { IAudioTranscriptionService } from '@/src/common/gen-ai-models/audio-transcription.interface';

@Injectable()
export class CloudflareAiClientService implements OnModuleInit, IAudioTranscriptionService {
  constructor(private httpService: HttpService) {}

  onModuleInit() {
    const config = AppConfigService.appConfig;
    if (!config.CLOUDFLARE_ACCOUNT_ID || !config.CLOUDFLARE_API_TOKEN) {
      return;
    }
    console.log('CloudflareAiClientService initialized');
  }

  async transcribeAudio(localFilePath: string, outputFilePath: string): Promise<void> {
    console.log('Starting transcription with Cloudflare AI...');

    const config = AppConfigService.appConfig;
    const model = config.CLOUDFLARE_AI_MODEL || '@cf/openai/whisper';

    const audioBuffer = fs.readFileSync(localFilePath);
    const blob = new Blob([audioBuffer], { type: 'audio/mp3' });
    const formData = new FormData();
    formData.append('audio', blob, 'audio.mp3');

    const response = await this.httpService.axiosRef.post(
      `https://api.cloudflare.com/client/v4/accounts/${config.CLOUDFLARE_ACCOUNT_ID}/ai/run/${model}`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${config.CLOUDFLARE_API_TOKEN}`,
        },
      },
    );

    const result = response.data?.result || response.data;
    const segments = result.segments || [];

    let formattedOutput: any[];

    if (segments.length > 0) {
      formattedOutput = segments.map((segment: any) => ({
        start: this.secondsToTimestamp(segment.start),
        end: this.secondsToTimestamp(segment.end),
        text: segment.text.trim(),
      }));
    } else {
      formattedOutput = [
        {
          start: '00:00:00',
          end: '00:00:00',
          text: result.text || '',
        },
      ];
    }

    const writeStream = createWriteStream(outputFilePath);
    writeStream.write(JSON.stringify(formattedOutput, null, 2));

    await new Promise<void>((resolve, reject) => {
      writeStream.end(() => {
        console.log(`Cloudflare transcription completed. Processed ${formattedOutput.length} segments.`);
        resolve();
      });
      writeStream.on('error', reject);
    });

    console.log(`Transcription saved to ${outputFilePath}`);
  }

  private secondsToTimestamp(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
}
