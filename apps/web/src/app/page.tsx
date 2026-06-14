'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTransitStore } from '../lib/store';
import { api } from '../lib/api';
import { 
  Activity, 
  AlertTriangle, 
  MapPin, 
  Wrench, 
  ShieldAlert, 
  PlusCircle, 
  User as UserIcon,
  CheckCircle,
  Clock,
  Compass,
  ArrowRight,
  RefreshCw,
  Search,
  Filter,
  X,
  ChevronLeft
} from 'lucide-react';
import { Infrastructure, Alert } from '@transit/types';
import {
  computeAssetsAtRisk,
  computeRiskDistribution,
  computeTypeBreakdown,
  sortAssetsByRisk,
  getHealthBarColor,
  getHealthTextColor,
  getFailureProbabilityColor,
  buildAssetHealthTrend,
  InfrastructureWithHealth,
} from '../lib/analytics';
import { StatusBadge } from '../components/operator/StatusBadge';
import { HealthTrendChart } from '../components/operator/HealthTrendChart';
import { RiskDistributionChart } from '../components/operator/RiskDistributionChart';
import { TypeBreakdownChart } from '../components/operator/TypeBreakdownChart';

const TransitMap = dynamic(
  () => import('../components/TransitMap').then((m) => m.TransitMap),
  { ssr: false },
);

