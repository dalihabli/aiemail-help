'use client'
import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

const AskAI = ({ isCollapsed }: { isCollapsed: boolean }) => {
    const messages: any[] = []
    if(isCollapsed) return null
  return (
    <div className='p-4 mb-14'>
        <motion.div className='flex flex-1 flex-col pb-4 rounded-lg bg-gray-10 shodow-inner dark:bg-gray-900'>
             <div className='max-h-[50vh] overflow-y-scroll w-full flex flex-col gap-2' id='message-container'>
                <AnimatePresence mode='wait'>
                   {messages.map(message => {
                    return <motion.div key={message.id}
                    className={cn('z-10 mt-2 max-w-[250px] break-words rounded-2xl bg-gray-200 dark:bg-gray-800',{
                        'self-end text-gray-900 dark:text-gray-100': message.role === 'user',
                        'self-start bg-blue-500 text-white': message.role === 'assistant',
                    
                    })}
                    layoutId={`container-[${message.id}]`}
                    transition={{
                        type: 'easeOut',
                        duration: 0.2,
                    }}
                    >
                    </motion.div>
                       })}
                </AnimatePresence>
             </div>
        </motion.div>
        </div>
  )
}

export default AskAI