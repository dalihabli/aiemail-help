import { db } from "@/server/db";
import {create, type AnyOrama, insert, search } from "@orama/orama";
import { persist, restore } from '@orama/plugin-data-persistence'


export class OramaClient {
    //@ts-ignore
    private orama: AnyOrama
    private accountId: string

    constructor(accountId: string) {
        this.accountId = accountId
    }

    async saveIndex() {
        const index = await persist(this.orama,'json')
        await db.account.update({
            where: {
                id: this.accountId
            },
            data: {
                oramaIndex: typeof index === 'string' ? index : JSON.stringify(index)
            }
        })
    }

    async initialize() {
        const account = await db.account.findUnique({
            where: {
                id: this.accountId
            }
        })
        if(!account) { 
            throw new Error('Account not found')
    }

    if (account.oramaIndex) {
        this.orama = await restore('json', account.oramaIndex as any)
    } else {
        this.orama = await create({
            schema: {
                subject: 'string',
                body: 'string',
                rawBody: 'string',
                from: 'string',
                to: 'string[]',
                sentAt: 'string',
                threadId: 'string',
            }
        })
        await this.saveIndex()
    }
}
  async search({term}: {term: string}) {
    return await search(this.orama, {
        term: term
    })
  }
  async insert(document: any) {
    await insert(this.orama, document)
    await this.saveIndex()
  }
}