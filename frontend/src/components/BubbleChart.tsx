'use client'

import * as d3 from 'd3'
import Fuse from 'fuse.js'
import { useEffect, useRef, useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import companyData from '@/data/stock_query.json'

type Company = {
  mcap: number
  companyshortname: string
  companyname: string
  isin: string
  sectorname: string
  industryname: string
  type: string
  bsecode?: string
  nsesymbol?: string
}

type BubbleDatum = {
  name: string
  value: number
  data: Company
}

type Dimensions = {
  width: number
  height: number
}

/** Hook: get current window dimensions */
function useWindowDimensions(): Dimensions {
  const [dimensions, setDimensions] = useState<Dimensions>({
    width: window.innerWidth,
    height: window.innerHeight,
  })

  useEffect(() => {
    function handleResize() {
      setDimensions({ width: window.innerWidth, height: window.innerHeight })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return dimensions
}

/** Hook: Prepare Bubble Data, Hierarchy, and Pack layout */
function useBubbleData(dimensions: Dimensions | null, rawData: Record<string, Company>) {
  return useMemo(() => {
    if (!dimensions) return null

    const margin = 1
    const width = dimensions.width - margin * 2
    const height = dimensions.height - margin * 2

    // Filter and map raw data to BubbleDatum[]
    const flatData: BubbleDatum[] = Object.entries(rawData)
      .filter(([_, details]) => details && typeof details.mcap === 'number' && details.mcap > 0)
      .map(([name, details]) => ({
        name,
        value: details.mcap,
        data: details,
      }))

    // Build hierarchy and pack layout
    const root = d3
      .pack<BubbleDatum>()
      .size([width, height])
      .padding(3)(
        d3
          .hierarchy<BubbleDatum & { children?: BubbleDatum[] }>({
            name: 'root',
            value: 0,
            data: {} as Company,
            children: flatData
          })
          .sum(d => d.value)
      )

    return { root, leaves: root.leaves(), width, height }
  }, [dimensions, rawData])
}

/** Hook: Setup and return D3 zoom behavior */
function useZoom(svgRef: React.RefObject<SVGSVGElement | null>, gRef: React.RefObject<SVGGElement | null>, rootData: any, dimensions: Dimensions | null) {
  useEffect(() => {
    if (!svgRef.current || !gRef.current || !rootData || !dimensions) return

    const svg = d3.select(svgRef.current)
    const g = d3.select(gRef.current)

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 20])
      .wheelDelta((event: WheelEvent) => -event.deltaY * 0.001)
      .on('zoom', event => {
        g.attr('transform', event.transform.toString())

        // Show/hide labels based on zoom scale
        g.selectAll('text').each(function (d: any) {
          const scaledR = d.r * event.transform.k
          const show = scaledR > 30
          d3.select(this)
            .style('display', show ? 'block' : 'none')
            .attr(
              'transform',
              `translate(${d.x},${d.y}) scale(${1 / event.transform.k}) translate(${-d.x},${-d.y})`
            )
        })
      })

    svg.call(zoom)

    // Initial zoom center and scale
    const scale = Math.min(dimensions.width, dimensions.height) / (rootData.root.r * 2)
    const tx = dimensions.width / 2 - rootData.root.x * scale
    const ty = dimensions.height / 2 - rootData.root.y * scale
    svg.call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale))

      // Save zoom instance to element for external access
      ; (svg.node() as any).__zoomInstance = zoom
  }, [svgRef, gRef, rootData, dimensions])
}