export default function Home() {
  const queryClient = useQueryClient();
  const {
    viewMode,
    setViewMode,
    selectedAssetId,
    setSelectedAssetId,
    selectedStationId,
    setSelectedStationId,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    filterType,
    setFilterType,
    currentUser,
    setCurrentUser
  } = useTransitStore();

  // Local state for reporting modal / form
  const [isReporting, setIsReporting] = useState(false);
  const [reportForm, setReportForm] = useState({
    infrastructure_id: '',
    description: '',
    severity: 'medium'
  });
  const [successMsg, setSuccessMsg] = useState('');

  // Mobile navigation tab switcher
  const [mobileTab, setMobileTab] = useState<'map' | 'alerts' | 'planner'>('map');

  // 1. Fetching Queries via TanStack Query
  const { data: infraResponse, isLoading: isInfraLoading, refetch: refetchInfra } = useQuery({
    queryKey: ['infrastructure'],
    queryFn: api.getInfrastructure
  });

  const { data: alertsResponse, refetch: refetchAlerts } = useQuery({
    queryKey: ['alerts'],
    queryFn: api.getAlerts
  });

  const { data: summaryResponse, refetch: refetchSummary } = useQuery({
    queryKey: ['summary'],
    queryFn: api.getDashboardSummary
  });

  const { data: healthTrendResponse, isLoading: isHealthTrendLoading, refetch: refetchHealthTrend } = useQuery({
    queryKey: ['healthTrend'],
    queryFn: api.getHealthTrend,
    enabled: viewMode === 'operator',
  });

  const { data: selectedAssetDetails, refetch: refetchAssetDetails } = useQuery({
    queryKey: ['assetDetails', selectedAssetId],
    queryFn: () => selectedAssetId ? api.getAssetDetails(selectedAssetId) : null,
    enabled: !!selectedAssetId
  });

  // 2. Mutations
  const reportMutation = useMutation({
    mutationFn: api.submitReport,
    onSuccess: (data) => {
      setSuccessMsg('Thank you! Your report has been submitted and queued for verification.');
      setReportForm({ infrastructure_id: '', description: '', severity: 'medium' });
      // Invalidate queries to fetch updated data
      queryClient.invalidateQueries({ queryKey: ['infrastructure'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      if (selectedAssetId) {
        queryClient.invalidateQueries({ queryKey: ['assetDetails', selectedAssetId] });
      }
      setTimeout(() => {
        setSuccessMsg('');
        setIsReporting(false);
      }, 4000);
    },
    onError: (err: any) => {
      alert(`Report Submission Failed: ${err.message}`);
    }
  });

  const resolveAlertMutation = useMutation({
    mutationFn: api.resolveAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['infrastructure'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      if (selectedAssetId) {
        queryClient.invalidateQueries({ queryKey: ['assetDetails', selectedAssetId] });
      }
    },
    onError: (err: any) => {
      alert(`Could not resolve alert: ${err.message}`);
    }
  });

  // Extract assets and alerts array
  const assets: Infrastructure[] = infraResponse?.data || [];
  const activeAlerts: Alert[] = (alertsResponse?.data || []).filter((a: Alert) => a.resolved === 0);
  const summary = summaryResponse?.data || {
    totalInfrastructure: 0,
    activeAlerts: 0,
    criticalAssets: 0,
    averageReliability: 100
  };

  const healthTrendData = healthTrendResponse?.data || [];
  const riskDistribution = computeRiskDistribution(assets);
  const typeBreakdown = computeTypeBreakdown(assets);
  const sortedOperatorAssets = sortAssetsByRisk(assets as InfrastructureWithHealth[]);

  // Auto-set the first asset when none selected
  useEffect(() => {
    if (assets.length > 0 && !selectedAssetId) {
      setSelectedAssetId(assets[0].id);
    }
  }, [assets, selectedAssetId, setSelectedAssetId]);

  // Derived Stations list for map & sidebar
  const stations = [
    { id: 'st_cst', name: 'CSMT Hub', lng: 72.8355, lat: 18.9402, address: 'Chhatrapati Shivaji Maharaj Terminus, Fort, Mumbai, 400001' },
    { id: 'st_dadar', name: 'Dadar Junction', lng: 72.8424, lat: 19.0180, address: 'Dadar East Station Rd, Dadar East, Mumbai, 400014' },
    { id: 'st_andheri', name: 'Andheri Central', lng: 72.8464, lat: 19.1197, address: 'Andheri Station West, Railway Colony, Mumbai, 400069' },
    { id: 'st_kurla', name: 'Kurla Interchange', lng: 72.8890, lat: 19.0728, address: 'Kurla West Station Rd, Brahmanwadi, Kurla, Mumbai, 400070' },
    { id: 'st_ghatkopar', name: 'Ghatkopar Station', lng: 72.9081, lat: 19.0856, address: 'Ghatkopar East Station Rd, Pant Nagar, Mumbai, 400075' },
    { id: 'st_thane', name: 'Thane Terminus', lng: 72.9781, lat: 19.2183, address: 'Thane West Railway Station Rd, Thane, Maharashtra, 400601' },
  ];

  // Map station status color
  const getStationStatusColor = (stationId: string) => {
    const stationAssets = assets.filter(a => a.station_id === stationId);
    if (stationAssets.some(a => a.status === 'critical')) return 'bg-red-500';
    if (stationAssets.some(a => a.status === 'warning')) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  // Filtered assets list
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (asset.station_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStation = selectedStationId ? asset.station_id === selectedStationId : true;
    const matchesStatus = filterStatus === 'all' ? true : asset.status === filterStatus;
    const matchesType = filterType === 'all' ? true : asset.type === filterType;

    return matchesSearch && matchesStation && matchesStatus && matchesType;
  });

  const currentAsset = assets.find(a => a.id === selectedAssetId);
  const selectedStation = stations.find(s => s.id === selectedStationId);

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportForm.infrastructure_id || !reportForm.description) {
      alert('Please select an asset and write a description.');
      return;
    }
    reportMutation.mutate({
      infrastructure_id: reportForm.infrastructure_id,
      user_id: currentUser || 'usr_1', // Dynamic active user ID from store
      description: reportForm.description,
      severity: reportForm.severity
    });
  };

  return (
    <div className={`flex flex-col text-slate-800 bg-slate-100/50 relative overflow-hidden select-none ${viewMode === 'operator' ? 'h-screen' : 'min-h-screen'}`}>
      
      {/* Floating Header on Desktop */}
      <header className="hidden md:flex glass-panel sticky top-4 left-4 right-4 z-30 mx-4 mt-4 px-6 py-4 items-center justify-between border border-slate-200/50 rounded-3xl shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-orange-500 to-amber-500 p-2.5 rounded-2xl text-white shadow-md shadow-orange-500/25 ring-1 ring-white/20">
            <Activity className="h-5.5 w-5.5 animate-pulse text-white" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
              Transit Infra Intelligence
              <span className="text-[9px] bg-orange-500/10 text-orange-600 border border-orange-500/20 px-2 py-0.5 rounded-full font-mono font-bold tracking-wider">V1.0</span>
            </h1>
            <p className="text-[9px] text-orange-600 font-mono tracking-widest uppercase mt-0.5">
              Predictive Monitoring Control Center
            </p>
          </div>
        </div>

        {/* View Switcher and Actions */}
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-slate-100 border border-slate-200/60 rounded-2xl p-1 shadow-inner backdrop-blur-md">
            <button
              onClick={() => {
                setViewMode('commuter');
                setCurrentUser('usr_1'); // Switch to commuter Rohan Sharma
              }}
              className={`px-5 py-2 rounded-xl text-xs font-bold tracking-wide transition-all ${
                viewMode === 'commuter'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Commuter App
            </button>
            <button
              onClick={() => {
                setViewMode('operator');
                setCurrentUser('usr_3'); // Switch to operator Vikram Singh
              }}
              className={`px-5 py-2 rounded-xl text-xs font-bold tracking-wide transition-all ${
                viewMode === 'operator'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Operator Control Desk
            </button>
          </div>

          <button 
            onClick={() => { refetchInfra(); refetchAlerts(); refetchSummary(); if (viewMode === 'operator') refetchHealthTrend(); }}
            className="p-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-slate-600 hover:text-slate-900 transition-all shadow-sm active:scale-95"
            title="Refresh Telemetry"
          >
            <RefreshCw className="h-4.5 w-4.5" />
          </button>

          {/* User profile selection dropdown */}
          <div className="flex items-center gap-2.5 border-l border-slate-200 pl-4">
            <div className="bg-white h-9 w-9 rounded-full flex items-center justify-center border border-slate-200 text-slate-700 shadow-sm">
              <UserIcon className="h-4.5 w-4.5 text-orange-500" />
            </div>
            <select
              value={currentUser || ''}
              onChange={(e) => setCurrentUser(e.target.value)}
              className="text-xs text-slate-600 font-mono bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200 outline-none cursor-pointer"
            >
              <option value="usr_1">usr_demo_1 (Rohan - Commuter)</option>
              <option value="usr_2">usr_demo_2 (Priya - Commuter)</option>
              <option value="usr_3">usr_demo_3 (Vikram - Operator)</option>
              <option value="usr_4">usr_demo_4 (Amit - Technician)</option>
              <option value="usr_5">usr_demo_5 (Sneha - Admin)</option>
            </select>
          </div>
        </div>
      </header>

      {/* Floating Header on Mobile (Swyft style) */}
      <div className="flex md:hidden absolute top-4 left-4 right-4 z-30 justify-between items-center px-2 pointer-events-none">
        <button
          onClick={() => {
            setSelectedStationId(null);
            setSelectedAssetId(null);
            setIsReporting(false);
          }}
          className="h-11 w-11 rounded-full bg-white/95 border border-slate-200/80 shadow-lg flex items-center justify-center text-slate-800 pointer-events-auto active:scale-90 transition-all"
        >
          <ChevronLeft className="h-6 w-6 text-slate-800" />
        </button>

        <div className="bg-white/95 border border-slate-200/80 px-5 py-2.5 rounded-2xl shadow-lg backdrop-blur-md flex items-center gap-2 pointer-events-auto">
          <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
          <span className="text-sm font-extrabold tracking-wider text-orange-500 font-sans">swyft</span>
        </div>

        <div className="h-11 w-11 pointer-events-none" />
      </div>

      {/* Main Section */}
      <main className={`flex-1 w-full max-w-[1400px] mx-auto px-4 md:px-6 pb-6 mt-4 z-10 relative flex flex-col gap-6 pointer-events-none ${viewMode === 'operator' ? 'overflow-y-auto' : 'h-[calc(100vh-140px)] md:flex-row'}`}>
        
        {viewMode === 'commuter' ? (
          <>
            {/* Desktop Left Sidebar Panel */}
            <div className="hidden md:flex w-96 flex-col gap-4 glass-panel rounded-3xl p-5 shadow-xl border border-slate-200/50 pointer-events-auto h-full md:h-auto overflow-y-auto shrink-0 animate-slide-up">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Search className="h-4.5 w-4.5 text-orange-500" />
                <input
                  type="text"
                  placeholder="Search assets or stations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs text-slate-850 placeholder-slate-400 w-full font-semibold"
                />
              </div>

              {/* Advanced Filters */}
              <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-100">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-[10px] text-slate-700 font-semibold focus:border-orange-500 outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="healthy">Healthy</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                </select>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-[10px] text-slate-700 font-semibold focus:border-orange-500 outline-none"
                >
                  <option value="all">All Types</option>
                  <option value="escalator">Escalators</option>
                  <option value="elevator">Elevators</option>
                  <option value="bus_stop">Bus Stops</option>
                  <option value="charger">EV Chargers</option>
                  <option value="footbridge">Footbridges</option>
                </select>
              </div>

              {/* Station select */}
              <div className="flex flex-col gap-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">Transit Hubs</span>
                <div className="grid grid-cols-2 gap-2">
                  {stations.map(st => (
                    <button
                      key={st.id}
                      onClick={() => setSelectedStationId(selectedStationId === st.id ? null : st.id)}
                      className={`px-3 py-2 rounded-xl text-[10px] font-bold border transition-all text-left truncate ${
                        selectedStationId === st.id 
                          ? 'bg-orange-500 text-white border-orange-400 shadow-sm' 
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 shadow-sm'
                      }`}
                    >
                      {st.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Node pool listing */}
              <div className="flex flex-col gap-2.5 mt-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">Nodes & Telemetry ({filteredAssets.length})</span>
                <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                  {isInfraLoading ? (
                    <span className="text-xs text-slate-500 italic py-4 text-center">Querying node pools...</span>
                  ) : filteredAssets.length === 0 ? (
                    <span className="text-xs text-slate-500 italic py-4 text-center">No matching assets found.</span>
                  ) : (
                    filteredAssets.map(a => (
                      <button
                        key={a.id}
                        onClick={() => setSelectedAssetId(a.id)}
                        className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                          selectedAssetId === a.id 
                            ? 'bg-orange-50 border-orange-300 text-orange-950 font-bold shadow-sm' 
                            : 'bg-white border-slate-100 hover:border-slate-200 text-slate-700 shadow-sm'
                        }`}
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[11px] font-bold">{a.name}</span>
                          <span className="text-[8.5px] text-slate-500 font-semibold capitalize">{a.type.replace('_', ' ')} · {a.station_name}</span>
                        </div>
                        <span className={`text-[8.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                          a.status === 'healthy' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          a.status === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {a.status}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Unified Map Container (Renders in center-right empty space on desktop, absolute backdrop on mobile) */}
            <div className="absolute md:relative inset-0 md:inset-auto z-0 md:z-10 flex-1 w-full h-full md:h-auto md:rounded-[32px] overflow-hidden border-0 md:border md:border-slate-200/50 md:shadow-md pointer-events-auto bg-slate-50">
              <TransitMap
                stations={stations}
                selectedStationId={selectedStationId}
                onStationClick={(id) => {
                  setSelectedStationId(selectedStationId === id ? null : id);
                  const stationAssets = assets.filter(a => a.station_id === id);
                  if (stationAssets.length > 0) {
                    setSelectedAssetId(stationAssets[0].id);
                  }
                }}
                getStationStatusColor={getStationStatusColor}
              />
            </div>

            {/* Desktop Right Details/Dispatch Panel */}
            {currentAsset && (
              <div className="hidden md:flex w-[380px] flex-col gap-4 glass-panel rounded-3xl p-5 shadow-xl border border-slate-200/50 pointer-events-auto h-full md:h-auto overflow-y-auto shrink-0 animate-fade-in">
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[9px] text-orange-650 font-bold uppercase tracking-widest block">Node Profile</span>
                    <h2 className="text-sm font-extrabold text-slate-900 mt-0.5">{currentAsset.name}</h2>
                    <p className="text-[10px] text-slate-550 flex items-center gap-1 mt-1 font-semibold">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      {currentAsset.station_name}
                    </p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase border ${
                    currentAsset.status === 'healthy' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    currentAsset.status === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {currentAsset.status}
                  </span>
                </div>

                {/* Score indicators */}
                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-slate-800">Uptime Score</span>
                    <span className="text-[10px] text-slate-500 leading-relaxed block max-w-[180px] font-medium">
                      Historical operational accuracy rating.
                    </span>
                  </div>
                  <div className="relative h-16 w-16 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path className="text-slate-200" strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path className="text-orange-500" strokeDasharray={`${(currentAsset as any).score || 100}, 100`} strokeWidth="3.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                    <span className="absolute text-xs font-mono font-bold text-slate-800">{(currentAsset as any).score || 100}%</span>
                  </div>
                </div>

                {/* Predict warnings */}
                {(currentAsset as any).predicted_failure_time && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center gap-3 animate-pulse">
                    <Clock className="h-5 w-5 text-rose-500" />
                    <div>
                      <span className="text-[9px] text-rose-600 font-bold block uppercase tracking-wider">Predictive Outage Alarm</span>
                      <span className="text-[10px] text-rose-900 font-bold">Failure highly probable within 48 hours.</span>
                    </div>
                  </div>
                )}

                {/* Maintenance timeline */}
                <div className="flex flex-col gap-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block pl-1">Overhaul Timeline</span>
                  <div className="flex items-center justify-between text-xs font-mono bg-slate-50 border border-slate-200/60 p-3 rounded-xl">
                    <span className="text-slate-500">Last Service Date:</span>
                    <span className="text-slate-800 font-semibold">{new Date(currentAsset.last_maintenance).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Commuter Alerts Feed */}
                <div className="flex flex-col gap-2.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block pl-1">Commuter Alerts Log</span>
                  <div className="flex flex-col gap-2 max-h-[140px] overflow-y-auto pr-1">
                    {!selectedAssetDetails?.data?.recentReports || selectedAssetDetails.data.recentReports.length === 0 ? (
                      <span className="text-xs text-slate-500 italic py-3 text-center bg-slate-50 border border-slate-200/40 rounded-xl">No active reports filed.</span>
                    ) : (
                      (selectedAssetDetails.data.recentReports as any[]).map((rep: any) => (
                        <div key={rep.id} className="bg-white border border-slate-200/60 p-3 rounded-xl flex flex-col gap-1 shadow-sm">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-orange-600 font-bold">{rep.user_name || 'Citizen Commuter'}</span>
                            <span className="text-[8px] font-mono text-slate-400 uppercase font-bold bg-slate-100 px-1.5 py-0.5 rounded border">{rep.severity}</span>
                          </div>
                          <p className="text-xs text-slate-700">{rep.description}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Citizen submission form */}
                <div className="border-t border-slate-100 pt-4 mt-auto">
                  {isReporting ? (
                    <form onSubmit={handleReportSubmit} className="bg-white border border-slate-200 shadow-md p-4 rounded-2xl flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-700 uppercase">Submit Telemetry Report</span>
                        <button type="button" onClick={() => setIsReporting(false)} className="text-[10px] text-slate-400 hover:text-slate-650 font-bold">Cancel</button>
                      </div>
                      
                      <div>
                        <label className="text-[8px] text-slate-400 font-bold block mb-1">Severity</label>
                        <div className="grid grid-cols-3 gap-2">
                          {['low', 'medium', 'high'].map(s => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setReportForm({ ...reportForm, severity: s })}
                              className={`py-1 rounded-lg text-xs font-bold transition-all border ${reportForm.severity === s ? 'bg-orange-500 border-orange-400 text-white shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-[8px] text-slate-400 font-bold block mb-1">Details</label>
                        <textarea
                          rows={3}
                          value={reportForm.description}
                          onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-orange-500 font-semibold"
                          required
                        />
                      </div>

                      {successMsg ? (
                        <div className="p-2 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs rounded-xl text-center font-bold">{successMsg}</div>
                      ) : (
                        <button type="submit" disabled={reportMutation.isPending} className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm">Submit Report</button>
                      )}
                    </form>
                  ) : (
                    <button
                      onClick={() => {
                        setReportForm({ ...reportForm, infrastructure_id: currentAsset.id });
                        setIsReporting(true);
                      }}
                      className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold py-2.5 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-all"
                    >
                      <PlusCircle className="h-4.5 w-4.5 text-orange-500" />
                      File Malfunction Alert
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Operator Control Desk View - Full Width Columns */
          <div className="flex flex-col gap-6 pointer-events-auto animate-fade-in w-full pb-8">
            
            {/* Top row summaries */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="glass-panel p-5 rounded-3xl border border-slate-200/50 shadow-md">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">Total Nodes</span>
                <span className="text-2xl font-bold font-mono text-slate-800 block mt-1">{summary.totalInfrastructure}</span>
              </div>
              <div className="glass-panel p-5 rounded-3xl border border-slate-200/50 shadow-md">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">Active Alerts</span>
                <span className="text-2xl font-bold font-mono text-rose-600 block mt-1">{summary.activeAlerts}</span>
              </div>
              <div className="glass-panel p-5 rounded-3xl border border-slate-200/50 shadow-md">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">Critical Assets</span>
                <span className="text-2xl font-bold font-mono text-amber-600 block mt-1">{summary.criticalAssets}</span>
              </div>
              <div className="glass-panel p-5 rounded-3xl border border-slate-200/50 shadow-md">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">Avg Fleet Reliability</span>
                <span className="text-2xl font-bold font-mono text-emerald-600 block mt-1">{summary.averageReliability}%</span>
              </div>
            </div>

            {/* Split grid for Dispatch Logs & Predictive Maintenance Table */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Active Dispatch Alerts (5/12 grid) */}
              <div className="lg:col-span-5 flex flex-col gap-4 glass-panel rounded-3xl p-5 shadow-md border border-slate-200/50">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900">Active Alert Logs</h3>
                    <p className="text-[9px] text-slate-400 font-mono mt-0.5">Technician triggers</p>
                  </div>
                  <span className="text-[9px] font-mono text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                    {activeAlerts.length} Alerts
                  </span>
                </div>

                <div className="flex flex-col gap-3 max-h-[450px] overflow-y-auto pr-1">
                  {activeAlerts.length === 0 ? (
                    <div className="text-center py-16 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center gap-2">
                      <CheckCircle className="h-8 w-8 text-emerald-500" />
                      <span className="text-xs text-slate-500 font-bold">Nominal fleet status.</span>
                    </div>
                  ) : (
                    activeAlerts.map(alert => (
                      <div 
                        key={alert.id} 
                        className={`p-4 rounded-2xl border flex flex-col gap-2.5 bg-white shadow-sm transition-all hover:shadow ${alert.severity === 'critical' ? 'border-rose-200' : 'border-amber-200'}`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase mr-1 border ${
                              alert.severity === 'critical' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {alert.severity}
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono">{new Date(alert.created_at).toLocaleTimeString()}</span>
                          </div>
                          <button
                            onClick={() => resolveAlertMutation.mutate(alert.id)}
                            className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-[9.5px] font-bold px-2.5 py-1 rounded-lg active:scale-95 transition-all flex items-center gap-1"
                          >
                            <Wrench className="h-3 w-3" />
                            Resolve
                          </button>
                        </div>
                        <div className="flex flex-col gap-1">
                          <h4 className="text-xs font-bold text-slate-800">{alert.title}</h4>
                          <span className="text-[8.5px] text-slate-500 font-mono uppercase font-bold">{alert.asset_name} · {alert.station_name}</span>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{alert.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Predictive Maintenance Schedule (7/12 grid) */}
              <div className="lg:col-span-7 flex flex-col gap-4 glass-panel rounded-3xl p-5 shadow-md border border-slate-200/50">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900">Predictive Maintenance Schedule</h3>
                    <p className="text-[9px] text-slate-400 font-mono mt-0.5">Asset rankings sorted by fail risk</p>
                  </div>
                  <span className="text-[9px] font-mono text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                    Live Telemetry
                  </span>
                </div>

                <div className="max-h-[450px] overflow-y-auto border border-slate-200/80 rounded-2xl bg-white shadow-inner">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
                      <tr className="text-slate-500 font-mono text-[9px] uppercase tracking-wider">
                        <th className="p-3 font-extrabold">Asset</th>
                        <th className="p-3 font-extrabold">Hub</th>
                        <th className="p-3 font-extrabold">Health Index</th>
                        <th className="p-3 font-extrabold">Risk</th>
                        <th className="p-3 font-extrabold">Status</th>
                        <th className="p-3 font-extrabold">Est. Failure</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {isInfraLoading ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400 italic">Querying asset data...</td>
                        </tr>
                      ) : sortedOperatorAssets.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400 italic">No assets found.</td>
                        </tr>
                      ) : (
                        sortedOperatorAssets.map((asset) => {
                          const score = asset.score !== undefined ? asset.score : 100;
                          const failProb = asset.failure_probability !== undefined ? asset.failure_probability : 0.0;
                          const estFail = asset.predicted_failure_time;

                          return (
                            <tr key={asset.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-3">
                                <div className="flex flex-col">
                                  <span className="font-bold text-slate-800">{asset.name}</span>
                                  <span className="text-[9px] text-slate-400 capitalize">{asset.type.replace('_', ' ')}</span>
                                </div>
                              </td>
                              <td className="p-3 text-slate-600">{asset.station_name}</td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${getHealthBarColor(score)}`}
                                      style={{ width: `${score}%` }}
                                    />
                                  </div>
                                  <span className={`font-mono font-bold ${getHealthTextColor(score)}`}>
                                    {score}
                                  </span>
                                </div>
                              </td>
                              <td className={`p-3 font-mono font-bold ${getFailureProbabilityColor(failProb)}`}>
                                {(failProb * 100).toFixed(0)}%
                              </td>
                              <td className="p-3">
                                <StatusBadge status={asset.status} />
                              </td>
                              <td className="p-3">
                                {estFail ? (
                                  <span className="text-red-600 font-bold flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {Math.ceil((new Date(estFail).getTime() - Date.now()) / (1000 * 60 * 60))} hrs
                                  </span>
                                ) : (
                                  <span className="text-slate-400 font-mono">Stable</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Recharts Analytics Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 h-80">
                <HealthTrendChart data={healthTrendData} isLoading={isHealthTrendLoading} />
              </div>
              <div className="lg:col-span-4 h-80">
                <RiskDistributionChart data={riskDistribution} />
              </div>
            </div>

            <div className="w-full">
              <TypeBreakdownChart data={typeBreakdown} />
            </div>

          </div>
        )}

      </main>

      {/* Mobile Bottom Sheets (commuter status vs dispatcher tabs) */}
      {viewMode === 'commuter' ? (
        <div className="flex md:hidden absolute bottom-4 left-4 right-4 z-20 pointer-events-auto max-h-[60%] overflow-y-auto bg-white/95 border border-slate-200/80 shadow-2xl backdrop-blur-lg p-5 rounded-[32px] flex-col gap-3.5 animate-slide-up">
          <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto" />
          {selectedStation ? (
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-500 shrink-0 shadow-inner">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{selectedStation.name}</h3>
                    <p className="text-[9px] text-slate-400 mt-0.5">Transit Hub · Mumbai Segment</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setSelectedStationId(null);
                    setSelectedAssetId(null);
                  }}
                  className="h-7 w-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 active:scale-95"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-col gap-1 text-xs">
                <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest">Address Details</span>
                <p className="text-slate-700 leading-relaxed font-semibold">{selectedStation.address}</p>
              </div>
              <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-slate-100">
                <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest mb-1 pl-1">Station Nodes</span>
                <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {assets.filter(a => a.station_id === selectedStation.id).map(a => (
                    <div 
                      key={a.id} 
                      onClick={() => setSelectedAssetId(a.id)}
                      className={`flex items-center justify-between p-2 rounded-xl border text-[11px] font-medium transition-all ${selectedAssetId === a.id ? 'bg-orange-50 border-orange-300 text-orange-950 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                    >
                      <span>{a.name}</span>
                      <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                        a.status === 'healthy' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        a.status === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {a.status}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setReportForm({ ...reportForm, infrastructure_id: currentAsset?.id || '' });
                    setIsReporting(true);
                  }}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-3.5 rounded-2xl text-[11px] transition-all shadow-lg shadow-orange-500/20 active:scale-98 flex items-center justify-center gap-1.5"
                >
                  <PlusCircle className="h-4 w-4" />
                  Report Malfunction
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-orange-500" />
                <input
                  type="text"
                  placeholder="Search where to go..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-9 py-3 text-xs text-slate-800 w-full focus:outline-none focus:border-orange-500 transition-all font-semibold"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-650"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                {stations.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).map(s => {
                  const statusColor = getStationStatusColor(s.id);
                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        setSelectedStationId(s.id);
                        const stationAssets = assets.filter(a => a.station_id === s.id);
                        if (stationAssets.length > 0) {
                          setSelectedAssetId(stationAssets[0].id);
                        }
                      }}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-100 hover:bg-slate-50 transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500">
                          <MapPin className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-slate-800">{s.name}</span>
                          <span className="text-[8.5px] text-slate-400 font-semibold font-mono uppercase">Mumbai Hub · Local Area</span>
                        </div>
                      </div>
                      <span className={`h-2.5 w-2.5 rounded-full ${statusColor} shadow-sm`} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Mobile Operator sheet */
        <div className="flex md:hidden absolute bottom-4 left-4 right-4 z-20 pointer-events-auto max-h-[60%] overflow-y-auto bg-white/95 border border-slate-200/80 shadow-2xl rounded-[32px] p-5 flex-col gap-3.5 animate-slide-up">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <button
              onClick={() => setMobileTab('map')}
              className={`text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-xl transition-all ${mobileTab === 'map' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-500'}`}
            >
              Telemetry
            </button>
            <button
              onClick={() => setMobileTab('alerts')}
              className={`text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-xl transition-all ${mobileTab === 'alerts' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-500'}`}
            >
              Alerts ({activeAlerts.length})
            </button>
            <button
              onClick={() => setMobileTab('planner')}
              className={`text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-xl transition-all ${mobileTab === 'planner' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-500'}`}
            >
              Planner
            </button>
          </div>

          <div className="overflow-y-auto max-h-[200px] pr-1">
            {mobileTab === 'map' && (
              <div className="flex flex-col gap-2">
                {assets.map(a => (
                  <div key={a.id} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-2xl text-xs shadow-sm">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-slate-800">{a.name}</span>
                      <span className="text-[8.5px] text-slate-400">{a.station_name}</span>
                    </div>
                    <span className={`text-[8.5px] font-bold px-2 py-0.5 rounded border ${a.status === 'healthy' ? 'bg-emerald-50 text-emerald-755 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>{a.status}</span>
                  </div>
                ))}
              </div>
            )}

            {mobileTab === 'alerts' && (
              <div className="flex flex-col gap-2">
                {activeAlerts.length === 0 ? (
                  <span className="text-xs text-slate-500 italic py-4 text-center block">No active alert logs.</span>
                ) : (
                  activeAlerts.map(alert => (
                    <div key={alert.id} className="p-3 bg-white border border-slate-100 rounded-2xl flex flex-col gap-1.5 shadow-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-rose-600">{alert.title}</span>
                        <button
                          onClick={() => resolveAlertMutation.mutate(alert.id)}
                          className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-lg font-bold shadow-sm"
                        >
                          Resolve
                        </button>
                      </div>
                      <p className="text-xs text-slate-650">{alert.message}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {mobileTab === 'planner' && (
              <div className="flex flex-col gap-2">
                {assets.map(a => {
                  const failProb = (a as any).failure_probability !== undefined ? (a as any).failure_probability : 0.0;
                  return (
                    <div key={a.id} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-2xl text-xs shadow-sm">
                      <span className="font-bold text-slate-800">{a.name}</span>
                      <span className="font-mono text-rose-600 font-bold">Risk: {(failProb * 100).toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer on desktop */}
      <footer className="hidden md:flex w-full border-t border-slate-200/60 py-4 text-center text-[9px] text-slate-400 font-mono tracking-widest uppercase z-20 relative bg-slate-50/50">
        Mumbai Operations Intelligent Desk · Responsive swyft layout v1.0
      </footer>
    </div>
  );
}
