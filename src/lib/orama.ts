import { db } from "@/server/db";
import {create, type AnyOrama, insert, search } from "@orama/orama";
import { persist, restore } from '@orama/plugin-data-persistence'
import { getEmbedding } from "./embedding";


export class OramaClient {
    //@ts-ignore
    private orama: AnyOrama
    private accountId: string

    constructor(accountId: string) {
        this.accountId = accountId
    }

    async saveIndex() {
        try {
            const index = await persist(this.orama, 'json')
            // Convert the persisted index to a JSON object for Prisma
            const indexData = typeof index === 'string' ? JSON.parse(index) : index
            await db.account.update({
                where: {
                    id: this.accountId
                },
                data: {
                    oramaIndex: indexData
                }
            })
        } catch (error) {
            console.error('Error saving Orama index:', error)
            throw error
        }
    }

    async initialize() {
        try {
            const account = await db.account.findUnique({
                where: {
                    id: this.accountId
                }
            })
            if (!account) {
                throw new Error('Account not found')
            }

            if (account.oramaIndex) {
                console.log('Restoring existing Orama index from database...')
                // Convert the JSON object back to string for restoration
                const indexString = typeof account.oramaIndex === 'string'
                    ? account.oramaIndex
                    : JSON.stringify(account.oramaIndex)
                this.orama = await restore('json', indexString)
                console.log('Successfully restored Orama index')
            } else {
                console.log('Creating new Orama index...')
                this.orama = await create({
                    schema: {
                        subject: 'string',
                        body: 'string',
                        rawBody: 'string',
                        from: 'string',
                        to: 'string[]',
                        sentAt: 'string',
                        threadId: 'string',
                        embedding: 'vector[1536]'
                    }
                })
                await this.saveIndex()
                console.log('Created and saved new Orama index')
            }
        } catch (error) {
            console.error('Error initializing Orama index:', error)
            throw error
        }
    }

    async vectorSearch({ term }: { term: string }) {
        try {
            const embeddings = await getEmbedding(term)
            const results = await search(this.orama, {
                mode: 'hybrid',
                term: term,
                vector: {
                    value: embeddings,
                    property: 'embedding'
                },
                similarity: 0.8,
                limit: 10
            })
            return results
        } catch (error) {
            console.error('Error in vector search:', error)
            throw error
        }
    }

    async search({ term }: { term: string }) {
        try {
            return await search(this.orama, {
                term: term
            })
        } catch (error) {
            console.error('Error in search:', error)
            throw error
        }
    }
    
    async insert(document: any) {
        try {
            await insert(this.orama, document)
            await this.saveIndex()
        } catch (error) {
            console.error('Error inserting document:', error)
            throw error
        }
    }
}