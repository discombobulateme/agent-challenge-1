export class VocalsService {
  constructor(
    private readonly apiToken: string,
    private readonly model: string = 'speechbrain/tts-tacotron2-ljspeech'
  ) {}

  async generateVocals(lyrics: string): Promise<ArrayBuffer> {
    // Split lyrics into sentences for better TTS processing
    const sentences = lyrics
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => line.trim())

    // Generate TTS for each sentence
    const audioPromises = sentences.map(async sentence => {
      const response = await fetch(`https://api-inference.huggingface.co/models/${this.model}`, {
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({ inputs: sentence })
      })

      if (!response.ok) {
        throw new Error(`Failed to generate vocals: ${response.statusText}`)
      }

      // Get the audio data as ArrayBuffer
      return await response.arrayBuffer()
    })

    // Wait for all TTS generations to complete
    const audioBuffers = await Promise.all(audioPromises)

    // Combine all audio buffers
    const totalLength = audioBuffers.reduce((sum, buffer) => sum + buffer.byteLength, 0)
    const combinedBuffer = new ArrayBuffer(totalLength)
    const view = new Uint8Array(combinedBuffer)

    let offset = 0
    for (const buffer of audioBuffers) {
      view.set(new Uint8Array(buffer), offset)
      offset += buffer.byteLength
    }

    return combinedBuffer
  }
}
