'use client'

import Fuse, { FuseResult } from 'fuse.js'
import { useEffect, useRef, useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'

import { highlightMatches } from '@/utils/HighlightMatches'

import type { Company } from '@/types/global'

export default function SearchInput({
    onSearch,
    rawData,
}: Readonly<{
    onSearch: (value: string) => void
    rawData: Record<string, Company>
}>) {
    const [input, setInput] = useState('')
    const [suggestions, setSuggestions] = useState<FuseResult<Company>[]>([])
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null) // State to track selected suggestion index

    const inputRef = useRef<HTMLInputElement | null>(null)  // Add this line

    const manualSelectRef = useRef(false)

    const fuse = useMemo(() => {
        return new Fuse(Object.values(rawData), {
            keys: [
                { name: 'companyname', weight: 0.6 },
                { name: 'nsesymbol', weight: 0.3 },
                { name: 'bsecode', weight: 0.1 },
                { name: 'isin', weight: 0.1 },
            ],
            threshold: 0.25,
            includeMatches: true,
        })
    }, [rawData])

    // Debounced search
    useEffect(() => {
        if (manualSelectRef.current) {
            manualSelectRef.current = false
            return // Skip search on manual select
        }

        if (!input.trim()) {
            setSuggestions([])
            onSearch('')
            return
        }

        const handler = setTimeout(() => {
            const results = fuse.search(input)
            results.sort((a, b) => {
                if (a.score !== b.score) return (a.score ?? 1) - (b.score ?? 1)
                return (b.item.mcap ?? 0) - (a.item.mcap ?? 0)
            })
            setSuggestions(results.slice(0, 8))
            onSearch(input)
        }, 300)

        return () => clearTimeout(handler)
    }, [input, fuse, onSearch])

    // Handle key navigation and selection
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setSelectedIndex((prevIndex) => (prevIndex === null ? 0 : Math.min(suggestions.length - 1, prevIndex + 1)))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setSelectedIndex((prevIndex) => (prevIndex === null ? suggestions.length - 1 : Math.max(0, prevIndex - 1)))
        } else if (e.key === 'Enter' || e.key === ' ') {
            if (selectedIndex !== null) {
                const company = suggestions[selectedIndex].item
                manualSelectRef.current = true
                setInput(company.companyname)
                setSuggestions([])
                onSearch(company.companyname)
            }
        }
    }

    // Focus input when `/` is pressed, but only focus it if it's not already focused
    useEffect(() => {
        const handleSlashFocus = (e: KeyboardEvent) => {
            if (e.key === '/') {
                e.preventDefault();  // Prevent the default behavior (like typing //)

                if (document.activeElement !== inputRef.current) {
                    inputRef.current?.focus();  // Focus the input field only if it's not focused
                } else {
                    // If the input is already focused, let the / character be typed
                    setInput(prev => prev + '/'); // Append / to the input
                }
            }
        }

        window.addEventListener('keydown', handleSlashFocus);

        return () => {
            window.removeEventListener('keydown', handleSlashFocus);
        };
    }, []);

    // Reset selectedIndex when input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value)
        setSelectedIndex(null) // Reset selected index on input change
    }

    return (
        <div className="relative w-full">
            <Input
                ref={inputRef}
                placeholder="Search by name, symbol, or ISIN..."
                value={input}
                className="text-white bg-gray-800 placeholder-gray-400 px-4 py-2 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-200 shadow-md"
                onChange={handleInputChange} // Use the new handler here
                onKeyDown={handleKeyDown} // Listen to key events
            />
            <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                <kbd className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded border border-gray-600 font-mono">/</kbd>
            </div>
            {suggestions.length > 0 && (
                <div className="absolute top-full mt-1 w-full bg-gray-800 border border-gray-600 rounded-md shadow-lg z-20 max-h-80 overflow-y-auto">
                    {suggestions.map(({ item: company, matches }, index) => {
                        const key = company.isin ?? company.nsesymbol ?? company.bsecode ?? company.companyname
                        const companyNameMatch = matches?.find(m => m.key === 'companyname')

                        // Highlight selected suggestion
                        const isSelected = selectedIndex === index
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => {
                                    manualSelectRef.current = true
                                    setInput(company.companyname)
                                    setSuggestions([])
                                    onSearch(company.companyname)
                                }}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        manualSelectRef.current = true
                                        setInput(company.companyname)
                                        setSuggestions([])
                                        onSearch(company.companyname)
                                    }
                                }}
                                className={`px-4 py-2 hover:bg-blue-600 cursor-pointer text-sm text-white w-full text-left ${isSelected ? 'bg-blue-600' : ''
                                    }`} // Highlight selected item
                                tabIndex={0}
                            >
                                {highlightMatches(
                                    company.companyname,
                                    companyNameMatch
                                        ? [
                                            {
                                                ...companyNameMatch,
                                                indices: companyNameMatch.indices.map(([start, end]) => [start, end] as [number, number]),
                                            },
                                        ]
                                        : []
                                )}
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    )
}