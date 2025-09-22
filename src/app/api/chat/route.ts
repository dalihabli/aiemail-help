// /api/chat

import { xai } from '@ai-sdk/xai'
import { streamText } from 'ai'
import { auth } from '@clerk/nextjs/server'
import { type UIMessage, StreamingTextResponse } from 'ai'
import { OramaClient } from '@/lib/orama'
import { getSubscriptionStatus } from '@/lib/stripe-actions'
import { db } from '@/server/db'
import { FREE_CERDITS_PER_DAY } from '@/constants'


export async function POST(req: Request) {
    const today = new Date().toISOString()
    try {
        const {userId} = await auth()
        if (!userId) {
            return new Response('Unauthorized', {status: 401})
        }
        const isSubscribed = await getSubscriptionStatus()
        if(!isSubscribed) {
            const chatbotInteraction = await db.chatbotInteraction.findUnique({
                where: {
                    day: today,
                    userId: userId
                }
            })
            if(!chatbotInteraction) {
                await db.chatbotInteraction.create({
                    data: {
                        day: today,
                        userId: userId,
                        count: 1
                    }
                })
            } else if (chatbotInteraction.count >= FREE_CERDITS_PER_DAY) {
                return new Response('You have reached the maximum number of chatbot interactions for your free plan', {status: 420})
            }
        }
    
        const {accountId, messages} = await req.json()
        const orama = new OramaClient(accountId)
        await orama.initialize()

        const lastMessage = messages[messages.length - 1]
        console.log('lastMessage', lastMessage)
        const context = await orama.vectorSearch({term: lastMessage.content})
        console.log(context.hits.length + ' hits found')
        
        const systemPrompt = `You are an AI email assistant embedded in an email client app. Your purpose is to help the user compose emails by answering questions, providing suggestions, and offering relevant information based on the context of their previous emails.
            THE TIME NOW IS ${new Date().toLocaleString()}
      
      START CONTEXT BLOCK
      ${context.hits.map((hit) => JSON.stringify(hit.document)).join('\n')}
      END OF CONTEXT BLOCK
      
      When responding, please keep in mind:
      - Be helpful, clever, and articulate.
      - Rely on the provided email context to inform your responses.
      - If the context does not contain enough information to answer a question, politely say you don't have enough information.
      - Avoid apologizing for previous responses. Instead, indicate that you have updated your knowledge based on new information.
      - Do not invent or speculate about anything that is not directly supported by the email context.
      - Keep your responses concise and relevant to the user's questions or the email being composed.`;

        const { textStream } = await streamText({
            model: xai('grok-beta'),
            system: systemPrompt,
            messages: messages.filter((message: UIMessage) => message.role === 'user'),
            onStart: async () => {
                console.log('Streaming started')
            },
            onFinish: async (completion) => {
                await db.chatbotInteraction.update({
                    where: {
                        day: today,
                        userId
                    },
                    data: {
                        count: {
                            increment: 1
                        }
                    }
                })
                console.log('Streaming completed', completion.text)
            },
        });

        const stream = new ReadableStream({
            start(controller) {
                (async () => {
                    for await (const delta of textStream) {
                        controller.enqueue(new TextEncoder().encode(delta));
                    }
                    controller.close();
                })();
            }
        })
        return new StreamingTextResponse(stream)


        return new Response('ok', {status: 200}) 
    } catch (error) {
        console.error('Error', error)
        return new Response('Internal Server Error', { status: 500 })
    }
}