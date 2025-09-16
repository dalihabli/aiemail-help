import Select from 'react-select'
import React from 'react'
import useThreads from '@/hooks/use-threads'
import { api } from '@/trpc/react'
import Avatar from 'react-avatar'

type Props = {
  
  placeholder: string
  label: string

  onChange: (values: { label: string, value: string }[]) => void
  value: { label: string, value: string }[]
}

const TagInput = ({ placeholder, label, onChange, value }: Props) => {
  const {accountId} = useThreads()
  const {data: suggestions} = api.account.getSuggestions.useQuery({ 
    accountId,
    query: ''
  })
  const [inputValue, setInputValue] = React.useState('')

  const options = suggestions?.map(suggestions => ({
    label: (
      <span className='flex items-center gap-2'>
        <Avatar name={suggestions.address} size='25' textSizeRatio={2} round={true} />
        {suggestions.address}
      </span>
    ),
    value: suggestions.address
  }))
  
  
  return (
    <div className='border rounded-md flex items-center'>
      <span className='ml-3 text-sl text-gray-500'>
        {label}
      </span>
      <Select
      onInputChange={setInputValue}
      value={value}
      //@ts-ignore
      onChange={onChange}
      className='w-full flex-1'
      //@ts-ignore
      options={input ? options?.concat({
        //@ts-ignore
        label: inputValue, 
        //@ts-ignore
        value: inputValue
      }) : options}
      placeholder={placeholder}
      isMulti 
     
      classNames={{
        control:() => {
          return '!border-none outline-none !ring-0 !shadow-none focus:border-none focus:outline-none focus:ring-0 foucs:shadow-none dark:bg-transparent'
        },
        multiValue:() => {
          return 'dark:!bg-gray-700'
        },
        multiValueLabel:() => {
          return 'dark:text-white dark:bg-gray-700 rounded-md'
        }
      }}
      />
    </div>
  )
}

export default TagInput