/** SearchInput component handles search input and Fuse */
function SearchInput({
  onSearch,
  rawData,
}: Readonly<{
  onSearch: (value: string) => void
  rawData: Record<string, Company>
}>) {
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState<Fuse.FuseResult<Company>[]>([])
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null) // State to track selected suggestion index

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

  // Highlight matches helper
  function highlightMatches(text: string, matches: { indices: [number, number][] }[] = []) {
    const matchedIndexes = new Set<number>()
    matches.forEach(({ indices }) => {
      indices.forEach(([start, end]: [number, number]) => {
        for (let i = start; i <= end; i++) matchedIndexes.add(i)
      })
    })

    return (
      <>
        {text.split('').map((char, idx) =>
          matchedIndexes.has(idx) ? <b key={`${char}-${idx}`}>{char}</b> : char
        )}
      </>
    )
  }

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

  // Reset selectedIndex when input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
    setSelectedIndex(null) // Reset selected index on input change
  }

  return (
    <div className="relative w-full">
      <Input
        placeholder="Search by name, symbol, or ISIN..."
        value={input}
        className="text-white bg-gray-800 placeholder-gray-400 px-4 py-2 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-200 shadow-md"
        onChange={handleInputChange} // Use the new handler here
        onKeyDown={handleKeyDown} // Listen to key events
      />
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
                className={`px-4 py-2 hover:bg-blue-600 cursor-pointer text-sm text-white w-full text-left ${
                  isSelected ? 'bg-blue-600' : ''
                }`} // Highlight selected item
                tabIndex={0}
              >
                {highlightMatches(company.companyname, companyNameMatch ? [companyNameMatch] : [])}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/** Tooltip component */
function BubbleTooltip({
  hoveredData,
  tooltipPos,
  tooltipDirection,
  tooltipRef,
}: Readonly<{
  hoveredData: BubbleDatum
  tooltipPos: { x: number; y: number }
  tooltipDirection: 'above' | 'below'
  tooltipRef: React.RefObject<HTMLDivElement>
}>) {
  // Position fix logic
  const style = useMemo(() => {
    if (!tooltipRef.current) return {}
    const padding = 10
    const tooltipWidth = tooltipRef.current.offsetWidth ?? 300
    let left = tooltipPos.x + 10

    if (left - tooltipWidth / 2 < padding) {
      left = padding + tooltipWidth / 2
    } else if (left + tooltipWidth / 2 > window.innerWidth - padding) {
      left = window.innerWidth - padding - tooltipWidth / 2
    }

    return {
      position: 'absolute' as const,
      pointerEvents: 'none' as const,
      top:
        tooltipDirection === 'below'
          ? tooltipPos.y + 10
          : tooltipPos.y - (tooltipRef.current?.offsetHeight ?? 40) - 10,
      left,
      transform: 'translate(-50%, 0)',
      whiteSpace: 'nowrap',
      padding: '0.75rem 1rem',
      zIndex: 9999,
      maxWidth: '90vw',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    }
  }, [tooltipPos, tooltipDirection, tooltipRef])

  return (
    <TooltipProvider>
      <Tooltip open={true}>
        <TooltipContent
          ref={tooltipRef}
          side={tooltipDirection === 'below' ? 'top' : 'bottom'}
          align="center"
          className="bg-gray-900 text-white shadow-lg rounded-md p-3"
          style={style}
        >
          <div className="flex flex-col space-y-1">
            <div className="text-lg font-semibold leading-tight">{hoveredData.data.companyname}</div>
            <div className="text-md font-medium text-green-400">
              ₹{d3.format(',d')(hoveredData.value)} Cr
            </div>
            <div className="text-sm text-gray-300">Sector: {hoveredData.data.sectorname}</div>
            <div className="text-sm text-gray-300">Industry: {hoveredData.data.industryname}</div>
            <div className="text-xs text-gray-500 mt-1">
              ISIN: {hoveredData.data.isin} <br />
              NSE: {hoveredData.data.nsesymbol ?? '-'} <br />
              BSE: {hoveredData.data.bsecode ?? '-'}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default function BubbleChart() {
  const svgRef = useRef<SVGSVGElement>(null)
  const gRef = useRef<SVGGElement>(null)

  const dimensions = useWindowDimensions()

  // States
  const [search, setSearch] = useState('')
  const [hoveredData, setHoveredData] = useState<BubbleDatum | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)
  const [tooltipDirection, setTooltipDirection] = useState<'above' | 'below'>('below')

  const tooltipRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>

  // Prepare bubble data and layout
  const bubbleData = useBubbleData(dimensions, companyData)

  // Setup zoom and labels showing
  useZoom(svgRef, gRef, bubbleData, dimensions)

  // Handle search-based zooming
  useEffect(() => {
    if (!bubbleData || !svgRef.current) return

    const svg = d3.select(svgRef.current)
    const zoom: d3.ZoomBehavior<SVGSVGElement, unknown> = (svg.node() as any).__zoomInstance
    if (!zoom) return

    const { leaves, root } = bubbleData
    const searchLower = search.trim().toLowerCase()
    if (!searchLower) {
      const scale = Math.min(window.innerWidth, window.innerHeight) / (root.r * 2)
      const tx = window.innerWidth / 2 - root.x * scale
      const ty = window.innerHeight / 2 - root.y * scale

      svg
        .transition()
        .duration(600)
        .ease(d3.easeCubicOut)
        .call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale))
      return
    }

    const matched = leaves.find(d => d.data.name.toLowerCase() === searchLower)
    if (matched) {
      const scale = Math.min(window.innerWidth, window.innerHeight) / (matched.r * 2)
      const tx = window.innerWidth / 2 - matched.x * scale
      const ty = window.innerHeight / 2 - matched.y * scale

      svg
        .transition()
        .duration(600)
        .ease(d3.easeCubicOut)
        .call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale))
    }
  }, [search, bubbleData])

  // Render bubbles and labels
  useEffect(() => {
    if (!bubbleData || !svgRef.current || !gRef.current) return

    const { leaves } = bubbleData
    const g = d3.select(gRef.current)

    // Clear previous elements (only once here, as data is memoized)
    g.selectAll('*').remove()

    // Color scale by sectorname
    const color = d3.scaleOrdinal<string, string>(d3.schemeTableau10)

    // Circles
    const nodes = g
      .selectAll('circle')
      .data(leaves, (d: any) => d.data.name)
      .join('circle')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', d => d.r)
      .attr('fill', d => color(d.data.data.sectorname))
      .attr('stroke', '#1D4ED8')
      .attr('fill-opacity', 0.7)
      .attr('vector-effect', 'non-scaling-stroke')
      .attr('pointer-events', 'visiblePainted')

    // Labels
    g
      .selectAll('text')
      .data(leaves, (d: any) => d.data.name)
      .join('text')
      .attr('x', d => d.x)
      .attr('y', d => d.y)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', 'white')
      .attr('font-size', '10px')
      .attr('pointer-events', 'none')
      .text(d => d.data.data.companyname)
      .style('display', 'none')

    // Events (use useCallback handlers or stable functions)
    const handleMouseOver = (event: MouseEvent, d: any) => {
      setHoveredData(d.data)
      setTooltipPos({ x: event.pageX, y: event.pageY })
    }
    const handleMouseMove = (event: MouseEvent) => {
      setTooltipPos({ x: event.pageX, y: event.pageY })
    }
    const handleMouseOut = () => {
      setHoveredData(null)
      setTooltipPos(null)
    }

    nodes.on('mouseover', handleMouseOver).on('mousemove', handleMouseMove).on('mouseout', handleMouseOut)
  }, [bubbleData])

  // Tooltip direction logic
  useEffect(() => {
    if (!tooltipPos || !tooltipRef.current) return

    const tooltipHeight = tooltipRef.current.offsetHeight
    const spaceBelow = window.innerHeight - tooltipPos.y
    const spaceAbove = tooltipPos.y

    if (spaceBelow < tooltipHeight + 10 && spaceAbove > tooltipHeight + 10) {
      setTooltipDirection('above')
    } else {
      setTooltipDirection('below')
    }
  }, [tooltipPos])

  return (
    <div className="relative w-full h-screen bg-black text-white overflow-hidden">
      <div className="absolute z-10 top-4 right-4 w-[300px]">
        <SearchInput onSearch={setSearch} rawData={companyData} />
      </div>

      <svg ref={svgRef} className="absolute top-0 left-0 w-full h-full">
        <g ref={gRef} className="bubbles" />
      </svg>

      {hoveredData && tooltipPos && (
        <BubbleTooltip
          hoveredData={hoveredData}
          tooltipPos={tooltipPos}
          tooltipDirection={tooltipDirection}
          tooltipRef={tooltipRef}
        />
      )}
    </div>
  )
}
