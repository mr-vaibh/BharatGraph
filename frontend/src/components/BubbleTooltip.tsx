import * as d3 from 'd3'
import { useMemo } from 'react'
import { Tooltip, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'

import type { BubbleDatum } from '@/types/global'

export default function BubbleTooltip({
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
