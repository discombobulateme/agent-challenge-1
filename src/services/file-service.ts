import fs from 'fs'
import path from 'path'

export class FileService {
  constructor(private readonly outputDir: string = 'music-examples') {
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }
  }

  async saveSongFiles(
    songId: string,
    lyrics: string,
    vocals: ArrayBuffer | null,
    music: Blob | null,
    finalMix: Blob | null
  ): Promise<{
    lyricsPath: string
    vocalsPath?: string
    musicPath?: string
    mixPath?: string
  }> {
    // Create song-specific directory
    const songDir = path.join(this.outputDir, songId)
    if (!fs.existsSync(songDir)) {
      fs.mkdirSync(songDir, { recursive: true })
    }

    const result: {
      lyricsPath: string
      vocalsPath?: string
      musicPath?: string
      mixPath?: string
    } = {
      lyricsPath: ''
    }

    // Save lyrics
    result.lyricsPath = path.join(songDir, 'lyrics.txt')
    fs.writeFileSync(result.lyricsPath, lyrics, 'utf-8')

    // Save vocals if available
    if (vocals) {
      result.vocalsPath = path.join(songDir, 'vocals.wav')
      fs.writeFileSync(result.vocalsPath, Buffer.from(vocals))
    }

    // Save music if available
    if (music) {
      result.musicPath = path.join(songDir, 'music.wav')
      const musicBuffer = Buffer.from(await music.arrayBuffer())
      fs.writeFileSync(result.musicPath, musicBuffer)
    }

    // Save final mix if available
    if (finalMix) {
      result.mixPath = path.join(songDir, 'final-mix.wav')
      const mixBuffer = Buffer.from(await finalMix.arrayBuffer())
      fs.writeFileSync(result.mixPath, mixBuffer)
    }

    return result
  }
}
