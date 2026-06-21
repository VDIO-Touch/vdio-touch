export interface IAudioTranscriptionService {
  transcribeAudio(inputFilePath: string, outputFilePath: string): Promise<void>;
}
