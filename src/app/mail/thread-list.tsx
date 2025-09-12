'use client'
import React from 'react'
import { format} from 'date-fns'
import useThreads from '@/hooks/use-threads'
import { date } from 'zod'


const ThreadList = () => {
    const { threads } = useThreads()

    const groupedThreads =threads?.reduce((acc, thread) => {
        const date = format(thread.emails[0]?.sentAt ?? new Date(),'yyyy-MM-dd')
     if(!acc[date]) {
        acc[date] = []
     }
     acc[date].push(thread)
     return acc
    },{} as Record<string, typeof threads>)
    console.log(threads)
  return (
    <div className='max-w-full overflow-y-scroll max-h-[calc(100vh-120px]'>
        <div className='flex flex-col gap-2 p-4 pt-0'>
           {Object.entries(groupedThreads ?? {}).map(([date, threads])=>{
            return <React.Fragment key={date}>
              <div className='text-xs font-medium text-muted-foreground mt-5 first:mt-0'>
                {date}
                </div>
                </React.Fragment>
    
    })}
           

            
        </div>
    </div>
  )
}

export default ThreadList