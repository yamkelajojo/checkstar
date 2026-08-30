'use client'

import { useMemo } from 'react'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

interface RiderUtil {
  rider_id: number
  name: string
  delivery_count: number
  avg_delivery_time: number | null
}

export default function RiderUtilizationChart({ data }: { data: RiderUtil[] }) {
  const chartData = useMemo(() => ({
    labels: data.map(d => d.name),
    datasets: [{
      label: 'Deliveries',
      data: data.map(d => d.delivery_count),
      backgroundColor: data.map(d =>
        d.delivery_count > 10 ? 'rgba(16, 185, 129, 0.7)' :
        d.delivery_count > 5 ? 'rgba(245, 130, 32, 0.7)' :
        'rgba(209, 213, 219, 0.5)'
      ),
      borderRadius: 3,
    }],
  }), [data])

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        ticks: { color: '#94A3B8', font: { size: 10 } },
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
