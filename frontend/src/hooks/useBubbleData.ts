import * as d3 from 'd3'
import { useMemo } from 'react'

import type { Company, BubbleDatum, Dimensions } from '@/types/global'

export function useBubbleData(dimensions: Dimensions | null, rawData: Record<string, Company>) {
  return useMemo(() => {
    if (!dimensions) return null

    const margin = 1
    const width = dimensions.width - margin * 2
    const height = dimensions.height - margin * 2

    // Filter and map raw data to BubbleDatum[]
    const flatData: BubbleDatum[] = Object.entries(rawData)
      .filter(([, details]) => details && typeof details.mcap === 'number' && details.mcap > 0)
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
