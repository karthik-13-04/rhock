"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAdminStore } from "@/store/useAdminStore";
import { vendorService } from "@/services/admin/vendor.service";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Store, 
  Mail, 
  Phone, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck, 
  Loader2,
  MapPin,
  ExternalLink,
  Info
} from 'lucide-react';
import { cn } from '../../../utils/cn';

/**
 * Tab definitions for filtering vendors by their registration status
 */
const TABS = [
  { id: 'all', label: 'Complete Ecosystem' },
  { id: 'pending', label: 'Pending Audit' },
  { id: 'active', label: 'Verified Active' },
  { id: 'rejected', label: 'Restricted' },
];

/**
 * Fully Dynamic Vendor Management Module
 * Integrated with real-time APIs for listing, searching, and administrative control.
 */
export default function VendorsPage() {
  // State Management
  const { vendors, setVendors, isLoading, setLoading, setError, updateVendorStatus } = useAdminStore();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  /**
   * Fetch vendors from the dynamic backend API
   */
  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {
        status: activeTab === 'all' ? undefined : activeTab,
        search: searchQuery,
        page: pagination.page,
        limit: pagination.limit
      };
      const data = await vendorService.getVendors(filters);
      
      setVendors(data.vendors || []);
      setPagination({
        page: data.page,
        limit: pagination.limit,
        total: data.total,
        pages: data.totalPages
      });
    } catch (error) {
      console.error('Failed to sync vendors:', error);
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery, pagination.page, pagination.limit]);

  // Initial fetch and dependency-based refresh
  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  /**
   * Handle Approval or Rejection
   */
  const handleReview = async (id, status) => {
    setProcessingId(id);
    try {
      if (status === 'active') {
        await vendorService.approveVendor(id);
      } else if (status === 'rejected') {
        await vendorService.rejectVendor(id, "Admin moderation");
      }
      
      // Optimistic update
      updateVendorStatus(id, status);
      setSelectedVendor(null);
      // Optional: Refetch to be sure
      // fetchVendors();
    } catch (error) {
      alert(error || 'Failed to update vendor status');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-10 pb-20">
      {/* 1. Futuristic Header Section */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8">
        <div>
          <h1 className="text-4xl font-black text-zinc-900 tracking-tighter mb-2">
            Vendor <span className="text-admin-primary">Intelligence</span>
          </h1>
          <div className="flex items-center gap-3">
            <p className="text-zinc-500 font-bold text-sm bg-zinc-100/50 px-4 py-1.5 rounded-full">
              Managing {pagination.total} registered businesses
            </p>
          </div>
        </div>
        
        {/* Search & Actions Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
          <div className="relative w-full sm:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-admin-primary transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search by store or owner..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-white/70 backdrop-blur-xl border border-zinc-200 rounded-2xl text-sm font-bold focus:ring-4 ring-admin-primary/10 outline-none transition-all shadow-sm"
            />
          </div>
          <button className="flex items-center justify-center gap-3 px-6 py-4 bg-zinc-900 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-admin-primary hover:shadow-xl hover:shadow-admin-primary/20 transition-all w-full sm:w-auto">
            Export Audit
          </button>
        </div>
      </div>

      {/* 2. Glassmorphic Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-3 bg-zinc-50/50 p-2 rounded-[28px] border border-zinc-100">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setPagination(p => ({...p, page: 1})); }}
            className={cn(
              "px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300",
              activeTab === tab.id 
                ? "bg-white text-admin-primary shadow-xl shadow-zinc-200/50 scale-105" 
                : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/50"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. Main Vendors Dynamic Table */}
      <div className="glass-card rounded-[40px] border-white/60 overflow-hidden shadow-2xl relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-sm z-10 flex items-center justify-center">
            <Loader2 className="text-admin-primary animate-spin" size={40} />
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Business Hub</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Governance Status</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Economic Profile</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 text-right">Administrative</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              <AnimatePresence mode="popLayout">
                {vendors.map((vendor, i) => (
                  <motion.tr 
                    key={vendor._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group hover:bg-zinc-50 transition-colors"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400 group-hover:bg-admin-primary-soft group-hover:text-admin-primary transition-all shadow-sm">
                          {vendor.media?.thumbnailUrl ? (
                            <img src={vendor.media.thumbnailUrl} alt="" className="w-full h-full object-cover rounded-2xl" />
                          ) : (
                            <Store size={26} />
                          )}
                        </div>
                        <div>
                          <p className="font-black text-zinc-900 leading-tight mb-1">{vendor.storeName || 'Unnamed Business'}</p>
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                            <MapPin size={10} />
                            {vendor.location?.district} / {vendor.location?.state}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-2">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border",
                          vendor.status === 'active' ? "bg-green-50 text-green-700 border-green-100" :
                          vendor.status === 'pending_approval' ? "bg-orange-50 text-orange-700 border-orange-100" :
                          vendor.status === 'rejected' ? "bg-red-50 text-red-700 border-red-100" :
                          "bg-zinc-100 text-zinc-500 border-zinc-200"
                        )}>
                          <ShieldCheck size={12} />
                          {vendor.status.replace('_', ' ')}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-zinc-400">STEP {vendor.registrationStep}/3</span>
                          <div className="w-12 h-1 bg-zinc-100 rounded-full overflow-hidden">
                            <div className="bg-admin-primary h-full" style={{ width: `${(vendor.registrationStep/3)*100}%` }} />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <p className="text-sm font-black text-zinc-800">₹{(vendor.coinBalance || 0).toLocaleString()}</p>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-tighter">Coin Portfolio</p>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => setSelectedVendor(vendor)}
                        className="p-3.5 rounded-2xl bg-zinc-50 text-zinc-500 hover:text-admin-primary hover:bg-admin-primary-soft hover:shadow-lg transition-all"
                      >
                        <Eye size={22} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Dynamic Pagination */}
        <div className="px-10 py-8 bg-zinc-50/50 flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">
            Showing {vendors.length} of {pagination.total} Entities
          </p>
          <div className="flex items-center gap-3">
            <button 
              disabled={pagination.page <= 1}
              onClick={() => setPagination(p => ({...p, page: p.page - 1}))}
              className="p-3 rounded-xl bg-white border border-zinc-100 text-zinc-400 hover:text-admin-primary disabled:opacity-30 transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              <span className="w-10 h-10 rounded-xl bg-admin-primary text-white flex items-center justify-center font-black text-xs shadow-lg shadow-admin-primary/20">
                {pagination.page}
              </span>
              <span className="text-zinc-400 font-black text-xs mx-2">OF</span>
              <span className="w-10 h-10 rounded-xl bg-white border border-zinc-100 text-zinc-500 flex items-center justify-center font-black text-xs">
                {pagination.pages}
              </span>
            </div>
            <button 
              disabled={pagination.page >= pagination.pages}
              onClick={() => setPagination(p => ({...p, page: p.page + 1}))}
              className="p-3 rounded-xl bg-white border border-zinc-100 text-zinc-400 hover:text-admin-primary disabled:opacity-30 transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Vendor Audit & Review Modal */}
      <AnimatePresence>
        {selectedVendor && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedVendor(null)}
              className="absolute inset-0 bg-zinc-900/40 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[48px] shadow-2xl overflow-hidden glass-card border-none"
            >
              <div className="relative h-48 bg-zinc-900 overflow-hidden">
                {selectedVendor.media?.bannerUrl && (
                  <img src={selectedVendor.media.bannerUrl} alt="" className="w-full h-full object-cover opacity-50" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
                <button 
                  onClick={() => setSelectedVendor(null)}
                  className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white hover:text-zinc-900 transition-all flex items-center justify-center"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="px-12 pb-12 -mt-16 relative">
                 <div className="flex flex-col md:flex-row items-end gap-8 mb-10">
                    <div className="w-32 h-32 rounded-[40px] bg-white p-2 shadow-2xl ring-8 ring-white">
                      <div className="w-full h-full rounded-[32px] bg-zinc-50 flex items-center justify-center overflow-hidden">
                        {selectedVendor.media?.thumbnailUrl ? (
                          <img src={selectedVendor.media.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Store size={40} className="text-zinc-300" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 pb-4">
                       <h2 className="text-3xl font-black text-zinc-900 tracking-tighter mb-1">{selectedVendor.storeName}</h2>
                       <p className="text-admin-primary font-black uppercase tracking-[0.2em] text-xs">Vendor Audit #ID-{selectedVendor._id.slice(-6)}</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-8">
                       <section>
                          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-4 inline-flex items-center gap-2">
                             <Info size={12} /> Contact Intelligence
                          </h4>
                          <div className="space-y-3">
                             <div className="flex items-center gap-4 bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                                <Mail size={18} className="text-zinc-400" />
                                <span className="text-sm font-bold text-zinc-700">{selectedVendor.email}</span>
                             </div>
                             <div className="flex items-center gap-4 bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                                <Phone size={18} className="text-zinc-400" />
                                <span className="text-sm font-bold text-zinc-700">{selectedVendor.mobileNumber}</span>
                             </div>
                          </div>
                       </section>

                       <section>
                          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-4 inline-flex items-center gap-2">
                             <MapPin size={12} /> Localization
                          </h4>
                          <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100">
                             <p className="text-sm font-bold text-zinc-700 leading-relaxed italic">
                                "{selectedVendor.fullAddress || 'Address not provided'}"
                             </p>
                          </div>
                       </section>
                    </div>

                    <div className="space-y-8">
                       <section>
                          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-4">Ownership DNA</h4>
                          <div className="flex items-center gap-4 p-5 rounded-3xl bg-zinc-900 text-white shadow-xl shadow-zinc-200">
                             <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                                <ShieldCheck size={24} />
                             </div>
                             <div>
                                <p className="text-sm font-black">{selectedVendor.fullName}</p>
                                <p className="text-[9px] uppercase tracking-widest text-zinc-400 font-black">Authorized Signatory</p>
                             </div>
                          </div>
                       </section>

                       {/* Action Controls */}
                       <div className="pt-6 flex flex-col gap-4">
                          {selectedVendor.status === 'pending_approval' && (
                            <div className="flex gap-4">
                               <button 
                                 disabled={!!processingId}
                                 onClick={() => handleReview(selectedVendor._id, 'active')}
                                 className="flex-1 py-5 bg-green-500 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-green-200 hover:bg-green-600 transition-all flex items-center justify-center gap-3"
                               >
                                  {processingId ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                                  Approve Entity
                               </button>
                               <button 
                                 disabled={!!processingId}
                                 onClick={() => handleReview(selectedVendor._id, 'rejected')}
                                 className="flex-1 py-5 bg-white border-2 border-red-100 text-red-500 rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:bg-red-50 transition-all flex items-center justify-center gap-3"
                               >
                                  {processingId ? <Loader2 className="animate-spin" size={20} /> : <XCircle size={20} />}
                                  Restrict Access
                               </button>
                            </div>
                          )}
                          <button className="w-full py-5 bg-zinc-100 text-zinc-500 rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:bg-zinc-200 transition-all flex items-center justify-center gap-3">
                             <ExternalLink size={20} />
                             View System Profile
                          </button>
                       </div>
                    </div>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
