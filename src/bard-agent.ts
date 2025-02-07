import { Agent } from '@openserv-labs/sdk'
import { HfInference } from '@huggingface/inference'
import { z } from 'zod'
import { LyricsService } from './services/lyrics-service'
import { VocalsService } from './services/vocals-service'
import { MusicService } from './services/music-service'
import { FileService } from './services/file-service'
import crypto from 'crypto'

// Configuration schema for the Bard agent
const BardConfigSchema = z.object({
  lyricModel: z.string().default('deepseek-ai/DeepSeek-R1-Distill-Qwen-32B'),
  vocalModel: z.string().default('speechbrain/tts-tacotron2-ljspeech'),
  musicModel: z.string().default('facebook/musicgen-small'),
  maxLength: z.number().default(200),
  temperature: z.number().min(0).max(1).default(0.6) // DeepSeek recommends 0.6
})

type BardConfig = z.infer<typeof BardConfigSchema>

// Type for Tacotron2 response
interface TTSResponse {
  audio: number[]
  sampling_rate: number
}

export class BardAgent extends Agent {
  private readonly hf: HfInference
  private readonly config: BardConfig
  private readonly lyricsService: LyricsService
  private readonly vocalsService: VocalsService
  private readonly musicService: MusicService
  private readonly fileService: FileService

  constructor() {
    super({
      systemPrompt:
        'You are a creative AI bard that generates original song lyrics and music based on user requests.'
    })

    if (!process.env.HF_TOKEN) {
      throw new Error('HF_TOKEN environment variable is not set')
    }

    this.hf = new HfInference(process.env.HF_TOKEN)
    this.config = BardConfigSchema.parse({})

    // Initialize services
    this.lyricsService = new LyricsService(
      this.hf,
      this.config.lyricModel,
      this.config.maxLength,
      this.config.temperature
    )
    this.vocalsService = new VocalsService(process.env.HF_TOKEN, this.config.vocalModel)
    this.musicService = new MusicService(process.env.HF_TOKEN, this.config.musicModel)
    this.fileService = new FileService()

    // Add song generation capability
    this.addCapability({
      name: 'generate_song',
      description: 'Generates original song lyrics and music based on a given topic or theme',
      schema: z.object({
        topic: z.string(),
        style: z.string().optional(),
        mood: z.string().optional()
      }),
      run: async ({ args }) => {
        try {
          // Generate a unique ID for this song
          const songId = crypto.randomBytes(8).toString('hex')
          let lyrics = ''
          let vocalsData: ArrayBuffer | null = null
          let musicBlob: Blob | null = null
          let mixedBlob: Blob | null = null

          try {
            // Step 1: Generate lyrics using DeepSeek
            lyrics = await this.lyricsService.generateLyrics(args.topic, args.style, args.mood)
            console.log('Lyrics generated successfully')
          } catch (error) {
            console.error('Failed to generate lyrics:', error)
            throw error
          }

          try {
            // Step 2: Generate vocal track using Tacotron2
            vocalsData = await this.vocalsService.generateVocals(lyrics)
            console.log('Vocals generated successfully')
          } catch (error) {
            console.error('Failed to generate vocals:', error)
          }

          try {
            // Step 3: Generate musical accompaniment using MusicGen
            musicBlob = await this.musicService.generateMusic(lyrics, args.style, args.mood)
            console.log('Music generated successfully')
          } catch (error) {
            console.error('Failed to generate music:', error)
          }

          try {
            // Step 4: Mix the audio tracks (only if we have both vocals and music)
            if (vocalsData && musicBlob) {
              mixedBlob = await this.musicService.mixAudio(vocalsData, musicBlob)
              console.log('Audio tracks mixed successfully')
            }
          } catch (error) {
            console.error('Failed to mix audio:', error)
          }

          // Step 5: Save whatever files we were able to generate
          const files = await this.fileService.saveSongFiles(
            songId,
            lyrics,
            vocalsData,
            musicBlob,
            mixedBlob
          )
          console.log('Files saved successfully')

          // Format the response as a string
          let response = `🎵 Generated Song 🎵\n\n` + `Lyrics:\n${lyrics}\n\n`

          if (files) {
            response += `Files saved in music-examples/${songId}/:\n`
            if (files.lyricsPath) response += `- Lyrics: ${files.lyricsPath}\n`
            if (files.vocalsPath) response += `- Vocals: ${files.vocalsPath}\n`
            if (files.musicPath) response += `- Music: ${files.musicPath}\n`
            if (files.mixPath) response += `- Final Mix: ${files.mixPath}\n\n`
          }

          response += `Audio Layers:\n`
          if (vocalsData) response += `- Vocals: Generated using Tacotron2\n`
          if (musicBlob)
            response += `- Music: Generated using MusicGen [${Math.round(musicBlob.size / 1024)}KB]\n`
          if (mixedBlob)
            response += `- Final Mix: Combined audio [${Math.round(mixedBlob.size / 1024)}KB]`

          return response
        } catch (error) {
          console.error('Error generating song:', error)

          if (error instanceof Error) {
            if (error.message.includes('auth method')) {
              throw new Error(
                'Authentication failed. Please check your Hugging Face token has the necessary permissions.'
              )
            } else if (error.message.includes('model')) {
              throw new Error(
                'Model access error. Please check if you have access to the specified models.'
              )
            }
          }

          throw new Error(
            'Failed to generate song. Please try again later or contact support if the issue persists.'
          )
        }
      }
    })
  }
}
