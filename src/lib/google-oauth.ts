"use server";
import { auth } from "@clerk/nextjs/server";
import { getSubscriptionStatus } from "./stripe-actions";
import { db } from "@/server/db";
import { FREE_ACCOUNTS_PER_USER, PRO_ACCOUNTS_PER_USER } from "@/constants";

export const getGoogleAuthUrl = async () => {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    const isSubscribed = await getSubscriptionStatus()
    const accounts = await db.account.count({ where: { userId } })
    
    if(isSubscribed) {
        if (accounts >= PRO_ACCOUNTS_PER_USER) {
            throw new Error("You have reached the maximum number of accounts for your subscription")
        }
    } else {
        if (accounts >= FREE_ACCOUNTS_PER_USER) {
            throw new Error("You have reached the maximum number of accounts for your free plan")
        }
    }

    const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID as string,
        redirect_uri: `${process.env.NEXT_PUBLIC_URL}/api/google/callback`,
        response_type: 'code',
        scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
        access_type: 'offline',
        prompt: 'consent',
        state: userId // Include userId in state for security
    })

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export const exchangeCodeForAccessToken = async (code: string) => {
    try {
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID as string,
                client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
                code,
                grant_type: 'authorization_code',
                redirect_uri: `${process.env.NEXT_PUBLIC_URL}/api/google/callback`,
            }),
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        
        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresIn: data.expires_in,
            scope: data.scope,
            tokenType: data.token_type
        }
    } catch (error) {
        console.error('Error exchanging code for token:', error)
        throw error
    }
}

export const getAccountDetails = async (accessToken: string) => {
    try {
        const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            },
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        
        return {
            email: data.email,
            name: data.name,
            id: data.id,
            picture: data.picture
        }
    } catch (error) {
        console.error('Error fetching account details:', error)
        throw error
    }
}

export const refreshAccessToken = async (refreshToken: string) => {
    try {
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID as string,
                client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
                refresh_token: refreshToken,
                grant_type: 'refresh_token',
            }),
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        
        return {
            accessToken: data.access_token,
            expiresIn: data.expires_in,
            scope: data.scope,
            tokenType: data.token_type
        }
    } catch (error) {
        console.error('Error refreshing access token:', error)
        throw error
    }
}
