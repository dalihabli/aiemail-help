'use client'
import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Send, SparkleIcon } from 'lucide-react'
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai'
import useThreads from '@/hooks/use-threads'

const AskAI = ({ isCollapsed }: { isCollapsed: boolean }) => {
    const {accountId} = useThreads()
    const { input, handleInputChange, handleSubmit, messages} = useChat({
        
            api: '/api/ask-ai',
            body: {
                accountId
            }
        ,
        onError: (error) => {
            console.error('error', error)
        },
        initialMessages: []
    })
   
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
                    layoutId={`container-[${messages.length - 1}]`} 
                    transition={{
                        ease: 'easeOut',
                        duration: 0.2,
                    }}
                    >
                        <div className='px-3 py-2 text-[15px] leading-[15px]'>
                            {message.content}
                        </div>
                    </motion.div>
                       })}
                </AnimatePresence>
             </div>

             
             {messages.length > 0 && <div className='h-4'/>}

             <div className='w-full'>
                {messages.length === 0 && <div className='mb-4'>
                    <div className='flex items-center gap-4'>
                        <SparkleIcon className='size-6 text-gray-600 '/>
                        <div>
                        <p className='text-gray-900 dark:text-gray-100'>Ask AI anything about your eamil</p>
                        <p className='text-gray-500 dark:text-gray-400'>Get answer to your questions about your eamil</p>

                        </div>
                        </div>
                        <div className="h-2"></div>
                        <div className='flex items-center gap-2 flex-wrap'>
                            <span className='px-2 py-1 bg-gray-800 text-gray-200 rounded-md text-xs'>
                                what can I ask?
                            </span>

                        
                    </div>
                </div>
                }
                
            
                 <form className='w-full flex' onSubmit={handleSubmit}>
                    <input type="text"
                    className='py-1 relative h-9 placeholder:text-[13px] flex-grow rounded-full border border-gray-200 bg-white px-3 text-[15px] outline-none'
                    placeholder='Ask AI'
                    value={input}
                    onChange={handleInputChange}
                    />
                    <motion.div key={messages.length}
                    layout="position"
                    layoutId={`container-[${messages.length }]`} 
                    transition={{
                        ease: 'easeOut',
                        duration: 0.2,
                    }}
                    initial={{ opacity: 0.6, zIndex: -1 }}
                    animate={{ opacity: 0.6, zIndex: -1 }}
                    exit={{ opacity: 1, zIndex: 1 }}
                    >
                        <div className='px-3 py-2 text-[15px] leading-[15px] text-gray-900 dark:text-gray-100'>
                         { input }
                        </div>
                    </motion.div>
                    <button type='submit' className='ml-2 flex size-9 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-800'>
                        <Send className='size-4 text-gray-500 dark:text-gray-300' />
                    </button>
                 </form>
             </div>
        </motion.div>
        </div>
  )
}

export default AskAI