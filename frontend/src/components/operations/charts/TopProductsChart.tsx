'use client'

import { useMemo } from 'react'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'
import { formatZar } from '@/lib/money'
import { CHART_TOOLTIP_STYLE } from '@/components/ui/tooltip'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

interface Product {
  id: number
  name: string
  order_count: number
  total_quantity: number
  total_revenue: number
}

export default function TopProductsChart({ data }: { data: Product[] }) {
  const chartData = useMemo(() => ({
    labels: data.map(d => d.name.length > 15 ? d.name.slice(0, 15) + '…' : d.name),
    datasets: [{
      label: 'Revenue (ZAR)',
      data: data.map(d => d.total_revenue),
      backgroundColor: 'rgba(245, 130, 32, 0.7)',
      borderRadius: 3,
    }],
  }), [data])

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: { display: false },
      tooltip: {
        ...CHART_TOOLTIP_STYLE,
        callbacks: {
          label: (ctx: any) => formatZar(ctx.parsed.x),
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#94A3B8',
          font: { size: 10 },
          callback: (v: any) => formatZar(v),
        },
        grid: { color: 'rgba(0,0,0,0.04)' },
      },
      y: {
        ticks: { color: '#64748B', font: { size: 10 } },
        grid: { display: false },
      },
    },
  }), [])

  return <Bar data={chartData} options={options} />
}
