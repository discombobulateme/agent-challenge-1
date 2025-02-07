import { AudioContext } from 'node-web-audio-api'

export class MusicService {
  constructor(
    private readonly apiToken: string,
    private readonly model: string = 'facebook/musicgen-small'
  ) {}

  async generateMusic(lyrics: string, style?: string, mood?: string): Promise<Blob> {
    // Create a musical prompt based on style and mood
    const musicPrompt =
      `${style || 'pop'} instrumental music with ${mood || 'upbeat'} mood, ` +
      `melodic and atmospheric, with a clear rhythm that matches these lyrics: ${lyrics.split('\n')[0]}`

    // Use MusicGen for instrumental accompaniment
    const response = await fetch(`https://api-inference.huggingface.co/models/${this.model}`, {
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({
        inputs: musicPrompt
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to generate music: ${response.statusText}`)
    }

    return await response.blob()
  }

  async mixAudio(vocalsData: ArrayBuffer, musicBlob: Blob): Promise<Blob> {
    try {
      // Convert music blob to array buffer
      const musicBuffer = await musicBlob.arrayBuffer()

      // Create audio context
      const audioContext = new AudioContext()

      // Decode both audio buffers
      const [decodedVocals, decodedMusic] = await Promise.all([
        audioContext.decodeAudioData(vocalsData),
        audioContext.decodeAudioData(musicBuffer)
      ])

      // Get the longest duration
      const maxLength = Math.max(decodedVocals.length, decodedMusic.length)

      // Create a new buffer for the mix
      const mixBuffer = audioContext.createBuffer(
        Math.max(decodedVocals.numberOfChannels, decodedMusic.numberOfChannels),
        maxLength,
        audioContext.sampleRate
      )

      // Mix the audio
      for (let channel = 0; channel < mixBuffer.numberOfChannels; channel++) {
        const mixChannelData = mixBuffer.getChannelData(channel)
        const vocalsChannelData =
          channel < decodedVocals.numberOfChannels
            ? decodedVocals.getChannelData(channel)
            : new Float32Array(maxLength)
        const musicChannelData =
          channel < decodedMusic.numberOfChannels
            ? decodedMusic.getChannelData(channel)
            : new Float32Array(maxLength)

        for (let i = 0; i < maxLength; i++) {
          // Mix with 70% vocals and 30% music
          mixChannelData[i] =
            (i < vocalsChannelData.length ? vocalsChannelData[i] : 0) * 0.7 +
            (i < musicChannelData.length ? musicChannelData[i] : 0) * 0.3
        }
      }

      // Convert the mixed buffer to WAV format
      const numberOfChannels = mixBuffer.numberOfChannels
      const length = mixBuffer.length * numberOfChannels * 2
      const buffer = new ArrayBuffer(44 + length)
      const view = new DataView(buffer)

      // Write WAV header
      const writeString = (view: DataView, offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i))
        }
      }

      writeString(view, 0, 'RIFF') // RIFF identifier
      view.setUint32(4, 36 + length, true) // file length minus RIFF identifier length and file description length
      writeString(view, 8, 'WAVE') // WAVE identifier
      writeString(view, 12, 'fmt ') // format chunk identifier
      view.setUint32(16, 16, true) // format chunk length
      view.setUint16(20, 1, true) // sample format (1 is PCM)
      view.setUint16(22, numberOfChannels, true) // number of channels
      view.setUint32(24, audioContext.sampleRate, true) // sample rate
      view.setUint32(28, audioContext.sampleRate * 2, true) // byte rate
      view.setUint16(32, numberOfChannels * 2, true) // block align
      view.setUint16(34, 16, true) // bits per sample
      writeString(view, 36, 'data') // data chunk identifier
      view.setUint32(40, length, true) // data chunk length

      // Write audio data
      const samples = new Int16Array(buffer, 44, length / 2)
      let sampleIndex = 0
      for (let i = 0; i < mixBuffer.length; i++) {
        for (let channel = 0; channel < numberOfChannels; channel++) {
          const sample = Math.max(-1, Math.min(1, mixBuffer.getChannelData(channel)[i]))
          samples[sampleIndex++] = sample < 0 ? sample * 0x8000 : sample * 0x7fff
        }
      }

      return new Blob([buffer], { type: 'audio/wav' })
    } catch (error) {
      console.error('Error mixing audio:', error)
      throw error
    }
  }
}
