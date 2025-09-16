'use client'
import useThemeSwitching from './use-theme-switching'
import { KBarAnimator, KBarPortal, KBarPositioner, KBarProvider, KBarSearch, type Action } from 'kbar'
import RenderResults from './render-results'
import { useLocalStorage } from 'usehooks-ts'
import useAccountSwitching from './use-account-switching'

export default function kbar({children}: {children: React.ReactNode}) {
    const [tab, setTab] = useLocalStorage('ai-email','inbox')
    const [done, setDone] = useLocalStorage('ai-email-done',false)

    const actions: Action[] = [
        {
            id: "inboxAction",
            name: "Inbox",
            shortcut: ["g", 'i'],
            keywords: "inbox",
            section: "Navigation",
            subtitle: "View your inbox",
            perform: () => {
                setTab('inbox')
            },
        },
        {
            id: "draftsAction",
            name: "Drafts",
            shortcut: ['g', 'd'],
            keywords: "drafts",
            subtitle: "View your drafts",
            section: "Navigation",
            perform: () => {
                setTab('drafts')
            },
        },
        {
            id: "sentAction",
            name: "Sent",
            shortcut: ['g', "s"],
            keywords: "sent",
            section: "Navigation",
            subtitle: "View the sent",
            perform: () => {
                setTab('sent')
            },
        },
        {
            id: "pendingAction",
            name: "See done",
            shortcut: ['g', "d"],
            keywords: "done",
            section: "Navigation",
            subtitle: "View the done emails",
            perform: () => {
                setDone(true)
            },
        },
        {
            id: "doneAction",
            name: "See Pending",
            shortcut: ['g', "u"],
            keywords: 'pending, undone, not done',
            section: "Navigation",
            subtitle: "View the pending emails",
            perform: () => {
                setDone(false)
            },
        },
        
        

    ];

    return <KBarProvider>
        <ActualComponent >
            {children}
        </ActualComponent>
    </KBarProvider>
}

const ActualComponent = ({children}: {children: React.ReactNode}) => {
    useThemeSwitching()
    useAccountSwitching()
    return <>
    <KBarPortal>
        <KBarPositioner className='fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm scrollbar-hide !p-0 z-[999]'>
        <KBarAnimator className='max-w-[600px] !mt-64 w-full bg-white dark:bg-gray-800 text-forgeround dark:text-gray-200 shadow-lg border dark:border-gray-600 rounded-lg overflow-hidden relative !-translate-y-12'>
            <div className="bg-white dark:bg-gray-800">
                <div className="border-x-0 border-b-2 dark:border-gray-700">
                <KBarSearch className='py-4 px-6 text-lg w-full bg-white dark:bg-gray-800 outline-none boder-none foxus:outline-none focus:ring-0 focus:ring-offset-0'/>
                </div>
                <RenderResults />
            </div>
        </KBarAnimator>
        </KBarPositioner>
    </KBarPortal>
    {children}
    </>
}