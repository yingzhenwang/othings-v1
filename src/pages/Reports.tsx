import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useStats } from '../hooks/useDatabase';
import { formatCurrency, getConditionColor } from '../utils';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

export function Reports() {
  const { stats } = useStats();

  const conditionData = Object.entries(stats.itemsByCondition).map(([name, value]) => ({
    name,
    value,
  }));

  const categoryData = Object.entries(stats.itemsByCategory).map(([name, value]) => ({
    name: name || 'Uncategorized',
    value,
  }));

  const locationData = Object.entries(stats.itemsByLocation)
    .slice(0, 8)
    .map(([name, value]) => ({
      name: name.length > 15 ? name.slice(0, 15) + '...' : name,
      value,
    }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Reports</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">Statistics and insights</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-sm text-[var(--color-text-muted)]">Total Items</p>
          <p className="text-2xl font-bold">{stats.totalItems}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-[var(--color-text-muted)]">Total Value</p>
          <p className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-[var(--color-text-muted)]">Categories</p>
          <p className="text-2xl font-bold">{Object.keys(stats.itemsByCategory).length}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-[var(--color-text-muted)]">Locations</p>
          <p className="text-2xl font-bold">{Object.keys(stats.itemsByLocation).length}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Condition Chart */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Items by Condition</h2>
          </div>
          <div className="card-body">
            {conditionData.length === 0 ? (
              <p className="text-center text-[var(--color-text-muted)] py-8">No data</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={conditionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {conditionData.map((entry, index) => (
                      <Cell key={entry.name} fill={getConditionColor(entry.name as any)} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              {conditionData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ background: getConditionColor(item.name as any) }} />
                  <span className="text-sm">{item.name} ({item.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category Chart */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Items by Category</h2>
          </div>
          <div className="card-body">
            {categoryData.length === 0 ? (
              <p className="text-center text-[var(--color-text-muted)] py-8">No data</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="flex flex-wrap justify-center gap-2 mt-4 max-h-20 overflow-auto">
              {categoryData.slice(0, 6).map((item, index) => (
                <div key={item.name} className="flex items-center gap-1 text-xs">
                  <span className="w-2 h-2 rounded-full" style={{ background: COLORS[index % COLORS.length] }} />
                  <span className="truncate max-w-[80px]">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Location Chart */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold">Items by Location</h2>
        </div>
        <div className="card-body">
          {locationData.length === 0 ? (
            <p className="text-center text-[var(--color-text-muted)] py-8">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={locationData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Table */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Category Details</h2>
          </div>
          <div className="card-body p-0">
            <table className="table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th className="text-right">Items</th>
                </tr>
              </thead>
              <tbody>
                {categoryData
                  .sort((a, b) => b.value - a.value)
                  .map((cat, index) => (
                    <tr key={cat.name}>
                      <td className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: COLORS[index % COLORS.length] }} />
                        {cat.name}
                      </td>
                      <td className="text-right">{cat.value}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Condition Table */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Condition Details</h2>
          </div>
          <div className="card-body p-0">
            <table className="table">
              <thead>
                <tr>
                  <th>Condition</th>
                  <th className="text-right">Items</th>
                </tr>
              </thead>
              <tbody>
                {['Excellent', 'Good', 'Fair', 'Poor', 'Damaged'].map((condition) => {
                  const count = stats.itemsByCondition[condition] || 0;
                  return (
                    <tr key={condition}>
                      <td className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: getConditionColor(condition as any) }} />
                        {condition}
                      </td>
                      <td className="text-right">{count}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
