import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Calendar,
  Plus,
  Search,
  BarChart3,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useStats } from '../hooks/useDatabase';
import { formatCurrency, formatDate, isOverdue } from '../utils';
import { Item } from '../types';
import * as db from '../services/database';

const StatCard = ({ label, value, icon: Icon, color, delay }: {
  label: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color: string;
  delay: number;
}) => (
  <div
    className="card p-5 animate-fade-in-up"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} flex-shrink-0`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-sm text-[var(--color-text-muted)]">{label}</p>
        <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>{value}</p>
      </div>
    </div>
  </div>
);

export function Dashboard() {
  const { stats } = useStats();
  const [recentItems, setRecentItems] = useState<Item[]>([]);

  useEffect(() => {
    setRecentItems(db.getRecentItems(5));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>
            Welcome Back
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            Here's what's happening with your inventory
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/items/new" className="btn btn-primary">
            <Plus className="w-4 h-4" />
            Add Item
          </Link>
          <Link to="/reports" className="btn btn-secondary">
            <BarChart3 className="w-4 h-4" />
            Reports
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Items"
          value={stats.totalItems}
          icon={Package}
          color="bg-gradient-to-br from-indigo-500 to-indigo-600"
          delay={0}
        />
        <StatCard
          label="Total Value"
          value={formatCurrency(stats.totalValue)}
          icon={DollarSign}
          color="bg-gradient-to-br from-emerald-500 to-emerald-600"
          delay={50}
        />
        <StatCard
          label="Added This Month"
          value={stats.itemsAddedThisMonth}
          icon={TrendingUp}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
          delay={100}
        />
        <StatCard
          label="Upcoming Reminders"
          value={stats.upcomingReminders.length}
          icon={AlertCircle}
          color="bg-gradient-to-br from-amber-500 to-orange-600"
          delay={150}
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Items */}
        <div className="card animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <div className="card-header">
            <h2 className="text-lg font-semibold">Recent Items</h2>
            <Link to="/items" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="card-body">
            {recentItems.length === 0 ? (
              <div className="py-8 text-center">
                <Package className="w-12 h-12 mx-auto mb-3 text-[var(--color-text-muted)] opacity-50" />
                <p className="text-[var(--color-text-secondary)] mb-4">No items yet</p>
                <Link to="/items/new" className="btn btn-primary btn-sm">
                  <Plus className="w-4 h-4" />
                  Add First Item
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentItems.map((item) => (
                  <Link
                    key={item.id}
                    to={`/items/${item.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[var(--color-bg-tertiary)] flex items-center justify-center flex-shrink-0">
                      <Package className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate group-hover:text-indigo-400 transition-colors">{item.name}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{item.category || 'Uncategorized'}</p>
                    </div>
                    <span className={`badge badge-${item.condition.toLowerCase()} text-xs`}>
                      {item.condition}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Reminders */}
        <div className="card animate-fade-in-up" style={{ animationDelay: '250ms' }}>
          <div className="card-header">
            <h2 className="text-lg font-semibold">Upcoming Reminders</h2>
            <Link to="/reminders" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="card-body">
            {stats.upcomingReminders.length === 0 ? (
              <div className="py-8 text-center">
                <Clock className="w-12 h-12 mx-auto mb-3 text-[var(--color-text-muted)] opacity-50" />
                <p className="text-[var(--color-text-secondary)]">All caught up!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {stats.upcomingReminders.slice(0, 5).map((reminder) => {
                  const item = db.getItemById(reminder.item_id);
                  const overdue = isOverdue(reminder.due_date);

                  return (
                    <div
                      key={reminder.id}
                      className="flex items-center gap-3 p-3 rounded-lg"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        overdue ? 'bg-red-500/10' : 'bg-amber-500/10'
                      }`}>
                        <AlertCircle className={`w-4 h-4 ${overdue ? 'text-red-400' : 'text-amber-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{reminder.message || reminder.type}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{item?.name || 'Unknown'}</p>
                      </div>
                      <span className={`text-xs ${overdue ? 'text-red-400' : 'text-[var(--color-text-secondary)]'}`}>
                        {formatDate(reminder.due_date)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Condition Overview */}
      <div className="card animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        <div className="card-header">
          <h2 className="text-lg font-semibold">Items by Condition</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {['Excellent', 'Good', 'Fair', 'Poor', 'Damaged'].map((condition) => {
              const count = stats.itemsByCondition[condition] || 0;
              const total = stats.totalItems || 1;
              const percentage = Math.round((count / total) * 100);
              const colors: Record<string, string> = {
                Excellent: '#22c55e',
                Good: '#84cc16',
                Fair: '#eab308',
                Poor: '#f97316',
                Damaged: '#ef4444'
              };

              return (
                <div
                  key={condition}
                  className="p-3 rounded-lg bg-[var(--color-bg-tertiary)]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`badge badge-${condition.toLowerCase()} text-xs`}>{condition}</span>
                    <span className="text-sm font-semibold">{count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--color-bg-secondary)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${percentage}%`,
                        background: colors[condition]
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card animate-fade-in-up" style={{ animationDelay: '350ms' }}>
        <div className="card-header">
          <h2 className="text-lg font-semibold">Quick Actions</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { to: '/items/new', icon: Plus, label: 'Add Item', color: 'from-indigo-500 to-purple-500' },
              { to: '/items', icon: Search, label: 'Search', color: 'from-emerald-500 to-teal-500' },
              { to: '/reports', icon: BarChart3, label: 'Reports', color: 'from-amber-500 to-orange-500' },
              { to: '/reminders', icon: Calendar, label: 'Reminders', color: 'from-pink-500 to-rose-500' },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.to}
                  to={action.to}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-card-hover)] transition-colors"
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-medium">{action.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* AI Search Tip */}
      <div className="card bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-indigo-500/20 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
        <div className="card-body flex flex-col sm:flex-row items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="font-semibold mb-1">Try AI-Powered Search</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
              "Show me all electronics in the garage that are in good condition"
            </p>
          </div>
          <Link to="/items" className="btn btn-primary flex-shrink-0">
            Try Now
          </Link>
        </div>
      </div>
    </div>
  );
}
