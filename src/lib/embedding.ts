import { openai } from '@ai-sdk/openai'
import { embed } from 'ai'

export async function getEmbedding(text: string) {
    try {
        const { embedding } = await embed({
            model: openai.embedding('text-embedding-ada-002'),
            value: text.replace(/\n/g, ' '),
        })
        return embedding
    } catch (error) {
        console.log('error calling openai embedding', error)
        throw error
    }
}

