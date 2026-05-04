"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Users, Store, IndianRupee, Megaphone, Wallet, TrendingUp } from 'lucide-react';
import { cn } from '../../../utils/cn';

/**
 * Animated Stat Item
 */
const StatItem = ({ title, value, icon: Icon, color, index, suffix = "" }) => {
  // Mapping standard colors to Tailwind classes
  const colorMap = {
    blue: "bg-blue-50 text-blue-600 border-blue-100/50 glow-blue-500/20",
    orange: "bg-orange-50 text-orange-600 border-orange-100/50 glow-orange-500/20",
    rose: "bg-rose-50 text-rose-600 border-rose-100/50 glow-rose-500/20",
    yellow: "bg-yellow-50 text-yellow-600 border-yellow-100/50 glow-yellow-500/20",
    green: "bg-green-50 text-green-600 border-green-100/50 glow-green-500/20",
  };

  const style = colorMap[color] || colorMap.blue;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: "easeOut" }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className="glass-card rounded-3xl p-8 flex items-center gap-6 relative overflow-hidden group cursor-default"
    >
       {/* Background Glow Effect */}
       <div className={cn(
         "absolute -top-10 -right-10 w-32 h-32 blur-[60px] opacity-0 transition-opacity duration-700 group-hover:opacity-40",
         color === 'blue' && "bg-blue-400",
         color === 'orange' && "bg-orange-400",
         color === 'rose' && "bg-rose-400",
         color === 'yellow' && "bg-yellow-400",
         color === 'green' && "bg-green-400"
       )} />

       {/* Icon Hexagon/Box */}
       <div className={cn(
         "w-16 h-16 rounded-[22px] flex items-center justify-center transition-all duration-500 group-hover:rotate-6 group-hover:scale-110 border shadow-sm",
         style
       )}>
         <Icon size={30} strokeWidth={2.2} />
       </div>

       {/* Label & Value */}
       <div className="flex flex-col z-10">
         <div className="flex items-center gap-2 mb-1.5">
           <span className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em] leading-none">{title}</span>
           <TrendingUp size={10} className="text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
         </div>
         <h3 className="text-2xl font-black text-zinc-900 tracking-tight leading-none">
            {typeof value === 'number' ? value.toLocaleString() : value}
            {suffix}
         </h3>
       </div>
    </motion.div>
  );
};

/**
 * Dashboard Statistics Grid
 */
export default function DashboardStats({ stats }) {
  const cards = [
    { title: "Users", value: stats.totalUsers || 0, icon: Users, color: "blue" },
    { title: "Vendors", value: stats.totalVendors || 0, icon: Store, color: "orange" },
    { title: "Live Ads", value: stats.activeAds || 0, icon: Megaphone, color: "rose" },
    { title: "Circulation", value: stats.totalCoins || 0, icon: Wallet, color: "yellow" },
    { title: "Revenue", value: `₹${(stats.totalRevenue || 0).toLocaleString()}`, icon: IndianRupee, color: "green" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
      {cards.map((card, i) => (
        <StatItem key={card.title} {...card} index={i} />
      ))}
    </div>
  );
}
