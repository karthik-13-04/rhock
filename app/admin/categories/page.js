"use client";

import React, { useState, useEffect } from 'react';
import { useAdminStore } from "@/store/useAdminStore";
import { categoryService } from "@/services/admin/category.service";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layers, 
  Plus, 
  Search, 
  MoreHorizontal, 
  CheckCircle2, 
  XCircle,
  Loader2,
  Trash2,
  Edit2,
  Filter
} from 'lucide-react';
import { cn } from '../../../utils/cn';

/**
 * Admin Categories Management Page
 * Handles visualization and logic for business categories.
 */
export default function CategoriesPage() {
  const { categories, setCategories, isLoading, setLoading, setError } = useAdminStore();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch categories from the backend
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const data = await categoryService.getCategories();
        setCategories(data.categories || []);
      } catch (error) {
        console.error('Failed to sync categories:', error);
        setError(error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Filter logic
  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-10 pb-20">
      {/* 1. Futuristic Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8">
        <div>
          <h1 className="text-4xl font-black text-zinc-900 tracking-tighter mb-2">
            Category <span className="text-admin-primary">Taxonomy</span>
          </h1>
          <p className="text-zinc-500 font-bold text-sm bg-zinc-100/50 px-4 py-1.5 rounded-full inline-block">
            {categories.length} System Defined Categories
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
          <div className="relative w-full sm:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-admin-primary transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search categories..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-white border border-zinc-200 rounded-2xl text-sm font-bold focus:ring-4 ring-admin-primary/10 outline-none transition-all"
            />
          </div>
          <button className="flex items-center justify-center gap-3 px-6 py-4 bg-zinc-900 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-admin-primary transition-all w-full sm:w-auto">
            <Plus size={20} />
            New Category
          </button>
        </div>
      </div>

      {/* 2. Grid of Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading && categories.length === 0 ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-48 bg-zinc-100 animate-pulse rounded-[32px]" />
          ))
        ) : (
          <AnimatePresence>
            {filteredCategories.map((category, i) => (
              <motion.div
                key={category._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card rounded-[32px] p-8 border-white/60 hover:shadow-2xl transition-all group overflow-hidden relative"
              >
                {/* Decorative background circle */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-admin-primary-soft/30 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />

                <div className="flex flex-col items-center text-center space-y-4 relative z-10">
                   <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center text-white shadow-xl shadow-zinc-900/20 group-hover:rotate-6 transition-transform">
                     {category.iconUrl ? (
                        <img src={category.iconUrl} alt="" className="w-10 h-10 object-contain" />
                     ) : (
                        <Layers size={32} />
                     )}
                   </div>
                   
                   <div>
                     <h3 className="font-black text-xl text-zinc-900 tracking-tight">{category.name}</h3>
                     <span className={cn(
                       "mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                       category.isActive ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"
                     )}>
                       {category.isActive ? "Active" : "Disabled"}
                     </span>
                   </div>

                   <div className="flex items-center gap-2 pt-4 w-full">
                      <button className="flex-1 p-3 rounded-xl bg-zinc-50 text-zinc-400 hover:text-admin-primary hover:bg-admin-primary-soft transition-all">
                        <Edit2 size={16} className="mx-auto" />
                      </button>
                      <button className="flex-1 p-3 rounded-xl bg-zinc-50 text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-all">
                        <Trash2 size={16} className="mx-auto" />
                      </button>
                   </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {!isLoading && filteredCategories.length === 0 && (
        <div className="text-center py-20">
           <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-6">
             <Filter size={32} className="text-zinc-300" />
           </div>
           <h3 className="text-xl font-black text-zinc-900">No categories found</h3>
           <p className="text-zinc-500 font-bold mt-2">Try adjusting your search query</p>
        </div>
      )}
    </div>
  );
}
