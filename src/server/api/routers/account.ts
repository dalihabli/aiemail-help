import z from "zod"
import { createTRPCRouter, privateProcedure } from "../trpc"
import { db } from "@/server/db"
import type { Prisma } from "@prisma/client"
import { emailAddressSchema } from "@/types"
import { Account } from "@/lib/account"
import { OramaClient } from "@/lib/orama"
import { FREE_CERDITS_PER_DAY } from "@/constants"

export const authoriseAccountAccess = async (accountId: string, userId: string) => {
    const account = await db.account.findFirst({
        where: {
            id: accountId,
            userId
        }, select: {
            id: true, emailAddress: true, name: true, accessToken: true
        }
    })
    if(!account) throw new Error("Account not found")
    return account
}

export const accountRouter = createTRPCRouter({
    getAccounts: privateProcedure.query(async ({ctx})=>{
        return await ctx.db.account.findMany({
            where: {
                userId: ctx.auth.userId
            },
            select: {
                id: true, emailAddress: true, name: true
            }
        })
    }),
    getNumThreads: privateProcedure.input(z.object({
        accountId: z.string(),
        tab: z.string()
    })).query(async ({ctx, input})=>{
        const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId)

        let filter: Prisma.ThreadWhereInput = {}
            if(input.tab === 'inbox') {
                filter.inboxStatus = true
            } else if(input.tab === 'draft') {
                filter.draftStatus = true
            } else if(input.tab === 'sent') {
                filter.sentStatus = true
            }
        

        return await ctx.db.thread.count({
            where: {
                accountId: account.id,
                ...filter
            }
        })
    }),
    getThreads: privateProcedure.input(z.object({
        accountId: z.string(),
        tab: z.string(),
        done: z.boolean()
    })).query(async ({ctx, input})=>{
        console.log('🔍 getThreads called with:', { 
            accountId: input.accountId, 
            userId: ctx.auth.userId, 
            tab: input.tab, 
            done: input.done 
        });
        
        try {
            const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId)
            console.log('✅ Account authorized:', account.emailAddress);
        } catch (error) {
            console.log('❌ Account authorization failed:', error.message);
            throw error;
        }
        
        const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId)
    
        let filter: Prisma.ThreadWhereInput = {}
        if(input.tab === 'inbox') {
            filter.inboxStatus = true
        } else if(input.tab === 'draft') {
            filter.draftStatus = true
        } else if(input.tab === 'sent') {
            filter.sentStatus = true
        }

        filter.done = {
            equals: input.done
        }

        console.log('🔍 Thread filter:', filter);
        
        // Check total threads for this account
        const totalThreads = await ctx.db.thread.count({
            where: { accountId: account.id }
        });
        console.log(`📊 Total threads for account ${account.id}:`, totalThreads);

        const threads = await ctx.db.thread.findMany({
            where: {
                accountId: account.id,
                ...filter
            },
                include: {
                    emails: {
                        orderBy: {
                            sentAt: 'asc'
                        },
                        select: {
                            from: true,
                            body: true,
                            bodySnippet: true,
                            emailLabel: true,
                            subject: true,
                            sysLabels: true,
                            id: true,
                            sentAt: true,
                        }
                    },
                
            }, 
            take:15,
             orderBy: {
                lastMessageDate: 'desc'
            }
        })
        
        console.log(`📧 Found ${threads.length} threads with current filter`);
        threads.forEach((thread, index) => {
            if (index < 3) { // Log first 3 threads
                console.log(`  - Thread ${index + 1}: ${thread.subject} (${thread.emails.length} emails)`);
            }
        });
        
        return threads
    }),
    getSuggestions: privateProcedure.input(z.object({
        accountId: z.string(),
        query: z.string()
    })).query(async ({ctx, input})=>{
        const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId)
        return await ctx.db.emailAddress.findMany({
            where: {
                accountId: account.id
              
            },
            select: {
                address: true,
                name: true
            }
        })
    }),
    getReplyDelay: privateProcedure.input(z.object({
        accountId: z.string(),
        threadId: z.string()
    })).query(async ({ctx, input })=>{
        const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId)
        const thread = await ctx.db.thread.findFirst({
            where: {
                id: input.threadId,
            } ,
            include: {
                emails: {
                    orderBy: {sentAt: 'asc'},
                    select: {
                    from:true,
                    to:true,
                    cc:true,
                    bcc:true,
                    sentAt:true,
                    subject:true,
                    internetMessageId:true
                    
                }
                
              }
            }
        })
        if(!thread ||  thread.emails.length ===0) throw new Error("Thread not found")

            const lastExternalEmail = thread.emails.reverse().find(email => email.from.address !== account.emailAddress)
            if(!lastExternalEmail) throw new Error("No external email found")

                return{ 
                    subject:lastExternalEmail.subject,
                    to:[lastExternalEmail.from, ...lastExternalEmail.to.filter(to => to.address !== account.emailAddress)],
                    cc:lastExternalEmail.cc.filter(cc => cc.address !== account.emailAddress),
                    from: {name: account.name, address: account.emailAddress},
                    id: lastExternalEmail.internetMessageId,
                    
                }
    }),
    getReplyDetails: privateProcedure.input(z.object({
        accountId: z.string(),
        threadId: z.string(),
        replyType: z.enum(['reply', 'replyAll'])
    })).query(async ({ ctx, input }) => {
        const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId)

        const thread = await ctx.db.thread.findFirst({
            where: { id: input.threadId },
            include: {
                emails: {
                    orderBy: { sentAt: 'asc' },
                    select: {
                        from: true,
                        to: true,
                        cc: true,
                        bcc: true,
                        sentAt: true,
                        subject: true,
                        internetMessageId: true,
                    },
                },
            },
        });
        
        if(!thread || thread.emails.length === 0) throw new Error("Thread not found")

        const lastExternalEmail = thread.emails
        .reverse()
        .find(email => email.from.address !== account.emailAddress)
        if(!lastExternalEmail) throw new Error("No external email found")

        return{ 
            subject: lastExternalEmail.subject,
            to: [lastExternalEmail.from, ...lastExternalEmail.to.filter(to => to.address !== account.emailAddress)],
            cc: lastExternalEmail.cc.filter(cc => cc.address !== account.emailAddress),
            from: {name: account.name, address: account.emailAddress},
            id: lastExternalEmail.internetMessageId,
        }
    }),
    sendEmail: privateProcedure.input(z.object({
        accountId: z.string(),
        body: z.string(),
        subject: z.string(),
        from: emailAddressSchema,
        cc: z.array(emailAddressSchema).optional(),
        bcc: z.array(emailAddressSchema).optional(),
        to: z.array(emailAddressSchema),

        replyTo: emailAddressSchema,
        inReplyTo: z.string().optional(),
        threadId: z.string().optional(),
    })).mutation(async ({ ctx, input }) => { 
        const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId)
        const acc = new Account(account.accessToken)
        await acc.sendEmail({
            body: input.body,
            subject: input.subject,
            from: input.from,
            to: input.to,
            cc: input.cc,
            bcc: input.bcc,
            replyTo: input.replyTo,
            inReplyTo: input.inReplyTo,
            threadId: input.threadId,
        })
    }),
    searchEmails: privateProcedure.input(z.object({
        accountId: z.string(),
        query: z.string()
    })).mutation(async ({ ctx, input }) => {
        const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId)
        const orama = new OramaClient(account.id)
        await orama.initialize()
        const results = await orama.search({ term: input.query })
        return results
    }),
    getChatbotInteraction: privateProcedure.input(z.object({
        accountId: z.string()
    })).query(async ({ ctx, input }) => {
        const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId)
        const today = new Date().toISOString()
        const chatbotInteraction = await ctx.db.chatbotInteraction.findUnique({
            where: {
                day: today,
                userId: ctx.auth.userId
            }
        })
        
        const remainingCredits = FREE_CERDITS_PER_DAY - (chatbotInteraction?.count || 0)
        return { remainingCredits }
    })
})

