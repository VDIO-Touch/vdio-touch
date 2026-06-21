import { Injectable, OnModuleInit } from '@nestjs/common';
import { AppConfigService } from '@/src/common/app-config/service/app-config.service';
import { AzureOpenAI } from 'openai';
import * as fs from 'node:fs';
import { createWriteStream } from 'fs';
import { IAudioTranscriptionService } from '@/src/common/gen-ai-models/audio-transcription.interface';

@Injectable()
export class AzureAiClientService implements OnModuleInit, IAudioTranscriptionService {
  private aiClient: AzureOpenAI;

  onModuleInit() {
    const config = AppConfigService.appConfig;
    if (!config.AZURE_OPENAI_API_KEY || !config.AZURE_OPENAI_ENDPOINT) {
      return;
    }
    this.aiClient = new AzureOpenAI({
      apiKey: config.AZURE_OPENAI_API_KEY,
      endpoint: config.AZURE_OPENAI_ENDPOINT,
      apiVersion: config.AZURE_OPENAI_API_VERSION || '2024-06-01',
      deployment: config.AZURE_OPENAI_DEPLOYMENT,
    });
  }

  async transcribeAudio(localFilePath: string, outputFilePath: string): Promise<void> {
    console.log('Starting transcription with Azure OpenAI...');

    const transcription = await this.aiClient.audio.transcriptions.create({
      file: fs.createReadStream(localFilePath),
      model: AppConfigService.appConfig.AZURE_OPENAI_DEPLOYMENT,
      response_format: 'verbose_json',
      timestamp_granularities: ['segment'],
    });

    const segments = (transcription as any).segments || [];
    const formattedOutput = segments.map((segment: any) => ({
      start: this.secondsToTimestamp(segment.start),
      end: this.secondsToTimestamp(segment.end),
      text: segment.text.trim(),
    }));

    const writeStream = createWriteStream(outputFilePath);
    writeStream.write(JSON.stringify(formattedOutput, null, 2));

    await new Promise<void>((resolve, reject) => {
      writeStream.end(() => {
        console.log(`Azure transcription completed. Processed ${formattedOutput.length} segments.`);
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
