'use server'

import { auth } from '@clerk/nextjs/server'
import { stripe } from './stripe'
import { redirect } from 'next/navigation'
import { db } from '@/server/db'
// import { STRIPE_PRICE_ID } from '@/constants'

export async function createCheckoutSession() {
    const { userId } = await auth()
    if(!userId) throw new Error('Unauthorized')
        const session = await stripe.checkout.sessions.create({
       payment_method_types: ['card'],
       line_items: [
        {
        price: 'price_1Q0000000000000000000000',
        quantity: 1,
       }
    ],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/mail`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/mail`,
    client_reference_id: userId,
  })
  redirect(session.url as string)
}

export async function createBillingPortalSession() {
  const { userId } = await auth()
  if(!userId) throw new Error('Unauthorized')
    const subscription = await db.stripeSubscription.findUnique({
      where: {
        userId: userId
      }
    })
    if(!subscription) throw new Error('Subscription not found')
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.customerId as string,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/mail`,
    })
    redirect(session.url as string)
}

export async function getSubscriptionStatus() {
  const { userId } = await auth()
  if(!userId) return 
  const subscription = await db.stripeSubscription.findUnique({
    where: {
      userId: userId
    }
  })
  if(!subscription) return false
  return subscription.currentPeriodEnd > new Date()
}