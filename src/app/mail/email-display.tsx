'use client'
import useThreads from '@/hooks/use-threads'
import { cn } from '@/lib/utils'
import type { RouterOutputs } from '@/trpc/react'

import React from 'react'

type Props = {
    email: RouterOutputs['account']['getThreads'][0]['emails'][0]
}

export const EmailDisplay = ({email}: Props) => {
    const {account} = useThreads()
    
    const isMe = account?.emailAddress === email.from.address
    
    return(  
     <div className={
        cn('border rounded-lg p-4 transition-all hover:translate-x-2',{
        'border-1-gray-900 border-1-4': isMe,
     }

     )}>
        <div className='flex items-center justify-between gap-2'>
        <div className='flex items-center justify-between gap-2'>
            <span>{email.from.name}</span>
        </div>
        </div>

        </div>
    )
}