import { Injectable } from '@nestjs/common';
import { AppConfigService } from '@/src/common/app-config/service/app-config.service';
import { IAudioTranscriptionService } from '@/src/common/gen-ai-models/audio-transcription.interface';
import { GeminiClientService } from '@/src/common/gen-ai-models/gemini/gemini-client.service';
import { OpenAiClientService } from '@/src/common/gen-ai-models/open-ai/open-ai-client.service';
import { AzureAiClientService } from '@/src/common/gen-ai-models/azure-ai/azure-ai-client.service';
import { CloudflareAiClientService } from '@/src/common/gen-ai-models/cloudflare-ai/cloudflare-ai-client.service';
import { GEN_AI_AUDIO_TRANSCRIPTION_PLATFORM } from '@/src/common/utils';

@Injectable()
export class AudioTranscriptionProviderFactory {
  constructor(
    private geminiClient: GeminiClientService,
    private openAiClient: OpenAiClientService,
    private azureAiClient: AzureAiClientService,
    private cloudflareAiClient: CloudflareAiClientService,
  ) {}

  getProvider(): IAudioTranscriptionService {
    const provider = AppConfigService.appConfig.GEN_AI_AUDIO_TRANSCRIPTION_PROVIDER;
    switch (provider) {
      case GEN_AI_AUDIO_TRANSCRIPTION_PLATFORM.GOOGLE_GENAI:
        return this.geminiClient;
      case GEN_AI_AUDIO_TRANSCRIPTION_PLATFORM.OPENAI:
        return this.openAiClient;
      case GEN_AI_AUDIO_TRANSCRIPTION_PLATFORM.AZURE_AI:
        return this.azureAiClient;
      case GEN_AI_AUDIO_TRANSCRIPTION_PLATFORM.CLOUDFLARE_AI:
        return this.cloudflareAiClient;
      default:
        throw new Error(
          `Unknown provider "${provider}". Set GEN_AI_AUDIO_TRANSCRIPTION_PROVIDER to one of: ${Object.values(GEN_AI_AUDIO_TRANSCRIPTION_PLATFORM).join(', ')}`,
        );
    }
  }
}
