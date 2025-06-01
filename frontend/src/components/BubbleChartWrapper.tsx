'use client'

import dynamic from 'next/dynamic'

const BubbleChart = dynamic(() => import('@/components/BubbleChart'), {
  ssr: false,
})

export default function BubbleChartWrapper() {
  return <BubbleChart />
}
