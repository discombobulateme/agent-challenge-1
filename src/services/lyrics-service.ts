import { HfInference } from '@huggingface/inference'

export class LyricsService {
  constructor(
    private readonly hf: HfInference,
    private readonly model: string = 'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B',
    private readonly maxLength: number = 200,
    private readonly temperature: number = 0.6
  ) {}

  async generateLyrics(topic: string, style?: string, mood?: string): Promise<string> {
    const prompt = this.createSongPrompt(topic, style, mood)

    // Following DeepSeek's recommendations:
    // 1. Start with <think>
    // 2. No system prompt, all instructions in user prompt
    // 3. Temperature between 0.5-0.7 (0.6 recommended)
    const response = await this.hf.textGeneration({
      model: this.model,
      inputs: `<think>\n${prompt}`,
      parameters: {
        max_new_tokens: this.maxLength,
        temperature: this.temperature,
        return_full_text: false,
        do_sample: true,
        top_p: 0.9,
        repetition_penalty: 1.1 // Help prevent repetitive lyrics
      }
    })

    return this.formatLyrics(response.generated_text)
  }

  private createSongPrompt(topic: string, style?: string, mood?: string): string {
    const styleStr = style ? `in ${style} style` : ''
    const moodStr = mood ? `with a ${mood} mood` : ''
    const context = [styleStr, moodStr].filter(s => s).join(' ')

    return `Let's write a song ${context ? context + ' ' : ''}about ${topic}. 
Please follow these steps:
1. First, think about the main theme and emotions we want to convey
2. Then, create engaging lyrics with clear verses and a chorus
3. Make sure the lyrics tell a cohesive story
4. Add a bridge if it enhances the song's structure

Please write the lyrics in this format:

Verse 1:
[First verse lyrics]

Chorus:
[Chorus lyrics]

Verse 2:
[Second verse lyrics]

[Continue with Bridge and/or additional verses as needed]`
  }

  private formatLyrics(lyrics: string): string {
    return lyrics
      .trim()
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n')
  }
}
