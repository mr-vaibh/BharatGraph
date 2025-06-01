'use client'

import * as d3 from 'd3'
import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
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

export default function BubbleChart(): JSX.Element {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [search, setSearch] = useState<string>('')
  const [dimensions, setDimensions] = useState<Dimensions | null>(null)
  const tooltipRef = useRef<HTMLDivElement | null>(null)

  const [hoveredData, setHoveredData] = useState<BubbleDatum | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number, y: number } | null>(null);


  useEffect(() => {
    const updateSize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight })
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  useEffect(() => {
    if (!dimensions) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const margin = 1
    const format = d3.format(',d')
    const color = d3.scaleOrdinal<string, string>(d3.schemeTableau10)

    const flatData: BubbleDatum[] = Object.entries(companyData)
      .filter(([_, details]) => details && typeof details.mcap === 'number')
      .map(([name, details]) => ({
        name,
        value: (details as Company).mcap,
        data: details as Company,
      }))

    const root = d3
      .pack<BubbleDatum>()
      .size([dimensions.width - margin * 2, dimensions.height - margin * 2])
      .padding(3)(
        d3.hierarchy<{ children: BubbleDatum[] }>({ children: flatData })
          .sum(d => d.value)
      )

    const g = svg.append('g')

    const leaves = root.leaves()

    const nodes = g.selectAll('circle')
      .data(leaves)
      .join('circle')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', d => d.r)
      .attr('fill', d => color(d.data.data.sectorname))
      .attr('stroke', '#1D4ED8')
      .attr('fill-opacity', 0.7)
      .attr('vector-effect', 'non-scaling-stroke')
      .attr('pointer-events', 'visiblePainted')

    // Add text labels (initially hidden)
    const labels = g.selectAll('text')
      .data(leaves)
      .join('text')
      .attr('x', d => d.x)
      .attr('y', d => d.y) // no +4 here
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle') // vertical centering
      .attr('fill', 'white')
      .attr('font-size', '10px')
      .attr('pointer-events', 'none')
      .text(d => d.data.data.companyshortname || d.data.name)
      .style('display', 'none')

    // Tooltip interaction
    nodes.on('mouseover', (event, d) => {
      setHoveredData(d.data);
      setTooltipPos({ x: event.pageX, y: event.pageY });
    })

    nodes.on('mousemove', (event) => {
      setTooltipPos({ x: event.pageX, y: event.pageY });
    })

    nodes.on('mouseout', () => {
      setHoveredData(null);
      setTooltipPos(null);
    })

    // Zoom behavior with label visibility control
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 20])
      .wheelDelta((event: WheelEvent) => -event.deltaY * 0.001)
      .on('zoom', (event) => {
        const transform = event.transform
        g.attr('transform', transform.toString())

        labels.each(function (d) {
          const scaledR = d.r * transform.k
          const shouldShow = scaledR > 30
          d3.select(this)
            .style('display', shouldShow ? 'block' : 'none')
            .attr('transform', `translate(${d.x},${d.y}) scale(${1 / transform.k}) translate(${-d.x},${-d.y})`)
        })
      })

    svg.call(zoom)

    // Search and zoom to match
    const matchedNode = leaves.find(d =>
      d.data.name.toLowerCase() === search.trim().toLowerCase()
    )

    const zoomTo = (x: number, y: number, r: number) => {
      const scale = Math.min(dimensions.width, dimensions.height) / (r * 2)
      const translate = [
        dimensions.width / 2 - x * scale,
        dimensions.height / 2 - y * scale,
      ]

      svg.transition()
        .duration(600)
        .ease(d3.easeCubicOut)
        .call(zoom.transform, d3.zoomIdentity.translate(...translate).scale(scale))
    }

    if (search.trim() === '') {
      zoomTo(dimensions.width / 2, dimensions.height / 2, root.r)
    } else if (matchedNode) {
      zoomTo(matchedNode.x, matchedNode.y, matchedNode.r)
    }

  }, [dimensions, search])

  return (
    <div className="relative w-full h-screen bg-black text-white overflow-hidden">
      <div className="absolute z-10 top-4 right-4 w-[300px]">
        <Input
          placeholder="Search company..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="text-white bg-gray-800 placeholder-gray-400 px-4 py-2 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-200 shadow-md
              "
        />
      </div>

      <svg ref={svgRef} className="absolute top-0 left-0 w-full h-full" />

      {/* Tooltip */}
      <TooltipProvider>
        {hoveredData && tooltipPos && (
          <Tooltip open={true}>
            <TooltipContent
              side="top"
              align="center"
              className="bg-gray-900 text-white shadow-lg rounded-md p-3"
              style={{
                position: 'absolute',
                pointerEvents: 'none',
                top: tooltipPos.y + 10,
                left: tooltipPos.x + 10,
                transform: 'translate(-50%, -100%)',
                whiteSpace: 'nowrap',       // Prevent line breaks
                padding: '0.75rem 1rem',    // Slightly larger horizontal padding
                zIndex: 9999,
                maxWidth: '90vw',           // Optional max width to prevent extreme overflow
                overflow: 'hidden',         // Hide overflow if text is too long
                textOverflow: 'ellipsis',   // Show ellipsis for overflowed text (optional)
              }}
            >
              <div className="flex flex-col space-y-1">
                <div className="text-lg font-semibold leading-tight">{hoveredData.data.companyname}</div>
                <div className="text-md font-medium text-green-400">₹{d3.format(',d')(hoveredData.value)} Cr</div>
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
        )}
      </TooltipProvider>
    </div>
  )
}
