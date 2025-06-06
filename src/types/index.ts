export interface Creator {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  creator_url: string | null;
  avatar_url: string | null;
  bio: string | null;
  category: string | null;
  website: string | null;
  email: string;
  email_verified: boolean;
  total_earnings: number;
  total_supporters: number;
  created_at?: string;
}

export interface Transaction {
  id: string;
  creator_id: string;
  creator_name: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'processing';
  payment_method: string;
  type: 'payout' | 'subscription' | 'one-time';
}

export interface Stats {
  total_creators: number;
  active_creators: number;
  total_revenue: number;
  pending_payouts: number;
  total_paid_out?: number;
  growth?: {
    creators: string;
    revenue: string;
  };
  wishlist?: {
    total_items: number;
    funded_items: number;
    total_value: number;
    total_funded: number;
  };
}

export interface ChartData {
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