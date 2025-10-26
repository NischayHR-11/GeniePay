import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export default function SpendingChart({ subscriptions }) {
  // Generate last 6 months data
  const months = []
  const currentDate = new Date()
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
    months.push(date.toLocaleDateString('en-US', { month: 'short' }))
  }

  // Calculate spending for each month (simplified - shows current active spending)
  const activeSpending = subscriptions
    .filter(sub => sub.status === 'active')
    .reduce((sum, sub) => sum + sub.price, 0)

  // Simulate historical data (in real app, this would come from backend)
  const data = months.map((_, index) => {
    const variation = Math.random() * 0.2 - 0.1 // ±10% variation
    return Math.max(0, activeSpending * (1 + variation * (5 - index) / 5))
  })

  const chartData = {
    labels: months,
    datasets: [
      {
        label: 'Monthly Spending (₹)',
        data: data,
        borderColor: '#FF0044',
        backgroundColor: 'rgba(255, 0, 68, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#FF0044',
        pointBorderColor: '#00D9FF',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#0A0E27',
        titleColor: '#00D9FF',
        bodyColor: '#fff',
        borderColor: '#FF0044',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context) => `₹${context.parsed.y.toFixed(2)}`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(0, 217, 255, 0.1)',
        },
        ticks: {
          color: '#9CA3AF',
        },
      },
      y: {
        grid: {
          color: 'rgba(0, 217, 255, 0.1)',
        },
        ticks: {
          color: '#9CA3AF',
          callback: (value) => `₹${value}`,
        },
      },
    },
  }

  return (
    <div className="h-64">
      <Line data={chartData} options={options} />
    </div>
  )
}
