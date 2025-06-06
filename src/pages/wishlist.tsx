import { useState, useEffect } from 'react';
import { useStore } from '@/store';
import { formatTZS } from '@/lib/utils';
import { getAvatarUrl } from '@/lib/utils';
import { Gift, DollarSign, Activity, Search, Eye, ExternalLink, X } from 'lucide-react';
import { format } from 'date-fns';

interface WishlistItem {
  id: string;
  user_id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  link: string;
  is_priority: boolean;
  hashtags: string;
  amount_funded: number;
  created_at: string;
  images: string[];
  creator?: {
    avatar?: string;
    name: string;
    bio: string;
  };
  supporter_count: number;
}

const IMAGE_BASE = 'http://studio.nisapoti.com';

export function Wishlist() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'priority' | 'funded' | 'new'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [selectedItem, setSelectedItem] = useState<WishlistItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchWishlistData();
  }, []);

  const fetchWishlistData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch('/api/wishlist', { headers });
      if (!response.ok) throw new Error('Failed to fetch wishlist data');
      const data = await response.json();
      setWishlistItems(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching wishlist data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch wishlist data');
      setLoading(false);
    }
  };

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

  // Filter and search logic
  let filteredItems = wishlistItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filter === 'priority') {
    filteredItems = filteredItems.filter(item => item.is_priority);
  } else if (filter === 'funded') {
    filteredItems = filteredItems.filter(item => item.amount_funded >= item.price);
  } else if (filter === 'new') {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    filteredItems = filteredItems.filter(item => new Date(item.created_at) >= thirtyDaysAgo);
  }

  // Calculate statistics
  const totalItems = wishlistItems.length;
  const totalValue = wishlistItems.reduce((sum, item) => sum + item.price, 0);
  const totalFunded = wishlistItems.reduce((sum, item) => sum + item.amount_funded, 0);
  const priorityItems = wishlistItems.filter(item => item.is_priority).length;
  const fundedItems = wishlistItems.filter(item => item.amount_funded >= item.price).length;

  // Pagination logic
  const totalPages = Math.ceil(filteredItems.length / pageSize);
  const paginatedItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Helper to truncate text
  const truncate = (str: string, n: number) => (str.length > n ? str.slice(0, n) + '...' : str);

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Wishlist Management</h1>
          <p className="text-gray-600 mt-1">View and manage creator wishlist items</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search wishlist items..."
              className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-lg">
              <Gift className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Total Items</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{totalItems}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Total Value</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{formatTZS(totalValue)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-50 rounded-lg">
              <Activity className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Priority Items</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{priorityItems}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Total Funded</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{formatTZS(totalFunded)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Button Group */}
      <div className="flex flex-wrap items-center gap-2 mb-6 sm:mb-8">
        {[
          { label: 'All', value: 'all' },
          { label: 'Priority', value: 'priority' },
          { label: 'Funded', value: 'funded' },
          { label: 'New', value: 'new' },
        ].map(option => (
          <button
            key={option.value}
            className={`px-3 sm:px-4 py-2 rounded-full font-medium transition-colors text-xs sm:text-sm
              ${filter === option.value
                ? 'bg-blue-600 text-white shadow'
                : 'bg-gray-100 text-gray-700 hover:bg-blue-50'}
            `}
            onClick={() => setFilter(option.value as typeof filter)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Wishlist Items Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <div className="min-w-[600px]">
          <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Funded</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Added</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden">
                        {item.images && item.images[0] ? (
                          <img src={item.images[0].startsWith('http') ? item.images[0] : IMAGE_BASE + item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <Gift className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{truncate(item.name, 40)}</div>
                        <div className="text-gray-500 text-xs truncate max-w-[200px]">{item.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {formatTZS(item.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <div className="text-sm font-medium text-gray-900">
                        {formatTZS(item.amount_funded)}
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, (item.amount_funded / item.price) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.is_priority ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
                        High Priority
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                        Normal
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(item.created_at), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => { setSelectedItem(item); setModalOpen(true); }}
                        className="text-blue-600 hover:text-blue-900 transition-colors p-1 hover:bg-blue-50 rounded-lg"
                        title="View Details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <a
                        href={`/creator/${item.user_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-gray-900 transition-colors p-1 hover:bg-gray-50 rounded-lg"
                        title="View Creator"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for wishlist details */}
      {modalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl"
              onClick={() => setModalOpen(false)}
            >
              <X />
            </button>
            {/* Images carousel/gallery */}
            <div className="flex gap-4 mb-4">
              {selectedItem.images && selectedItem.images.length > 0 ? (
                <div className="flex gap-2 overflow-x-auto">
                  {selectedItem.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img.startsWith('http') ? img : IMAGE_BASE + img}
                      alt={selectedItem.name}
                      className="w-24 h-24 object-cover rounded-lg border"
                    />
                  ))}
                </div>
              ) : (
                <div className="w-24 h-24 flex items-center justify-center bg-gray-200 rounded-lg">
                  <Gift className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>
            {/* Title and description */}
            <div className="mb-2 text-2xl font-bold text-gray-900">{selectedItem.name}</div>
            <div className="mb-2 text-gray-700 text-base leading-relaxed">{selectedItem.description}</div>
            {/* Hashtags */}
            {selectedItem.hashtags && (
              <div className="mb-2 flex flex-wrap gap-2">
                {selectedItem.hashtags.split(',').map((tag, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded-full border text-xs font-medium border-orange-400 text-orange-600 bg-orange-50">
                    {tag.trim()}
                  </span>
                ))}
              </div>
            )}
            {/* Creator info */}
            {selectedItem.creator && (
              <div className="flex items-center gap-4 mb-4 mt-2">
                <img
                  src={getAvatarUrl(selectedItem.creator.avatar ?? null) || '/creator/assets/default_avatar.png'}
                  className="w-12 h-12 rounded-full border-2 border-orange-200 shadow"
                  alt="Creator Avatar"
                />
                <div>
                  <div className="font-bold text-lg text-gray-900">{selectedItem.creator.name}</div>
                  <div className="text-sm text-gray-500">{selectedItem.creator.bio}</div>
                </div>
              </div>
            )}
            {/* Funding info */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div>
                <div className="text-gray-500 text-xs">Amount Funded</div>
                <div className="text-lg font-bold text-green-600">{formatTZS(selectedItem.amount_funded)}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs">Supporters</div>
                <div className="text-lg font-bold text-orange-600">{selectedItem.supporter_count}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs">Target</div>
                <div className="text-lg font-bold text-blue-600">{formatTZS(selectedItem.price)}</div>
              </div>
            </div>
            {/* Progress bar */}
            <div className="w-full mb-2">
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-3 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (selectedItem.amount_funded / selectedItem.price) * 100)}%`, background: '#f97316' }}
                ></div>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                className="px-4 py-2 rounded-lg text-white bg-orange-500 hover:bg-orange-600 font-semibold"
                onClick={() => setModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <nav className="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                  currentPage === page
                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
} 