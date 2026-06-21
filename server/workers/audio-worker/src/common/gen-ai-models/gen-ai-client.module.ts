import { Module } from '@nestjs/common';
import { GeminiClientService } from '@/src/common/gen-ai-models/gemini/gemini-client.service';
import { OpenAiClientService } from '@/src/common/gen-ai-models/open-ai/open-ai-client.service';
import { AzureAiClientService } from '@/src/common/gen-ai-models/azure-ai/azure-ai-client.service';
import { CloudflareAiClientService } from '@/src/common/gen-ai-models/cloudflare-ai/cloudflare-ai-client.service';
import { AudioTranscriptionProviderFactory } from '@/src/common/gen-ai-models/audio-transcription-provider.factory';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [GeminiClientService, OpenAiClientService, AzureAiClientService, CloudflareAiClientService, AudioTranscriptionProviderFactory],
  exports: [GeminiClientService, OpenAiClientService, AzureAiClientService, CloudflareAiClientService, AudioTranscriptionProviderFactory],
})
export class GenAiClientModule {}
