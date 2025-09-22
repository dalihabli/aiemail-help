'use client'

import React from 'react'
import { FREE_CERDITS_PER_DAY } from '@/constants'
import StripeButton from './stripe-button'
import { getSubscriptionStatus } from '@/lib/stripe-actions'
import useThreads from '@/hooks/use-threads'
import { api } from '@/trpc/react'

const PremiumBanner = () => {
    const [isSubscribed, setIsSubscribed] = React.useState(false)
    const { accountId } = useThreads()
    const {data} = api.account.getChatbotInteraction.useQuery({
        accountId
    })

    React.useEffect(() => {
        (async () => {
        const subscriptionStatus = await getSubscriptionStatus()
        setIsSubscribed(subscriptionStatus || false )
        })()
    },[])
   

    if (!isSubscribed) return <div className='bg-gray-900 p-4 rounded-lg border overflow-hidden flex flex-col md:flex-row gap-4'>
            <img src='./bot.webp' className='md:absolute md:-bottom-6 md:-right-10 h-[180px] w-auto' alt="AI Bot" />
            <div>
           
                <div className='flex items-center gap-2 mb-2'>
                    <h1 className='text-white text-xl font-bold'>Basic Plan</h1>
                
                <p className='text-gray-400 text-sm md:max-w-full'>
                    {data?.remainingCredits} / {FREE_CERDITS_PER_DAY} message remaining
                </p>
                </div>
                <div className='h-4'></div>
                <p className='text-gray-400 text-sm md:max-w-[calc(100%-150px)]'>
                    Upgrade to pro to ask as many questions as you want!
                </p>
                  <div className='h-4'></div>
                   <StripeButton />
                  </div>
                </div>
                if(isSubscribed) return <div className='bg-gray-900 p-4 rounded-lg border overflow-hidden flex flex-col md:flex-row gap-4'>
                <img src='./bot.webp' className='md:absolute md:-bottom-6 md:-right-10 h-[180px] w-auto' alt="AI Bot" />
                <div>
               
                    <div className='flex items-center gap-2 mb-2'>
                        <h1 className='text-white text-xl font-bold'>Premium Plan</h1>
                    </div>
                    <div className='h-4'></div>
                    <p className='text-gray-400 text-sm md:max-w-[calc(100%-70px)]'>
                    Ask as many questions as you want!

                    </p>
                      <div className='h-4'></div>
                       <StripeButton />
                      </div>
                    </div>
            
    return (
        <div>PremiumBanner</div>
    )
}

export default PremiumBanner