"use client";

import React, { useState, useEffect } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar 
} from 'recharts';
import { motion } from 'framer-motion';

/**
 * Mock data for the analytical charts
 * In a real production app, this would be fetched from an analytics API
 */
const data = [
  { name: 'Mon', revenue: 4200, users: 45 },
  { name: 'Tue', revenue: 5100, users: 52 },
  { name: 'Wed', revenue: 3800, users: 38 },
  { name: 'Thu', revenue: 6200, users: 85 },
  { name: 'Fri', revenue: 7800, users: 92 },
  { name: 'Sat', revenue: 5600, users: 66 },
  { name: 'Sun', revenue: 8400, users: 110 },
];

/**
 * Dashboard Analytical Charts
 * Visualizes business growth and user engagement
 */
export default function DashboardCharts() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 my-10">
        <div className="h-[450px] bg-zinc-50 animate-pulse rounded-[40px]" />
        <div className="h-[450px] bg-zinc-50 animate-pulse rounded-[40px]" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 my-10">
      {/* Revenue Evolution - Area Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="glass-card rounded-[40px] p-10 relative group border-white/50"
      >
        <div className="flex items-center justify-between mb-10">
          <div>
            <h3 className="text-xl font-black text-zinc-900 tracking-tight">Revenue Trends</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-1">Weekly Performance Analysis</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-admin-primary shadow-[0_0_10px_rgba(26,92,168,0.4)]" />
            <span className="text-[10px] font-black uppercase text-zinc-500">Gross Sales</span>
          </div>
        </div>

        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1A5CA8" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#1A5CA8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(0,0,0,0.03)" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#a1a1aa', fontSize: 11, fontWeight: 700}} 
                dy={15}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#a1a1aa', fontSize: 11, fontWeight: 700}} 
                dx={-10}
              />
              <Tooltip 
                cursor={{ stroke: '#1A5CA8', strokeWidth: 1, strokeDasharray: '4 4' }}
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                  borderRadius: '24px', 
                  border: '1px solid rgba(26,92,168,0.1)', 
                  boxShadow: '0 20px 40px rgba(0,0,0,0.1)', 
                  backdropFilter: 'blur(12px)',
                  padding: '16px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#1A5CA8" 
                strokeWidth={4} 
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
                animationDuration={2000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* User Growth - Bar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="glass-card rounded-[40px] p-10 relative group border-white/50"
      >
        <div className="flex items-center justify-between mb-10">
          <div>
            <h3 className="text-xl font-black text-zinc-900 tracking-tight">Active Reach</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-1">User Acquisition Funnel</p>
          </div>
          <select className="text-[10px] font-black uppercase text-admin-primary bg-admin-primary-soft px-4 py-2 rounded-xl outline-none cursor-pointer hover:bg-admin-primary hover:text-white transition-all">
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
          </select>
        </div>

        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={data}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(0,0,0,0.03)" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#a1a1aa', fontSize: 11, fontWeight: 700}} 
                dy={15}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#a1a1aa', fontSize: 11, fontWeight: 700}} 
                dx={-10}
              />
              <Tooltip 
                cursor={{fill: 'rgba(26, 92, 168, 0.05)', radius: [16, 16, 0, 0]}}
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                  borderRadius: '24px', 
                  border: '1px solid rgba(26,92,168,0.1)', 
                  boxShadow: '0 20px 40px rgba(0,0,0,0.1)', 
                  backdropFilter: 'blur(12px)',
                  padding: '16px'
                }}
              />
              <Bar 
                dataKey="users" 
                fill="#1A5CA8" 
                radius={[12, 12, 0, 0]} 
                barSize={32}
                animationDuration={2000}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
