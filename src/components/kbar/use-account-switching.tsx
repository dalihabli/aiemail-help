import { api } from '@/trpc/react'
import { useRegisterActions } from 'kbar'
import React from 'react'
import { useLocalStorage } from 'usehooks-ts'

const useAccountSwitching = () => {
    const { data: accounts } = api.account.getAccounts.useQuery()

    // Create some fake data for demonstration purposes
    const mainAction = [{
        id: "accountsAction",
        name: "Switch Account",
        shortcut: ['e', 's'],
        section: "Accounts",
    }]
    const [_, setAccountId] = useLocalStorage('accountId', '')



    useRegisterActions(mainAction.concat((accounts?.map(account => {
        return {
            id: account.id,
            name: account.name,
            parent: 'accountsAction',
            perform: () => {
                console.log('perform', account.id)
                setAccountId(account.id)
            },
            keywords: [
                account.name,
                account.emailAddress,
            ].filter(Boolean) as string[],
            shortcut: [],
            section: "Accounts",
            subtitle: account.emailAddress,
            priority: 1000
        }
    })) || []), [accounts])

}

export default useAccountSwitching