// /api/aurinko/callback

import {waitUntil} from "@vercel/functions";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getAccountDetails, exchangeCodeForAccessToken } from "@/lib/aurinko";
import { db } from "@/server/db";
import axios from "axios";


export const  GET = async (req: NextRequest) => {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const params = req.nextUrl.searchParams
        const status = params.get('status')
        if (status != 'success') return NextResponse.json({ message: 'Failed to link account' }, { status: 400 })
            
            const code = params.get('code')
            
            if(!code) return NextResponse.json({ error: 'No code provided' }, { status: 400 })
            const token = await exchangeCodeForAccessToken(code)
            if(!token) return NextResponse.json({ error: 'Failed to exchange code for token' }, { status: 400 })

            const accountDetails = await getAccountDetails(token.accessToken)
                
            await db.account.upsert({
                    where: { id: token.accountId.toString() },
                    create: {
                        id: token.accountId.toString(),
                        userId,
                        token: token.accessToken,
                        provider: 'Aurinko',
                        emailAddress: accountDetails.email,
                        name: accountDetails.name
                    },
                    update: {
                        token: token.accessToken,
                    }
                })
                waitUntil(
                    axios.post(`${process.env.NEXT_PUBLIC_URL}/api/initial-sync`,{
                       accountId: token.accountId.toString(),
                       userId
                    }).then( response => {
                        console.log('Initial sync triggered', response.data)
                    }).catch(error=>{
                        console.error('Failed to trigger  initial sync', error)
                    })

                    
                )
            


                return NextResponse.redirect(new URL('/mail', req.url))

                }