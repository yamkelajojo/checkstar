'use client'

import { useMemo } from 'react'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'
import { CHART_TOOLTIP_STYLE } from '@/components/ui/tooltip'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

interface HourData {
  hour: number
  count: number
}

export default function OrdersByHourChart({ data }: { data: HourData[] }) {
  const chartData = useMemo(() => ({
    labels: data.map(d => `${d.hour}:00`),
    datasets: [{
      label: 'Orders',
      data: data.map(d => d.count),
      backgroundColor: data.map(d =>
        d.count > 0 ? 'rgba(245, 130, 32, 0.7)' : 'rgba(209, 213, 219, 0.3)'
      ),
      borderRadius: 3,
    }],
  }), [data])

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: CHART_TOOLTIP_STYLE,
    },
    scales: {
      x: {
        ticks: {
          color: '#94A3B8',
          font: { size: 9 },
          maxRotation: 0,
          callback: function (val: any, idx: number) {
            return idx % 3 === 0 ? `${val}:00` : ''
          },
        },
        grid: { display: false },
      },
      y: {
        ticks: { color: '#94A3B8', font: { size: 10 } },
        grid: { color: 'rgba(0,0,0,0.04)' },
      },
    },
  }), [])

  return <Bar data={chartData} options={options} />
}
