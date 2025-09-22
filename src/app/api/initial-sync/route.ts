import { Account } from "@/lib/account";
import { db } from "@/server/db";
import { syncEmailsToDatabase } from "@/lib/sync-to-db";
import  { NextRequest, NextResponse} from "next/server";

export const POST = async (req: NextRequest) => {
    try {
        console.log('🔄 Initial sync started...')
        
        const { accountId, userId } = await req.json()
        console.log('📧 Syncing for accountId:', accountId, 'userId:', userId)
        
        if (!accountId || !userId) {
            console.log('❌ Missing parameters')
            return NextResponse.json({ error: 'Missing accountId or userId' }, { status: 400 })
        }
        
        console.log('🔍 Looking for account in database...')
        const dbAccount = await db.account.findUnique({
            where: {
                id: accountId,
                userId: userId
            }
        })
        
        if (!dbAccount) {
            console.log('❌ Account not found in database')
            return NextResponse.json({ error: 'Account not found' }, { status: 404 })
        }
        
        console.log('✅ Account found, starting Gmail sync...')
        const account = new Account(dbAccount.accessToken)
        
        console.log('📥 Performing initial sync with Gmail API...')
        const response = await account.performInitialSync()
        if(!response) {
            console.log('❌ Gmail API sync failed')
            return NextResponse.json({ error: 'Failed to perform initial sync' }, { status: 500 })
        }
        
        const { emails, deltaToken } = response
        console.log(`📧 Retrieved ${emails.length} emails from Gmail`)

        console.log('💾 Updating account with delta token...')
        await db.account.update({
            where: {
                id: accountId
            },
            data: {
                nextDeltaToken: deltaToken
            }
        })

        console.log('💾 Syncing emails to database...')
        await syncEmailsToDatabase(emails, accountId)

        console.log('✅ Sync completed successfully!')
        return NextResponse.json({ 
            success: true, 
            emailCount: emails.length,
            message: 'Gmail sync completed successfully'
        }, { status: 200 })
    } catch (error) {
        console.error('❌ Initial sync error:', error)
        return NextResponse.json({ 
            error: 'Internal server error during sync',
            details: error.message 
        }, { status: 500 })
    }




       

}