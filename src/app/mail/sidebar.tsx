'use client'
import React from 'react'
import { useLocalStorage } from 'usehooks-ts'
import { Nav } from './nav'
import { Inbox, Send, File} from 'lucide-react'
import { api } from '@/trpc/react'


type Props = { isCollapsed: boolean }

const Sidebar = ({ isCollapsed }: Props) => {
    const [accountId] = useLocalStorage('accountId', '')
    const [tab]= useLocalStorage<'inbox' |'draft' |'sent'>('email-assistant  ','inbox')
    
    const { data: inboxThreads } = api.account.getNumThreads.useQuery({ 
        accountId, 
        tab: 'inbox' 
    })
    const { data: draftThreads } = api.account.getNumThreads.useQuery({ 
        accountId, 
        tab: 'draft' 
    })

   
    
    const { data: sentThreads } = api.account.getNumThreads.useQuery({ 
        accountId, 
        tab: 'sent' 
    })
    
    
    
    return (
        <Nav
        isCollapsed={isCollapsed}
        links={[
            {
                title: inboxThreads?.toString() ?? '0',
                label: '1',
                icon: Inbox,
                variant: tab === 'inbox' ? 'default' : 'ghost',
            },
            {
                title: draftThreads?.toString() ?? '0',
                label: '4',
                icon: File,
                variant: tab === 'inbox' ? 'default' : 'ghost',
            },
            {
                title: sentThreads?.toString() ?? '0',
                label: '6',
                icon: Send,
                variant: tab === 'inbox' ? 'default' : 'ghost',
            },
        ]}
        />
    )
}

export default Sidebar