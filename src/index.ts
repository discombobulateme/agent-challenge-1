import 'dotenv/config'
import { BardAgent } from './bard-agent'

// Create and start the Bard agent
const agent = new BardAgent()
agent.start()

// Example usage
async function main() {
  try {
    const response = await agent.process({
      messages: [
        {
          role: 'user',
          content: 'Write a rock song with an energetic mood about chasing dreams'
        }
      ]
    })

    console.log('Generated Song:', response.choices[0].message.content)
  } catch (error) {
    console.error('Error:', error)
  }
}

main().catch(console.error)
