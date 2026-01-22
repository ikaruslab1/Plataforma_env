"use client"

import { useSearchParams, usePathname, useRouter } from "next/navigation"
import { useTransition } from "react"

// Custom simple debounce to avoid dependency installation if possible, 
// OR simpler: just update on every change if load is light. 
// BUT "Prefiero que uses el hook 'useSearchParams' ... en tiempo real". 
// Let's stick to standard implementation with a timeout manually.

export function SearchBar() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isPending, startTransition] = useTransition()

  function handleSearch(term: string) {
    const params = new URLSearchParams(searchParams)
    if (term) {
      params.set('query', term)
    } else {
      params.delete('query')
    }
    
    startTransition(() => {
      replace(`${pathname}?${params.toString()}`)
    })
  }
  
  // Debounce wrapper
  const debounce = (func: (term: string) => void, wait: number) => {
    let timeout: NodeJS.Timeout
    return (term: string) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(term), wait)
    }
  }

  const debouncedSearch = debounce(handleSearch, 300)

  return (
    <div className="relative flex flex-1 flex-shrink-0">
      <label htmlFor="search" className="sr-only">
        Buscar
      </label>
      <input
        className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500 transition-all shadow-sm"
        placeholder="Buscar por nombre o ID..."
        onChange={(e) => debouncedSearch(e.target.value)}
        defaultValue={searchParams.get('query')?.toString()}
      />
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-blue-500 transition-colors"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
        />
      </svg>
    </div>
  )
}
