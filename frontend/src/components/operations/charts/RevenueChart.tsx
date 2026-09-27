'use client'

import { useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js'
import { formatZar } from '@/lib/money'
import { formatDayMonth } from '@/lib/dates'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

interface RevenuePoint {
  date: string
  revenue: number
}

export default function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const chartData = useMemo(() => ({
    labels: data.map(d => formatDayMonth(d.date)),
    datasets: [{
      label: 'Revenue (ZAR)',
      data: data.map(d => d.revenue),
      borderColor: '#F58220',
      backgroundColor: 'rgba(245, 130, 32, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 2,
      pointHoverRadius: 5,
    }],
  }), [data])

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => formatZar(ctx.parsed.y),
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#94A3B8', font: { size: 10 } },
        grid: { color: 'rgba(0,0,0,0.04)' },
      },
      y: {
        ticks: {
          color: '#94A3B8',
          font: { size: 10 },
          callback: (v: any) => formatZar(v),
        },
        grid: { color: 'rgba(0,0,0,0.04)' },
      },
    },
  }), [])

  return <Line data={chartData} options={options} />
}
