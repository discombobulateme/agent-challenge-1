# Bard AI Agent - OpenServ DevNet Challenge

This project is an AI-powered song generation agent created for the [OpenServ DevNet Challenge](https://platform.openserv.ai). Built on top of the [OpenServ Labs SDK](https://github.com/openserv-labs/sdk) and the agent-starter template, this agent can generate complete songs including lyrics, vocals, and instrumental music.

## Features

- 🎵 Generates original song lyrics using DeepSeek's language model
- 🎤 Converts lyrics to vocals using Tacotron2 text-to-speech
- 🎸 Creates instrumental music using Facebook's MusicGen
- 🎼 Mixes vocals and music into a complete song using Web Audio API
- 💾 Saves all components (lyrics, vocals, music, final mix) in organized directories

## Models Used

- Lyrics: `deepseek-ai/DeepSeek-R1-Distill-Qwen-32B` - A distilled version of DeepSeek for efficient lyrics generation
- Vocals: `speechbrain/tts-tacotron2-ljspeech` - Text-to-speech model for vocal synthesis
- Music: `facebook/musicgen-small` - Compact model for instrumental music generation

## Prerequisites

1. [Hugging Face API Token](https://huggingface.co/settings/tokens) with read access to the required models
2. Node.js and npm installed
3. Sufficient disk space for audio files (each song generates ~7-8MB of data)

## Setup

1. Clone this repository:
```bash
git clone <repository-url>
cd <repository-name>
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```bash
cp .env.example .env
```

4. Add your Hugging Face API token to `.env`:
```
HF_TOKEN=your_token_here
PORT=7378
```

## Usage

1. Start the agent:
```bash
npm run dev
```

2. The agent will start on port 7378 (configurable in `.env`)

3. Send a song generation request:
```typescript
const response = await agent.process({
  messages: [
    {
      role: 'user',
      content: 'Write a rock song with an energetic mood about chasing dreams'
    }
  ]
})
```

4. Generated files will be saved in the `music-examples` directory, organized by song ID:
```
music-examples/
  └── [song-id]/
      ├── lyrics.txt    # Generated lyrics (~1KB)
      ├── vocals.wav    # Vocal track (~2.2MB)
      ├── music.wav     # Instrumental track (~2.1MB)
      └── final-mix.wav # Combined song (~2.7MB)
```

## Configuration

The agent's behavior can be customized through the following parameters:

- `maxLength`: Maximum number of tokens for lyrics generation (default: 200)
- `temperature`: Controls randomness in lyrics generation (default: 0.6)
- `repetition_penalty`: Prevents repetitive lyrics (default: 1.1)
- `top_p`: Controls diversity in text generation (default: 0.9)

### Audio Mixing Configuration

The final mix combines vocals and music with the following settings:
- Vocals: 70% volume
- Music: 30% volume
- Format: 16-bit WAV
- Sample Rate: Automatically matched between tracks
- Channels: Supports both mono and stereo

## Development

- Run in development mode with hot reload:
```bash
npm run dev
```

- Format code:
```bash
npm run format
```

- Lint code:
```bash
npm run lint
```

## Project Structure

```
src/
├── bard-agent.ts         # Main agent implementation
├── index.ts             # Entry point
└── services/
    ├── lyrics-service.ts # Lyrics generation using DeepSeek
    ├── vocals-service.ts # Text-to-speech using Tacotron2
    ├── music-service.ts  # Music generation and audio mixing
    └── file-service.ts   # File management and organization
```

## Technical Details

### Audio Processing
- Uses Web Audio API for high-quality audio processing
- Proper WAV header generation for compatibility
- Automatic sample rate and channel matching
- Buffer-based audio mixing for memory efficiency

### Error Handling
- Graceful degradation if any generation step fails
- Saves successfully generated components even if mixing fails
- Detailed error reporting for troubleshooting

## Credits

- Built with [OpenServ Labs SDK](https://github.com/openserv-labs/sdk)
- Uses [Hugging Face](https://huggingface.co/) models:
  - [DeepSeek](https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-32B)
  - [Tacotron2](https://huggingface.co/speechbrain/tts-tacotron2-ljspeech)
  - [MusicGen](https://huggingface.co/facebook/musicgen-small)
- Audio processing with [node-web-audio-api](https://www.npmjs.com/package/node-web-audio-api)

## License

MIT License - see [LICENSE](LICENSE) for details
