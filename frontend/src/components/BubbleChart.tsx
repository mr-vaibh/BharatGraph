/* eslint-disable @typescript-eslint/no-explicit-any */

'use client'

import * as d3 from 'd3'
import { useEffect, useRef, useState } from 'react'
import companyData from '@/data/stock_query.json'

import SearchInput from '@/components/SearchInput'
import BubbleTooltip from '@/components/BubbleTooltip'
import { useBubbleData } from '@/hooks/useBubbleData'
import { useZoom } from '@/hooks/useZoom'
import { useWindowDimensions } from '@/hooks/useWindowDimensions'

import type { BubbleDatum } from '@/types/global'

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
