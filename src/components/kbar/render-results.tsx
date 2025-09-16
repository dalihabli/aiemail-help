
import { KBarResults, useMatches } from "kbar";
import React from "react";
import ResultItem from "./result-item";



const RenderResults = () => {
    const { results, rootActionId} = useMatches()
    return (
       <KBarResults 
       items={results}
       onRender={({ item, active}) => {
        if(typeof item === 'string'){
            return <div className='px-4 py-2 text-sm uppercase opacity-50 text-gray-800 dark:text-gray-400'>{item}</div>
            }
            return (
                <ResultItem
                action={item}
                active={active}
                currentRootActionId={rootActionId ?? ''}
                />
            )
          }}
       />
    )
}

export default RenderResults;