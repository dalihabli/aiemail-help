// /api/google/callback

import {waitUntil} from "@vercel/functions";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getAccountDetails, exchangeCodeForAccessToken } from "@/lib/google-oauth";
import { db } from "@/server/db";
import axios from "axios";

export const GET = async (req: NextRequest) => {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const params = req.nextUrl.searchParams
    const error = params.get('error')
    
    // Handle OAuth errors
    if (error) {
        console.error('OAuth error:', error)
        return NextResponse.json({ message: 'Failed to link account' }, { status: 400 })
    }
            
    const code = params.get('code')
    const state = params.get('state')
    
    if (!code) return NextResponse.json({ error: 'No code provided' }, { status: 400 })
    
    // Verify state parameter matches userId for security
    if (state !== userId) {
        return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 })
    }
    
    try {
        console.log('Starting OAuth callback process for code:', code.substring(0, 10) + '...')
        
        const tokenData = await exchangeCodeForAccessToken(code)
        console.log('Token exchange result:', tokenData ? 'Success' : 'Failed')
        if (!tokenData) return NextResponse.json({ error: 'Failed to exchange code for token' }, { status: 400 })

        console.log('Getting account details with access token...')
        const accountDetails = await getAccountDetails(tokenData.accessToken)
        console.log('Account details retrieved:', { id: accountDetails.id, email: accountDetails.email })
        
        // Ensure the user exists in the database before creating the account
        console.log('Ensuring user exists for userId:', userId)
        
        // Check if user exists by ID first
        let user = await db.user.findUnique({ where: { id: userId } });
        
        if (!user) {
            // Check if a user with this email already exists
            const existingUser = await db.user.findUnique({ 
                where: { emailAddress: accountDetails.email } 
            });
            
            if (existingUser) {
                console.log('User with this email already exists, using existing user:', existingUser.id);
                user = existingUser;
            } else {
                // Create new user
                user = await db.user.create({
                    data: {
                        id: userId,
                        emailAddress: accountDetails.email,
                        firstName: accountDetails.name?.split(' ')[0] || '',
                        lastName: accountDetails.name?.split(' ').slice(1).join(' ') || '',
                    }
                });
                console.log('Created new user:', user.id);
            }
        }
        
        // Use Google account ID as the unique identifier
        console.log('Creating/updating account for Google ID:', accountDetails.id)
        await db.account.upsert({
            where: { id: accountDetails.id },
            create: {
                id: accountDetails.id,
                userId: user.id, // Use the actual user ID (might be existing user)
                accessToken: tokenData.accessToken,
                refreshToken: tokenData.refreshToken,
                provider: 'Google',
                emailAddress: accountDetails.email,
                name: accountDetails.name
            },
            update: {
                accessToken: tokenData.accessToken,
                refreshToken: tokenData.refreshToken,
                userId: user.id, // Update user ID in case it changed
            }
        })
        
        // Trigger initial sync
        waitUntil(
            axios.post(`${process.env.NEXT_PUBLIC_URL}/api/initial-sync`, {
                accountId: accountDetails.id,
                userId: user.id // Use the actual user ID
            }).then(response => {
                console.log('Initial sync triggered', response.data)
            }).catch(error => {
                console.error('Failed to trigger initial sync', error)
            })
        )

        return NextResponse.redirect(new URL('/mail', req.url))
        
    } catch (error) {
        console.error('Error in Google OAuth callback:', error)
        return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
    }
}
