import { api } from '@/trpc/react'
import { getQueryKey } from '@trpc/react-query'
import React from 'react'
import { useLocalStorage } from 'usehooks-ts'
import { atom, useAtom } from 'jotai'

export const threadsAtom = atom<string | null>(null)

const useThreads = () => {
    const { data: accounts } = api.account.getAccounts.useQuery()
    const [accountId] = useLocalStorage('accountId', '')
    const [tab] = useLocalStorage('normalhuman-tab', 'inbox')
    const [done] = useLocalStorage('normalhuman-done', false)
    const [threadId, setThreadId] = useAtom(threadsAtom)
   
    const { data: threads, isFetching, refetch } = api.account.getThreads.useQuery({
        accountId,
        done,
        tab
    }, { 
        enabled: !!accountId && !!tab, placeholderData: (e) => e, refetchInterval: 5000
    })

    return {
        threads,
        isFetching,
        refetch,
        accountId,
        threadId, setThreadId,
        account: accounts?.find(e => e.id === accountId),
        
        
      
        
    }
}

export default useThreads 