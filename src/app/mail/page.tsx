'use client'
import ComposeButton from './compose-button'
import ThemeToggle from '@/components/theme-toggle'
import { UserButton } from '@clerk/nextjs'
import dynamic from 'next/dynamic'
import React from 'react'


const Mail = dynamic(()=>{
   return import('./mail')
}, {
    ssr: false

})

const MailDashboard = () => {
  return (
    <>
    <div className='absolute bottom-4 left-4'>
      <div className="flex items-centre gap2">
      <UserButton />
      <ThemeToggle />
      <ComposeButton />
      </div>
      
    </div>
    <Mail
    defaultLayout={[20,32,48]}
    defaultCollapsed={false}
    navCollapsedSize={4}
    />
    </>
  )
}

export default MailDashboard