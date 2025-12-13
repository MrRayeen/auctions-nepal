"use client";

import React, { useEffect, useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";
import {
  LogOut,
  Trash2,
  Eye,
  Clock,
  DollarSign,
  Users,
  BarChart3,
  AlertCircle,
  Loader,
  Check,
  X,
  Shield,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Auction {
  id: number;
  title: string;
  description: string;
  currentPrice: number;
  startingPrice: number;
  minIncrement: number;
  imageUrl: string;
  endTime: string;
  status: string;
  sellerId: number;
  seller: {
    id: number;
    name: string;
    email: string;
  };
  bids: Array<{
    id: number;
    amount: number;
  }>;
}

interface KYCSubmission {
  id: string;
  email: string;
  name: string;
  kycStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  currentAddress: string;
  permanentAddress: string;
  citizenshipFront: string;
  citizenshipBack: string;
  selfieWithCitizenship: string;
  kycSubmittedAt: string;
  kycVerifiedAt: string | null;
  kycRejectionReason: string | null;
}

export default function AdminDashboard() {
  const { logout } = useAdminAuth();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'auctions' | 'kyc' | 'reports'>('auctions');
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [kycSubmissions, setKycSubmissions] = useState<KYCSubmission[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [expandedKyc, setExpandedKyc] = useState<string | null>(null);
  const [processingKyc, setProcessingKyc] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    if (activeTab === 'auctions') {
      await fetchAuctions();
    } else if (activeTab === 'kyc') {
      await fetchKycSubmissions();
    } else if (activeTab === 'reports') {
      await fetchReports();
    }
    setIsLoading(false);
  };

  const fetchAuctions = async () => {
    try {
      const response = await fetch("/api/auctions");
      const data = await response.json();
      setAuctions(data.auctions || []);
    } catch (error) {
      addToast("Failed to fetch auctions", "error");
      setAuctions([]);
    }
  };

  const fetchKycSubmissions = async () => {
    try {
      const token = localStorage.getItem('adminToken') || '';
      const response = await fetch("/api/kyc/admin", {
        headers: {
          'x-admin-token': token,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setKycSubmissions(data);
      } else {
        throw new Error('Failed to fetch KYC submissions');
      }
    } catch (error) {
      addToast("Failed to fetch KYC submissions", "error");
      setKycSubmissions([]);
    }
  };

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('adminToken') || '';
      const response = await fetch("/api/reports", {
        headers: {
          'x-admin-token': token,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      } else {
        throw new Error('Failed to fetch reports');
      }
    } catch (error) {
      addToast("Failed to fetch reports", "error");
      setReports([]);
    }
  };

  const updateReportStatus = async (reportId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem('adminToken') || '';
      const response = await fetch("/api/reports", {
        method: "PATCH",
        headers: {
          'x-admin-token': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportId,
          status: newStatus,
        }),
      });
      if (response.ok) {
        setReports(reports.map(r => r.id === reportId ? { ...r, status: newStatus } : r));
        addToast('Report status updated', 'success');
      } else {
        throw new Error('Failed to update report status');
      }
    } catch (error) {
      addToast("Failed to update report status", "error");
    }
  };

  const handleDeleteAuction = async (auctionId: number) => {
    setDeletingId(auctionId);
    try {
      const response = await fetch(`/api/auctions/${auctionId}`, {
        method: "DELETE",
        headers: {
          "x-admin-token": "admin-secret-key",
        },
      });

      if (response.ok) {
        const result = await response.json();
        setAuctions((prev) => prev.filter((a) => a.id !== auctionId));
        addToast(result.message, "success");
      } else {
        const error = await response.json();
        addToast(error.error || "Failed to delete auction", "error");
      }
    } catch (error) {
      addToast("Error deleting auction", "error");
    } finally {
      setDeletingId(null);
      setDeleteConfirm(null);
    }
  };

  const handleKycApprove = async (userId: string) => {
    setProcessingKyc(userId);
    try {
      const token = localStorage.getItem('adminToken') || '';
      const response = await fetch('/api/kyc/admin', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
        body: JSON.stringify({ userId, action: 'VERIFY' }),
      });

      if (response.ok) {
        setKycSubmissions(
          kycSubmissions.map((sub) =>
            sub.id === userId
              ? { ...sub, kycStatus: 'VERIFIED', kycVerifiedAt: new Date().toISOString() }
              : sub
          )
        );
        setExpandedKyc(null);
        addToast('KYC approved successfully', 'success');
      } else {
        throw new Error('Failed to approve KYC');
      }
    } catch (error) {
      addToast('Failed to approve KYC', 'error');
    } finally {
      setProcessingKyc(null);
    }
  };

  const handleKycReject = async (userId: string) => {
    if (!rejectReason.trim()) {
      addToast('Please provide a rejection reason', 'error');
      return;
    }

    setProcessingKyc(userId);
    try {
      const token = localStorage.getItem('adminToken') || '';
      const response = await fetch('/api/kyc/admin', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
        body: JSON.stringify({ userId, action: 'REJECT', rejectionReason: rejectReason }),
      });

      if (response.ok) {
        setKycSubmissions(
          kycSubmissions.map((sub) =>
            sub.id === userId
              ? { ...sub, kycStatus: 'REJECTED', kycRejectionReason: rejectReason }
              : sub
          )
        );
        setRejectReason('');
        setExpandedKyc(null);
        addToast('KYC rejected successfully', 'success');
      } else {
        throw new Error('Failed to reject KYC');
      }
    } catch (error) {
      addToast('Failed to reject KYC', 'error');
    } finally {
      setProcessingKyc(null);
    }
  };

  const totalAuctions = auctions.length;
  const totalBids = auctions.reduce((sum, a) => sum + a.bids.length, 0);
  const activeAuctions = auctions.filter(
    (a) => new Date(a.endTime) > new Date()
  ).length;
  const totalValue = auctions.reduce((sum, a) => sum + a.currentPrice, 0);
  const pendingKycCount = kycSubmissions.filter((k) => k.kycStatus === 'PENDING').length;

  return (
    <main className="min-h-screen pb-20 relative overflow-x-hidden pt-20">
      {/* Gradient background */}
      <div className="fixed inset-0 bg-linear-to-br from-nepal-accent/20 via-transparent to-purple-900/20 pointer-events-none z-0" />
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none z-0" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-400">Manage auctions and user verifications</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 glass-button px-6 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b border-white/10">
          <button
            onClick={() => setActiveTab('auctions')}
            className={`px-6 py-3 font-bold transition-all ${
              activeTab === 'auctions'
                ? 'text-nepal-accent border-b-2 border-nepal-accent'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📦 Auctions
          </button>
          <button
            onClick={() => setActiveTab('kyc')}
            className={`px-6 py-3 font-bold transition-all relative ${
              activeTab === 'kyc'
                ? 'text-nepal-accent border-b-2 border-nepal-accent'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🛡️ KYC Verification
            {pendingKycCount > 0 && (
              <span className="absolute top-1 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                {pendingKycCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-6 py-3 font-bold transition-all relative ${
              activeTab === 'reports'
                ? 'text-nepal-accent border-b-2 border-nepal-accent'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🚨 Reports
            {reports.filter(r => r.status === 'PENDING').length > 0 && (
              <span className="absolute top-1 right-0 bg-orange-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                {reports.filter(r => r.status === 'PENDING').length}
              </span>
            )}
          </button>
        </div>

        {/* Stats Grid */}
        {activeTab === 'auctions' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
            <div className="glass-panel p-6 rounded-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-2">Total Auctions</p>
                  <p className="text-3xl font-bold text-white">{totalAuctions}</p>
                </div>
                <BarChart3 size={24} className="text-nepal-accent" />
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-2">Active Auctions</p>
                  <p className="text-3xl font-bold text-white">{activeAuctions}</p>
                </div>
                <Clock size={24} className="text-green-400" />
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-2">Total Bids</p>
                  <p className="text-3xl font-bold text-white">{totalBids}</p>
                </div>
                <Users size={24} className="text-blue-400" />
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-2">Total Value</p>
                  <p className="text-3xl font-bold text-nepal-accent">
                    Rs. {totalValue.toLocaleString("en-IN")}
                  </p>
                </div>
                <DollarSign size={24} className="text-yellow-400" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'kyc' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            <div className="glass-panel p-6 rounded-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-2">Pending</p>
                  <p className="text-3xl font-bold text-yellow-400">{pendingKycCount}</p>
                </div>
                <Clock size={24} className="text-yellow-400" />
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-2">Verified</p>
                  <p className="text-3xl font-bold text-green-400">{kycSubmissions.filter(k => k.kycStatus === 'VERIFIED').length}</p>
                </div>
                <Check size={24} className="text-green-400" />
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-2">Rejected</p>
                  <p className="text-3xl font-bold text-red-400">{kycSubmissions.filter(k => k.kycStatus === 'REJECTED').length}</p>
                </div>
                <X size={24} className="text-red-400" />
              </div>
            </div>
          </div>
        )}

        {/* Content Section - Auctions */}
        {activeTab === 'auctions' && (
          <div className="glass-panel rounded-3xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">All Auctions</h2>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader size={40} className="animate-spin text-nepal-accent" />
              </div>
            ) : auctions.length === 0 ? (
              <div className="text-center py-20">
                <AlertCircle size={48} className="mx-auto mb-4 text-gray-500" />
                <p className="text-gray-400 text-lg">No auctions found</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {auctions.map((auction) => {
                  const isExpired = new Date(auction.endTime) < new Date();
                  const timeRemaining = Math.max(
                    0,
                    Math.floor(
                      (new Date(auction.endTime).getTime() - new Date().getTime()) /
                        1000 /
                        60
                    )
                  );

                  return (
                    <div
                      key={auction.id}
                      className="glass-panel p-4 rounded-2xl flex items-center justify-between gap-4 hover:bg-white/5 transition-all"
                    >
                      {/* Auction Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-4">
                          <img
                            src={auction.imageUrl || "https://images.unsplash.com/photo-1694956792421-e946fff94564?w=80&h=80&fit=crop"}
                            alt={auction.title}
                            className="w-16 h-16 rounded-lg object-cover"
                          />

                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-bold text-lg truncate">
                              {auction.title}
                            </h3>
                            <p className="text-gray-400 text-sm truncate">
                              {auction.description}
                            </p>

                            <div className="flex gap-4 mt-2 text-sm">
                              <span className="text-gray-400">
                                <span className="text-white font-semibold">
                                  Rs. {auction.currentPrice.toLocaleString("en-IN")}
                                </span>
                                <span className="text-gray-500"> current</span>
                              </span>
                              <span className="text-gray-400">
                                <span className="text-white font-semibold">
                                  {auction.bids.length}
                                </span>
                                <span className="text-gray-500"> bids</span>
                              </span>
                              <span className={`font-semibold ${
                                isExpired
                                  ? "text-red-400"
                                  : "text-green-400"
                              }`}>
                                {isExpired
                                  ? "Expired"
                                  : `${timeRemaining}m left`}
                              </span>
                            </div>

                            <p className="text-xs text-gray-500 mt-1">
                              By: {auction.seller.name || auction.seller.email.split("@")[0]}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/auctions/${auction.id}`}
                          className="p-2 rounded-lg glass-panel hover:bg-white/30 transition-colors"
                          title="View Auction"
                        >
                          <Eye size={20} className="text-blue-400" />
                        </Link>

                        <button
                          onClick={() =>
                            setDeleteConfirm(
                              deleteConfirm === auction.id ? null : auction.id
                            )
                          }
                          className="p-2 rounded-lg glass-panel hover:bg-red-500/20 transition-colors"
                          title="Delete Auction"
                          disabled={deletingId === auction.id}
                        >
                          <Trash2 size={20} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Content Section - KYC */}
        {activeTab === 'kyc' && (
          <div className="glass-panel rounded-3xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">KYC Verification Requests</h2>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader size={40} className="animate-spin text-nepal-accent" />
              </div>
            ) : kycSubmissions.length === 0 ? (
              <div className="text-center py-20">
                <Shield size={48} className="mx-auto mb-4 text-gray-500" />
                <p className="text-gray-400 text-lg">No KYC submissions found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {kycSubmissions.map((submission) => (
                  <motion.div
                    key={submission.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel rounded-2xl overflow-hidden"
                  >
                    {/* Header */}
                    <button
                      onClick={() =>
                        setExpandedKyc(expandedKyc === submission.id ? null : submission.id)
                      }
                      className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition"
                    >
                      <div className="flex items-center gap-4 text-left">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          submission.kycStatus === 'VERIFIED'
                            ? 'bg-green-500/20'
                            : submission.kycStatus === 'REJECTED'
                            ? 'bg-red-500/20'
                            : 'bg-yellow-500/20'
                        }`}>
                          {submission.kycStatus === 'VERIFIED' && <Check className="text-green-400" size={20} />}
                          {submission.kycStatus === 'REJECTED' && <X className="text-red-400" size={20} />}
                          {submission.kycStatus === 'PENDING' && <Clock className="text-yellow-400" size={20} />}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{submission.name}</p>
                          <p className="text-sm text-gray-400">{submission.email}</p>
                          <p className={`text-xs mt-1 font-bold ${
                            submission.kycStatus === 'VERIFIED'
                              ? 'text-green-400'
                              : submission.kycStatus === 'REJECTED'
                              ? 'text-red-400'
                              : 'text-yellow-400'
                          }`}>
                            {submission.kycStatus}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(submission.kycSubmittedAt).toLocaleDateString()}
                      </div>
                    </button>

                    {/* Expanded Content */}
                    <AnimatePresence>
                      {expandedKyc === submission.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-white/10 bg-white/5 p-6 space-y-6"
                        >
                          {/* Addresses */}
                          <div className="grid md:grid-cols-2 gap-6">
                            <div>
                              <p className="text-sm font-semibold text-gray-300 mb-2">Current Address</p>
                              <p className="text-gray-400 text-sm whitespace-pre-wrap">{submission.currentAddress}</p>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-300 mb-2">Permanent Address</p>
                              <p className="text-gray-400 text-sm whitespace-pre-wrap">{submission.permanentAddress}</p>
                            </div>
                          </div>

                          {/* Documents */}
                          <div>
                            <p className="text-sm font-semibold text-gray-300 mb-3">Documents</p>
                            <div className="grid md:grid-cols-3 gap-4">
                              {[
                                { label: 'Citizenship Front', url: submission.citizenshipFront },
                                { label: 'Citizenship Back', url: submission.citizenshipBack },
                                { label: 'Selfie with Citizenship', url: submission.selfieWithCitizenship },
                              ].map((doc) => (
                                <div key={doc.label}>
                                  <p className="text-xs font-semibold text-gray-400 mb-2">{doc.label}</p>
                                  {doc.url ? (
                                    <a
                                      href={doc.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block border-2 border-nepal-accent rounded-lg overflow-hidden hover:opacity-75 transition"
                                    >
                                      <img
                                        src={doc.url}
                                        alt={doc.label}
                                        className="w-full h-40 object-cover"
                                      />
                                    </a>
                                  ) : (
                                    <div className="w-full h-40 bg-gray-700 rounded-lg flex items-center justify-center text-gray-500">
                                      No image
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Rejection Reason */}
                          {submission.kycRejectionReason && (
                            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                              <p className="text-sm font-semibold text-red-400">Rejection Reason:</p>
                              <p className="text-sm text-red-300 mt-1">{submission.kycRejectionReason}</p>
                            </div>
                          )}

                          {/* Action Buttons */}
                          {submission.kycStatus === 'PENDING' && (
                            <div className="space-y-3 border-t border-white/10 pt-4">
                              <button
                                onClick={() => handleKycApprove(submission.id)}
                                disabled={processingKyc === submission.id}
                                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
                              >
                                {processingKyc === submission.id ? (
                                  <Loader size={16} className="animate-spin" />
                                ) : (
                                  <Check size={16} />
                                )}
                                {processingKyc === submission.id ? 'Processing...' : 'Approve KYC'}
                              </button>

                              <div>
                                <p className="text-sm font-semibold text-gray-300 mb-2">Or Reject with Reason</p>
                                <textarea
                                  value={rejectReason}
                                  onChange={(e) => setRejectReason(e.target.value)}
                                  placeholder="Enter reason for rejection..."
                                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 resize-none mb-2"
                                  rows={2}
                                />
                                <button
                                  onClick={() => handleKycReject(submission.id)}
                                  disabled={processingKyc === submission.id || !rejectReason.trim()}
                                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
                                >
                                  {processingKyc === submission.id ? (
                                    <Loader size={16} className="animate-spin" />
                                  ) : (
                                    <X size={16} />
                                  )}
                                  {processingKyc === submission.id ? 'Processing...' : 'Reject KYC'}
                                </button>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="glass-panel rounded-3xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Reported Listings</h2>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader size={40} className="animate-spin text-nepal-accent" />
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-20">
                <AlertCircle size={48} className="mx-auto mb-4 text-gray-500" />
                <p className="text-gray-400 text-lg">No reports found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel p-4 rounded-xl border border-white/10 hover:border-white/20 transition-all"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
                      {/* Listing Info */}
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-400 uppercase tracking-wider mb-1">Listing</p>
                        <p className="font-bold text-white line-clamp-2">{report.auction?.title || 'Unknown'}</p>
                        <p className="text-xs text-gray-500 mt-1">ID: {report.auctionId}</p>
                      </div>

                      {/* Reporter & Reason */}
                      <div>
                        <p className="text-sm text-gray-400 uppercase tracking-wider mb-1">Reason</p>
                        <p className="font-semibold text-white text-sm">{report.reason}</p>
                        <p className="text-xs text-gray-500 mt-1">By: {report.reporter?.email || 'Unknown'}</p>
                      </div>

                      {/* Status Badge */}
                      <div>
                        <p className="text-sm text-gray-400 uppercase tracking-wider mb-1">Status</p>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${
                          report.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                          report.status === 'REVIEWED' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                          report.status === 'RESOLVED' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                          'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                        }`}>
                          {report.status}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {report.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => updateReportStatus(report.id, 'REVIEWED')}
                              className="flex-1 py-2 px-3 text-xs font-bold rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-colors flex items-center justify-center gap-1"
                            >
                              <Eye size={14} />
                              Review
                            </button>
                            <button
                              onClick={() => updateReportStatus(report.id, 'RESOLVED')}
                              className="flex-1 py-2 px-3 text-xs font-bold rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 transition-colors flex items-center justify-center gap-1"
                            >
                              <Check size={14} />
                              Resolve
                            </button>
                          </>
                        )}
                        {report.status === 'REVIEWED' && (
                          <button
                            onClick={() => updateReportStatus(report.id, 'RESOLVED')}
                            className="flex-1 py-2 px-3 text-xs font-bold rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 transition-colors flex items-center justify-center gap-1"
                          >
                            <Check size={14} />
                            Resolve
                          </button>
                        )}
                        <button
                          onClick={() => updateReportStatus(report.id, 'DISMISSED')}
                          className="flex-1 py-2 px-3 text-xs font-bold rounded-lg bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 transition-colors flex items-center justify-center gap-1"
                        >
                          <X size={14} />
                          Dismiss
                        </button>
                      </div>
                    </div>

                    {/* Description if exists */}
                    {report.description && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <p className="text-sm text-gray-400"><strong>Details:</strong> {report.description}</p>
                      </div>
                    )}

                    {/* Created Date */}
                    <div className="mt-2 text-xs text-gray-500">
                      Reported: {new Date(report.createdAt).toLocaleString()}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {deleteConfirm && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
              onClick={() => setDeleteConfirm(null)}
            >
              <motion.div
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                className="glass-panel p-8 rounded-3xl max-w-md w-full mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle size={24} className="text-red-400" />
                  <h3 className="text-2xl font-bold text-white">
                    Delete Auction?
                  </h3>
                </div>

                <p className="text-gray-400 mb-6">
                  Are you sure you want to delete this auction? This action cannot be undone.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 py-2 rounded-lg glass-panel hover:bg-white/10 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() =>
                      deleteConfirm && handleDeleteAuction(deleteConfirm)
                    }
                    disabled={deletingId !== null}
                    className="flex-1 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-red-400 flex items-center justify-center gap-2"
                  >
                    {deletingId ? (
                      <Loader size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                    {deletingId ? "Deleting..." : "Delete Auction"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
