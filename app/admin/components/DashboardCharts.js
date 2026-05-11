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
import { useAdminStore } from "../../../store/useAdminStore";
import { dashboardService } from "../../../services/admin/dashboard.service";
import { Loader2, TrendingUp, Activity } from "lucide-react";

/**
 * Dashboard Analytical Charts
 * Visualizes business growth and user engagement with real-time data.
 */
export default function DashboardCharts() {
  const { analyticsData, setAnalyticsData } = useAdminStore();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fetchAnalytics = async () => {
      if (analyticsData.length > 0) return;
      try {
        setLoading(true);
        const res = await dashboardService.getAnalytics();
        if (res.success) {
          setAnalyticsData(res.data);
        }
      } catch (error) {
        console.error("Failed to load analytics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (!mounted || loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 my-10">
        <div className="h-[450px] bg-zinc-50/50 animate-pulse rounded-[40px] flex items-center justify-center border border-zinc-100">
           <Loader2 className="w-8 h-8 text-zinc-200 animate-spin" />
        </div>
        <div className="h-[450px] bg-zinc-50/50 animate-pulse rounded-[40px] flex items-center justify-center border border-zinc-100">
           <Loader2 className="w-8 h-8 text-zinc-200 animate-spin" />
        </div>
      </div>
    );
  }

  const chartData = analyticsData.length > 0 ? analyticsData : [
    { name: 'Mon', revenue: 0, users: 0 },
    { name: 'Tue', revenue: 0, users: 0 },
    { name: 'Wed', revenue: 0, users: 0 },
    { name: 'Thu', revenue: 0, users: 0 },
    { name: 'Fri', revenue: 0, users: 0 },
    { name: 'Sat', revenue: 0, users: 0 },
    { name: 'Sun', revenue: 0, users: 0 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 my-10">
      {/* Revenue Evolution - Area Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="glass-card rounded-[40px] p-10 relative group border-white/50 bg-white shadow-xl shadow-zinc-100/40"
      >
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="flex items-center gap-3 mb-1">
               <div className="p-2 bg-admin-primary/10 rounded-xl text-admin-primary">
                  <TrendingUp size={14} />
               </div>
               <h3 className="text-xl font-black text-zinc-900 tracking-tight">Revenue Trends</h3>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-1">Weekly Performance Analysis</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-admin-primary shadow-[0_0_10px_rgba(26,92,168,0.4)]" />
            <span className="text-[10px] font-black uppercase text-zinc-500">Gross Sales</span>
          </div>
        </div>

        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <AreaChart data={chartData}>
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
        className="glass-card rounded-[40px] p-10 relative group border-white/50 bg-white shadow-xl shadow-zinc-100/40"
      >
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="flex items-center gap-3 mb-1">
               <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
                  <Activity size={14} />
               </div>
               <h3 className="text-xl font-black text-zinc-900 tracking-tight">Active Reach</h3>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-1">User Acquisition Funnel</p>
          </div>
          <div className="text-[10px] font-black uppercase text-admin-primary bg-admin-primary/5 px-4 py-2 rounded-xl">
            Last 7 Days
          </div>
        </div>

        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={chartData}>
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
