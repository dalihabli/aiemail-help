import { headers } from "next/headers"
import Stripe from "stripe"
import { stripe } from "@/lib/stripe"

export async function POST(req: Request) {
    console.log('=== WEBHOOK DEBUG START ===')
    
    const body = await req.text()
    const signature = (await headers()).get('stripe-signature') as string
    let event: Stripe.Event

    console.log('Environment check:', {
        NODE_ENV: process.env.NODE_ENV,
        hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
        webhookSecretLength: process.env.STRIPE_WEBHOOK_SECRET?.length,
        webhookSecretStart: process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 10)
    })

    console.log('Request details:', { 
        hasSignature: !!signature, 
        signatureStart: signature?.substring(0, 20),
        bodyLength: body.length,
        method: req.method,
        url: req.url
    })

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
        console.error('STRIPE_WEBHOOK_SECRET is not set!')
        return new Response('Webhook secret not configured', { status: 500 })
    }

    if (!signature) {
        console.error('No stripe-signature header found!')
        return new Response('No signature header', { status: 400 })
    }

    try {
        event = stripe.webhooks.constructEvent(
            body, signature, process.env.STRIPE_WEBHOOK_SECRET as string
        )
        console.log('✅ Webhook verification successful')
    } catch (error) {
        console.error('❌ Webhook verification failed:', error)
        return new Response('webhook error', { status: 400 })
    }

    const session = event.data.object as Stripe.Checkout.Session
    console.log('received stripe event', event.type)

    return new Response('Webhook received', { status: 200 })
}