import { useAtom } from "jotai"
import React from "react"
import { searchValueAtom } from "./search-bar"
import { api } from "@/trpc/react"
import { useDebounceValue } from "usehooks-ts"
import useThreads from "@/hooks/use-threads"
import DOMPurify from "dompurify"



function SearchDisplay() {
    const [searchValue] = useAtom(searchValueAtom)
    const search = api.account.searchEmails.useMutation()
    const [debouncadSearchValue] = useDebounceValue(searchValue, 500)
    const {accountId} = useThreads()
    
    React.useEffect(() => {
        if(!debouncadSearchValue || !accountId) return
        search.mutate({
            accountId,
            query: debouncadSearchValue
            
        })
    },[debouncadSearchValue, accountId, ])
    
    return (
        <div className="p-4 max-h-[calc(100vh-500px)] overflow-y-scroll">
            <div className="flex items-center gap-2 mb-4">
                <h2 className="text-gray-600 text-sm dark:text-gray-400">
                    Your search for &quot;{searchValue}&quot; came back with...
                </h2>
            </div>
            
            {search.isLoading && (
                <div className="flex items-center justify-center p-4">
                    <div className="text-sm text-gray-500">Searching...</div>
                </div>
            )}
            
            {search.data && search.data.hits.length === 0 && (
                <div className="p-4">
                    <p className="text-sm text-gray-500">No results found.</p>
                </div>
            )}
            
            {search.data && search.data.hits.length > 0 && (
                <ul className="space-y-2">
                    {search.data.hits.map(hit => (
                        <li key={hit.id} className="border rounded-md p-4 hover:bg-gray-100 duration-100 cursor-pointer transition-all dark:hover:bg-gray-900">
                            <h3 className="text-base font-medium">
                                {hit.document.subject}
                            </h3>
                            <p className="text-sm text-gray-500">
                               To: {hit.document.to.join(', ')}
                            </p>
                            <p className="text-sm mt-2" dangerouslySetInnerHTML={{ 
                                __html: DOMPurify.sanitize(hit.document.rawBody, {USE_PROFILES: {html: true}})
                            }}>
                            </p>
                        </li>
                    ))}
                </ul>
            )}

            
        </div>
    )
}

export default SearchDisplay