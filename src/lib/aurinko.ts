"use server";

import { auth } from "@clerk/nextjs/server";

export const getAurinkoAuthUrl = async (serviceType: 'google' |'Office365') => {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

        const params = new URLSearchParams({
            client_id: process.env.AURINKO_CLIENT_ID as string,
            serviceType,
            scopes: 'Mail.Read Mail.ReadWrite Mail.Send Mail.Drafts Mail.All',
            responseType: 'code',
            returnUrl: `${process.env.NEXT_PUBLIC_URL}/api/aurinko/callback`,
        })

        return `https://app.aurinko.io/v1/api/authorize?${params.toString()}` 
    }