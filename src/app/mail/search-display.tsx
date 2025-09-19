import { useAtom } from "jotai"
import React from "react"
import { searchValueAtom } from "./search-bar"
import { api } from "@/trpc/react"
import { useDebounceValue } from "usehooks-ts"
import useThreads from "@/hooks/use-threads"
import DOMPurify from "dompurify"
import { Loader2 } from "lucide-react"



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
                    Your search for {searchValue}&quot; came back with...
                </h2>

            </div>
            {search.isPending && (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Searching...</span>
                </div>
            )}
            
            {search.isError && (
                <div className="text-red-500 p-4">
                    Error: {search.error?.message || "Something went wrong"}
                </div>
            )}
            
            {search.data && search.data.hits.length === 0 && (
                <p>No results found.</p>
            )}
            
            {search.data && search.data.hits.length > 0 && (
                <ul className="space-y-2">
                    {search.data.hits.map((hit, index) => (
                        <li key={hit.id || index} className="border rounded-md p-4 hover:bg-gray-100 duration-100 cursor-pointer transition-all dark:hover:bg-gray-900">
                            <h3 className="text-base font-medium">
                                {hit.document.subject}
                            </h3>
                            <p className="text-sm text-gray-500">
                               To: {Array.isArray(hit.document.to) ? hit.document.to.join(', ') : hit.document.to}
                            </p>
                            <p className="text-sm mt-2" dangerouslySetInnerHTML={{ 
                                __html: DOMPurify.sanitize(hit.document.rawBody || hit.document.body || '', {USE_PROFILES: {html: true}})
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