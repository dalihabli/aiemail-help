'use client'
import React from "react"
import { Button } from "./ui/button"
import { getGoogleAuthUrl } from "@/lib/google-oauth"

const LinkAccountButton = () => {
    return (
       <Button onClick={async () => {
        const authUrl = await getGoogleAuthUrl()
        window.location.href = authUrl
       }}>
        Link Account
       </Button>
    )
}

export default LinkAccountButton