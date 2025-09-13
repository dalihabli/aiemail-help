'use client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import {  Separator } from '@/components/ui/separator'
import  useThreads  from '@/hooks/use-threads'
import { Archive, ArchiveX, Clock, MoreHorizontal, Trash2 } from 'lucide-react'
import React from 'react'

const ThreadDisplay = () => {
  const { threadId, threads } = useThreads()
     {/* button row */}
  const thread = threads?.find(t => t.id === threadId)

  return (
    <div className='flex flex-col h-full'>
        {/* button row */}
        <div className='flex items-center p-2'>
            <div className='flex items-center gap-2'>
            <Button variant={'ghost'} size='icon' disabled={!thread}>
                <Archive className='size-4' />
            </Button>
            <Button variant={'ghost'} size='icon' disabled={!thread}>
                <ArchiveX className='size-4' />
            </Button>
            <Button variant={'ghost'} size='icon' disabled={!thread}>
                <Trash2 className='size-4' />
            </Button>
            </div>
           <Separator orientation='vertical' className='m1-2' />
           <Button className='m1-2' size='icon' disabled={!thread}>
            <Clock className='size-4' />
           </Button>
           <div className="flex items-center ml-auto">
    <DropdownMenu>
    <Button className='m1-2' size='icon' disabled={!thread}>
         <MoreHorizontal className='size-4' />
    </Button>
   <DropdownMenuTrigger>Open</DropdownMenuTrigger>
  <DropdownMenuContent align='end'>
    <DropdownMenuLabel>My Account</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Mark as unread</DropdownMenuItem>
    <DropdownMenuItem>Star thread</DropdownMenuItem>
    <DropdownMenuItem>Add label</DropdownMenuItem>
    <DropdownMenuItem>Mute thread</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

    </div>
        </div>
        <Separator />
        {thread ? <>
        <div className='flex flex-col flex-1 overflow-scroll'>
            <div className='flex itmes-center p-4'>
                <div className='flex items-center gap-4 text-sm'>
                    <Avatar>
                        <AvatarImage alt='avatar'/>
                        <AvatarFallback>
                            {thread.emails[0]?.from?.name?.split(' ').map(chunk => chunk[0]).join('')}
                        </AvatarFallback>
                    </Avatar>
                    <div className='grid gap-1'>
                        <div className='font-semibold'>
                            {thread.emails[0]?.from.name}
                            <div className='text-xs line-clamp-1'>
                                {thread.emails[0]?.subject}
                            </div>
                            <div className='text-xs line-clamp1'>
                                 <span className='font-medium'>
                                    Reply-To:

                                 </span>
                                 {thread.emails[0]?.from?.address}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
            </> : <>
        <div className='p-8 text-center text-muted-foreground'>
            No message selected
        </div>
        </>}
    

   
    </div>


  )
}

export default ThreadDisplay