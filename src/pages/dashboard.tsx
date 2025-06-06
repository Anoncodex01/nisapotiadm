import { useEffect, useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Users, Activity, DollarSign, Wallet, TrendingUp, CreditCard, Gift } from 'lucide-react';
import { useStore } from '../store';
import { formatTZS } from '../lib/utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

type TimeRange = 'day' | '7d' | '30d' | 'all';

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
    borderWidth?: number;
    tension?: number;
    fill?: boolean;
  }[];
}

export function Dashboard() {
  const { stats, setStats } = useStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [chartData, setChartData] = useState<{ revenue: ChartData; creators: ChartData }>({
    revenue: {
      labels: [],
      datasets: [{
        label: 'Revenue',
        data: [],
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true
      }]
    },
    creators: {
      labels: [],
      datasets: [{
        label: 'New Creators',
        data: [],
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2
      }]
    }
  });

  const fetchDashboardData = async (range: TimeRange) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const creatorsResponse = await fetch(`/api/creators?timeRange=${range}`, {
        headers,
      });
      if (!creatorsResponse.ok) throw new Error('Failed to fetch creators data');
      const creatorsData = await creatorsResponse.json();
      const withdrawalsResponse = await fetch(`/api/withdrawals?timeRange=${range}`, {
        headers,
      });
      if (!withdrawalsResponse.ok) throw new Error('Failed to fetch withdrawals data');
      const withdrawalsData = await withdrawalsResponse.json();
      const activeCreators = creatorsData.filter((c: any) => c.total_earnings > 0).length;
      const totalRevenue = creatorsData.reduce((sum: number, creator: any) => sum + (creator.total_earnings || 0), 0);
      const startDate = new Date();
      if (range === '7d') startDate.setDate(startDate.getDate() - 7);
      else if (range === '30d') startDate.setDate(startDate.getDate() - 30);
      else if (range === 'day') startDate.setHours(0, 0, 0, 0);
      else startDate.setMonth(startDate.getMonth() - 6);
      const dailyCreators = creatorsData.reduce((acc: Record<string, number>, creator: any) => {
        const createdAt = new Date(creator.created_at);
        if (createdAt >= startDate) {
          const dateKey = createdAt.toLocaleDateString('default', { month: 'short', day: range !== 'all' ? 'numeric' : undefined });
          acc[dateKey] = (acc[dateKey] || 0) + 1;
        }
        return acc;
      }, {});
      const withdrawalsArr = Array.isArray(withdrawalsData.withdrawals)
        ? withdrawalsData.withdrawals
        : Array.isArray(withdrawalsData)
          ? withdrawalsData
          : [];
      const dailyRevenue = withdrawalsArr.reduce((acc: Record<string, number>, withdrawal: any) => {
        const createdAt = new Date(withdrawal.created_at);
        if (createdAt >= startDate && withdrawal.status === 'COMPLETED') {
          const dateKey = createdAt.toLocaleDateString('default', { 
            month: 'short',
            day: range !== 'all' ? 'numeric' : undefined
          });
          acc[dateKey] = (acc[dateKey] || 0) + withdrawal.amount;
        }
        return acc;
      }, {});
      setStats({
        total_creators: creatorsData.length,
        active_creators: activeCreators,
        total_revenue: totalRevenue,
        pending_payouts: withdrawalsData.summary.pending_withdrawals,
        total_paid_out: withdrawalsData.summary.total_withdrawn,
        growth: {
          creators: ((activeCreators / creatorsData.length) * 100).toFixed(1),
          revenue: ((withdrawalsData.summary.total_withdrawn / totalRevenue) * 100).toFixed(1)
        },
        wishlist: {
          total_items: 0,
          funded_items: 0,
          total_value: 0,
          total_funded: 0
        }
      });
      const dates = [...new Set([
        ...Object.keys(dailyCreators),
        ...Object.keys(dailyRevenue)
      ])].sort((a, b) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateA.getTime() - dateB.getTime();
      });
      setChartData({
        revenue: {
          labels: dates,
          datasets: [{
            ...chartData.revenue.datasets[0],
            data: dates.map(date => dailyRevenue[date] || 0)
          }]
        },
        creators: {
          labels: dates,
          datasets: [{
            ...chartData.creators.datasets[0],
            data: dates.map(date => dailyCreators[date] || 0)
          }]
        }
      });
      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(timeRange);
  }, [timeRange]);

  const statCards = [
    {
      title: 'Total Creators',
      value: stats.total_creators || 0,
      icon: Users,
      bgColor: 'bg-blue-500',
      textColor: 'text-blue-600',
      growth: `${stats.growth?.creators || '0'}%`
    },
    {
      title: 'Active Creators',
      value: stats.active_creators || 0,
      icon: Activity,
      bgColor: 'bg-green-500',
      textColor: 'text-green-600',
      growth: `${((stats.active_creators || 0) / (stats.total_creators || 1) * 100).toFixed(1)}%`
    },
    {
      title: 'Total Revenue',
      value: formatTZS(stats.total_revenue || 0),
      icon: CreditCard,
      bgColor: 'bg-purple-500',
      textColor: 'text-purple-600',
      growth: `${stats.growth?.revenue || '0'}%`
    },
    {
      title: 'Pending Payouts',
      value: formatTZS(stats.pending_payouts || 0),
      icon: Wallet,
      bgColor: 'bg-orange-500',
      textColor: 'text-orange-600',
      growth: `${((stats.pending_payouts || 0) / (stats.total_revenue || 1) * 100).toFixed(1)}%`
    },
    {
      title: 'Wishlist Items',
      value: stats.wishlist?.total_items || 0,
      icon: Gift,
      bgColor: 'bg-pink-500',
      textColor: 'text-pink-600',
      growth: `${((stats.wishlist?.funded_items || 0) / (stats.wishlist?.total_items || 1) * 100).toFixed(1)}%`
    },
    {
      title: 'Wishlist Value',
      value: formatTZS(stats.wishlist?.total_value || 0),
      icon: DollarSign,
      bgColor: 'bg-indigo-500',
      textColor: 'text-indigo-600',
      growth: `${((stats.wishlist?.total_funded || 0) / (stats.wishlist?.total_value || 1) * 100).toFixed(1)}%`
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-500 text-center mb-4">{error}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all duration-200"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600">Welcome back, Admin!</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="inline-flex rounded-lg border border-gray-100 bg-white p-1 shadow-sm w-full sm:w-auto">
            <button 
              onClick={() => setTimeRange('day')}
              className={`inline-block rounded-md px-2 sm:px-4 py-2 text-xs sm:text-sm transition-all duration-200 w-1/4 sm:w-auto ${
                timeRange === 'day' 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Day
            </button>
            <button 
              onClick={() => setTimeRange('7d')}
              className={`inline-block rounded-md px-2 sm:px-4 py-2 text-xs sm:text-sm transition-all duration-200 w-1/4 sm:w-auto ${
                timeRange === '7d' 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              7 Days
            </button>
            <button 
              onClick={() => setTimeRange('30d')}
              className={`inline-block rounded-md px-2 sm:px-4 py-2 text-xs sm:text-sm transition-all duration-200 w-1/4 sm:w-auto ${
                timeRange === '30d' 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              30 Days
            </button>
            <button 
              onClick={() => setTimeRange('all')}
              className={`inline-block rounded-md px-2 sm:px-4 py-2 text-xs sm:text-sm transition-all duration-200 w-1/4 sm:w-auto ${
                timeRange === 'all' 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              All Time
            </button>
          </div>
          <span className="px-2 sm:px-4 py-2 bg-orange-100 text-orange-800 rounded-lg text-xs sm:text-sm font-medium w-full sm:w-auto text-center">
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        {statCards.map((card) => (
          <div key={card.title} className="group relative overflow-hidden bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100">
            <div className="p-4 sm:p-5 relative">
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 ${card.bgColor} rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-transform`}>
                  <card.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex items-center space-x-1">
                  <TrendingUp className={`w-4 h-4 ${card.textColor}`} />
                  <span className={`text-xs font-semibold ${card.textColor}`}>{card.growth}</span>
                </div>
              </div>
              <div className="mt-3 sm:mt-4">
                <h3 className="text-xs sm:text-sm font-medium text-gray-500">{card.title}</h3>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-8">Revenue Overview</h2>
          <div className="h-[200px] sm:h-[300px] overflow-x-auto">
            <Line data={chartData.revenue} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-8">Creator Growth</h2>
          <div className="h-[200px] sm:h-[300px] overflow-x-auto">
            <Bar data={chartData.creators} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
      </div>
    </div>
  );
} 