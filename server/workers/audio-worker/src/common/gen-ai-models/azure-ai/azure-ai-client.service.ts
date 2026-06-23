import { Injectable, OnModuleInit } from '@nestjs/common';
import { AppConfigService } from '@/src/common/app-config/service/app-config.service';
import { OpenAI } from 'openai';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createWriteStream } from 'fs';
import { HttpService } from '@nestjs/axios';
import { IAudioTranscriptionService } from '@/src/common/gen-ai-models/audio-transcription.interface';

type SupportedAudioFormat = 'mp3' | 'wav';

function getAudioFormat(filePath: string): SupportedAudioFormat {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.mp3') return 'mp3';
  if (ext === '.wav') return 'wav';
  throw new Error(`Unsupported audio format: ${ext}. Expected mp3 or wav.`);
}

@Injectable()
export class AzureAiClientService implements OnModuleInit, IAudioTranscriptionService {
  private client: OpenAI;
  private promptText: string;

  constructor(private httpService: HttpService) {}

  onModuleInit() {
    const config = AppConfigService.appConfig;
    if (!config.AZURE_OPENAI_API_KEY || !config.AZURE_OPENAI_ENDPOINT) {
      return;
    }
    this.client = new OpenAI({
      apiKey: config.AZURE_OPENAI_API_KEY,
      baseURL: `${config.AZURE_OPENAI_ENDPOINT.replace(/\/$/, '')}/openai/v1/`,
    });
    this.setupPrompt().then(() => {
      console.log('Azure AI prompt loaded');
    });
  }

  async setupPrompt() {
    const promptUrl = AppConfigService.appConfig.TRANSCRIPT_PROMT_FILE_URL;
    const response = await this.httpService.axiosRef.get<string>(promptUrl);
    this.promptText = response.data;
  }

  async transcribeAudio(localFilePath: string, outputFilePath: string): Promise<void> {
    console.log('Starting transcription with Azure OpenAI Responses API...');

    const audioBuffer = await fs.readFile(localFilePath);
    const base64Audio = audioBuffer.toString('base64');
    const audioFormat = getAudioFormat(localFilePath);

    const response = await (this.client.responses as any).create({
      model: AppConfigService.appConfig.AZURE_OPENAI_DEPLOYMENT,
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: this.promptText,
            },
            {
              type: 'input_audio',
              input_audio: {
                data: base64Audio,
                format: audioFormat,
              },
            },
          ],
        },
      ],
    });

    const raw: string = response.output_text.trim();
    const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');

    let formattedOutput: Array<{ start: string; end: string; text: string }>;
    try {
      formattedOutput = JSON.parse(cleaned);
    } catch {
      throw new Error(`Azure AI returned invalid JSON: ${cleaned.slice(0, 200)}`);
    }

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
}
