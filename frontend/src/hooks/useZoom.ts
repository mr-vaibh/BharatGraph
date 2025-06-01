import * as d3 from 'd3'
import { useEffect } from 'react'

import type { Dimensions } from '@/types/global'

export function useZoom(svgRef: React.RefObject<SVGSVGElement | null>, gRef: React.RefObject<SVGGElement | null>, rootData: any, dimensions: Dimensions | null) {
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