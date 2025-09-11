'use client'
import { Select } from '@/components/ui/select'
import { api } from '@/trpc/react'
import React from 'react'
import { useLocalStorage } from 'usehooks-ts'


type Props = {
    isCollapsed: boolean
}

const AccountSwitcher = ({ isCollapsed }: Props) => {
    const { data } = api.account.getAccounts.useQuery()
    const [accountId, setAccountId] = useLocalStorage('accountId', '')

    if (!data) return null

    return (
      <Select>

      </Select>
    )
}

export default AccountSwitcher