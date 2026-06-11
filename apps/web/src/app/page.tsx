'use strict';
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
  Filter
} from 'lucide-react';
import { Infrastructure, Alert } from '@transitiq/types';
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
    setFilterType
  } = useTransitStore();

  // Local state for reporting modal / form
  const [isReporting, setIsReporting] = useState(false);
  const [reportForm, setReportForm] = useState({
    infrastructure_id: '',
    description: '',
    severity: 'medium'
  });
  const [successMsg, setSuccessMsg] = useState('');

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
  const assetsAtRisk = computeAssetsAtRisk(assets);
  const sortedOperatorAssets = sortAssetsByRisk(assets as InfrastructureWithHealth[]);
  const assetHealthTrend = buildAssetHealthTrend(selectedAssetDetails?.data?.history || []);

  // Auto-set the first asset when none selected
  useEffect(() => {
    if (assets.length > 0 && !selectedAssetId) {
      setSelectedAssetId(assets[0].id);
    }
  }, [assets, selectedAssetId, setSelectedAssetId]);

  // Derived Stations list for drop downs and map
  const stations = [
    { id: 'st_cst', name: 'CSMT', lng: 72.8355, lat: 18.9402 },
    { id: 'st_dadar', name: 'Dadar', lng: 72.8424, lat: 19.0180 },
    { id: 'st_andheri', name: 'Andheri', lng: 72.8464, lat: 19.1197 },
    { id: 'st_kurla', name: 'Kurla', lng: 72.8890, lat: 19.0728 },
    { id: 'st_ghatkopar', name: 'Ghatkopar', lng: 72.9081, lat: 19.0856 },
    { id: 'st_thane', name: 'Thane', lng: 72.9781, lat: 19.2183 },
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

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportForm.infrastructure_id || !reportForm.description) {
      alert('Please select an asset and write a description.');
      return;
    }
    reportMutation.mutate({
      infrastructure_id: reportForm.infrastructure_id,
      user_id: 'usr_demo_1', // Demo commuter user ID
      description: reportForm.description,
      severity: reportForm.severity
    });
  };

  return (
    <div className={`flex flex-col ${viewMode === 'operator' ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      {/* Premium Header */}
      <header className={`glass-panel z-40 w-full px-6 py-4 flex items-center justify-between border-b border-slate-800 ${viewMode === 'operator' ? 'shrink-0' : 'sticky top-0'}`}>
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-violet-600 to-indigo-500 p-2 rounded-xl text-white shadow-lg shadow-violet-500/20">
            <Activity className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Transit Infrastructure Intelligence
            </h1>
            <p className="text-[10px] text-violet-400 font-mono tracking-widest uppercase">
              Predictive Monitoring Platform
            </p>
          </div>
        </div>

        {/* View Switcher and Demo Actions */}
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('commuter')}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'commuter'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Commuter App
            </button>
            <button
              onClick={() => setViewMode('operator')}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'operator'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Operator Dashboard
            </button>
          </div>

          <button 
            onClick={() => { refetchInfra(); refetchAlerts(); refetchSummary(); refetchHealthTrend(); }}
            className="p-2 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-400 hover:text-white transition-all"
            title="Force refresh backend data"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          {/* User Profile Mock */}
          <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
            <div className="bg-slate-800 h-8 w-8 rounded-full flex items-center justify-center border border-slate-700 text-slate-300">
              <UserIcon className="h-4 w-4" />
            </div>
            <span className="text-xs text-slate-400 hidden md:inline-block font-mono">usr_demo_1</span>
          </div>
        </div>
      </header>

      {/* Main Layout Container */}
      <main className={`flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 gap-6 ${viewMode === 'operator' ? 'min-h-0 overflow-y-auto' : ''}`}>
        
        {/* COMMUTER VIEW */}
        {viewMode === 'commuter' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column - Map and Quick Filters (8/12 grid) */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              {/* Map Panel */}
              <div className="glass-panel rounded-2xl p-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Compass className="h-4 w-4 text-violet-400" />
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                      Mumbai Transit Network Map
                    </h2>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    Click a station to filter assets
                  </span>
                </div>

                {/* MapLibre Map Container */}
                <div className="relative w-full h-[400px] bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden">
                  <TransitMap
                    stations={stations}
                    selectedStationId={selectedStationId}
                    onStationClick={(stationId) =>
                      setSelectedStationId(selectedStationId === stationId ? null : stationId)
                    }
                    getStationStatusColor={getStationStatusColor}
                  />

                  {/* Floating Map Info */}
                  <div className="absolute bottom-3 right-3 z-10 bg-slate-950/90 border border-slate-800 rounded-lg p-2.5 flex flex-col gap-1.5 text-[10px] font-mono text-slate-400 pointer-events-none">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span>All Infrastructure Healthy</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      <span>Warning (Downtime/Slowing)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      <span>Critical (Shutdown/Outage)</span>
                    </div>
                  </div>
                </div>

                {/* Quick Filters */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold uppercase block mb-1">Asset Status</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300"
                    >
                      <option value="all">All Statuses</option>
                      <option value="healthy">Healthy Only</option>
                      <option value="warning">Warning Only</option>
                      <option value="critical">Critical Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold uppercase block mb-1">Asset Type</label>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300"
                    >
                      <option value="all">All Types</option>
                      <option value="escalator">Escalators</option>
                      <option value="elevator">Elevators</option>
                      <option value="bus_stop">Bus Stops</option>
                      <option value="charger">EV Chargers</option>
                      <option value="footbridge">Footbridges</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold uppercase block mb-1">Station Filter</label>
                    <select
                      value={selectedStationId || ''}
                      onChange={(e) => setSelectedStationId(e.target.value || null)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300"
                    >
                      <option value="">All Stations</option>
                      <option value="st_cst">CSMT</option>
                      <option value="st_dadar">Dadar</option>
                      <option value="st_andheri">Andheri</option>
                      <option value="st_kurla">Kurla</option>
                      <option value="st_ghatkopar">Ghatkopar</option>
                      <option value="st_thane">Thane</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => { setSelectedStationId(null); setFilterStatus('all'); setFilterType('all'); setSearchQuery(''); }}
                      className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white px-3 py-1.5 rounded-lg text-xs transition-all"
                    >
                      Reset All Filters
                    </button>
                  </div>
                </div>

              </div>

              {/* Assets List */}
              <div className="glass-panel rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                    Infrastructure Assets ({filteredAssets.length})
                  </h3>
                  <div className="relative max-w-xs w-full">
                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search assets..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-300 w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                  {isInfraLoading ? (
                    <div className="col-span-2 text-center py-8 text-xs text-slate-500">Loading infrastructure list...</div>
                  ) : filteredAssets.length === 0 ? (
                    <div className="col-span-2 text-center py-8 text-xs text-slate-500">No assets match your search parameters.</div>
                  ) : (
                    filteredAssets.map((asset) => (
                      <button
                        key={asset.id}
                        onClick={() => setSelectedAssetId(asset.id)}
                        className={`flex items-center justify-between p-3 rounded-xl transition-all text-left ${
                          selectedAssetId === asset.id
                            ? 'bg-violet-950/40 border border-violet-600 shadow-md'
                            : 'bg-slate-900/50 hover:bg-slate-900 border border-slate-800'
                        }`}
                      >
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-semibold text-slate-200">{asset.name}</span>
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                            {asset.station_name} • {asset.type.replace('_', ' ')}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          asset.status === 'healthy' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          asset.status === 'warning' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse'
                        }`}>
                          {asset.status}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Right Column - Detail Card & Reporting (4/12 grid) */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              
              {/* Asset Detail Card */}
              {currentAsset && (
                <div className="glass-panel rounded-2xl p-6 flex flex-col gap-6 sticky top-24">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] text-violet-400 font-semibold uppercase tracking-wider block">
                        Asset Profile Details
                      </span>
                      <h2 className="text-lg font-bold text-slate-200">{currentAsset.name}</h2>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-500" />
                        {currentAsset.station_name} Station
                      </p>
                    </div>

                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase ${
                      currentAsset.status === 'healthy' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      currentAsset.status === 'warning' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-red-500/20 text-red-400 border border-red-500/30 glow-critical'
                    }`}>
                      {currentAsset.status}
                    </span>
                  </div>

                  {/* Circular Reliability Score Gauge */}
                  <div className="bg-slate-900/60 rounded-xl p-4 flex items-center justify-between border border-slate-800">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-300">Reliability Index</span>
                      <span className="text-[10px] text-slate-500 block max-w-[140px] mt-0.5">
                        Calculated from reports, user feedback, and maintenance intervals.
                      </span>
                    </div>

                    {/* Circular Score representation */}
                    <div className="relative h-20 w-20 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-95" viewBox="0 0 36 36">
                        <path
                          className="text-slate-800"
                          strokeWidth="3.5"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className={`${
                            (currentAsset as any).score >= 80 ? 'text-emerald-500' :
                            (currentAsset as any).score >= 50 ? 'text-amber-500' :
                            'text-red-500'
                          }`}
                          strokeDasharray={`${(currentAsset as any).score || 100}, 100`}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-base font-extrabold tracking-tight">
                          {(currentAsset as any).score !== undefined ? (currentAsset as any).score : 100}
                        </span>
                        <span className="text-[10px] text-slate-500 block -mt-1">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Prediction Window */}
                  {(currentAsset as any).predicted_failure_time && (
                    <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl flex items-center gap-3">
                      <Clock className="h-5 w-5 text-red-400" />
                      <div>
                        <span className="text-[10px] text-red-400 font-semibold block uppercase">Failure Probability Warning</span>
                        <span className="text-xs text-slate-300 font-semibold">
                          Expected failure window within 48-72 hours.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Per-asset health trend */}
                  {assetHealthTrend.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Health Trend
                      </span>
                      <HealthTrendChart data={assetHealthTrend} compact />
                    </div>
                  )}

                  {/* Maintenance Log */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Asset History
                    </span>
                    <div className="flex items-center justify-between text-xs font-mono bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/60">
                      <span className="text-slate-400">Last Maintenance:</span>
                      <span className="text-slate-300">{new Date(currentAsset.last_maintenance).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Citizens report stream */}
                  <div className="flex flex-col gap-3">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Recent Commuter Feedback
                    </span>
                    
                    <div className="flex flex-col gap-2 max-h-[140px] overflow-y-auto pr-1">
                      {selectedAssetDetails?.data?.recentReports?.length === 0 ? (
                        <span className="text-xs text-slate-500 italic py-2">No issue reports logged.</span>
                      ) : (
                        (selectedAssetDetails?.data?.recentReports || []).map((rep: any) => (
                          <div key={rep.id} className="bg-slate-900/30 border border-slate-800/40 p-2.5 rounded-lg flex flex-col gap-1">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="text-slate-400 font-semibold">{rep.user_name || 'Anonymous User'}</span>
                              <span className={`px-1 rounded text-[8px] uppercase ${
                                rep.severity === 'high' ? 'bg-red-500/10 text-red-400' :
                                rep.severity === 'medium' ? 'bg-amber-500/10 text-amber-400' :
                                'bg-sky-500/10 text-sky-400'
                              }`}>
                                {rep.severity}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300">{rep.description}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* File a Report CTA */}
                  <div className="border-t border-slate-800 pt-4">
                    {isReporting ? (
                      <form onSubmit={handleReportSubmit} className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold uppercase text-slate-300">Submit Issue Report</h3>
                          <button 
                            type="button" 
                            onClick={() => setIsReporting(false)} 
                            className="text-[10px] text-slate-500 hover:text-slate-300 font-mono"
                          >
                            Cancel
                          </button>
                        </div>
                        
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">Issue Severity</label>
                          <div className="grid grid-cols-3 gap-2">
                            {['low', 'medium', 'high'].map((sev) => (
                              <button
                                key={sev}
                                type="button"
                                onClick={() => setReportForm({ ...reportForm, severity: sev })}
                                className={`px-2 py-1 rounded text-xs capitalize transition-all ${
                                  reportForm.severity === sev 
                                    ? 'bg-violet-600 text-white font-bold' 
                                    : 'bg-slate-950 text-slate-400 border border-slate-850 hover:bg-slate-900'
                                }`}
                              >
                                {sev}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">Description</label>
                          <textarea
                            placeholder="Detail what is malfunctioning (e.g. escalator stopped, makes noise)..."
                            value={reportForm.description}
                            onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                            rows={3}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-violet-600"
                            required
                          />
                        </div>

                        {successMsg ? (
                          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg text-center">
                            {successMsg}
                          </div>
                        ) : (
                          <button
                            type="submit"
                            disabled={reportMutation.isPending}
                            className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 text-white font-semibold py-2 rounded-lg text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-violet-600/20"
                          >
                            {reportMutation.isPending ? 'Queuing Agent Pipeline...' : 'Submit to verification queue'}
                          </button>
                        )}
                      </form>
                    ) : (
                      <button
                        onClick={() => {
                          setReportForm({ ...reportForm, infrastructure_id: currentAsset.id });
                          setIsReporting(true);
                        }}
                        className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
                      >
                        <PlusCircle className="h-4 w-4 text-violet-400" />
                        Report a Malfunction with this Asset
                      </button>
                    )}
                  </div>

                </div>
              )}

            </div>

          </div>
        )}

        {/* OPERATOR DASHBOARD VIEW */}
        {viewMode === 'operator' && (
          <div className="flex flex-col gap-6">
            
            {/* Metric Scorecards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              <div className="glass-panel rounded-2xl p-5 flex items-center justify-between shadow-sm">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Assets</span>
                  <span className="text-2xl font-bold tracking-tight mt-1 text-slate-100">{summary.totalInfrastructure}</span>
                  <span className="text-[10px] text-slate-500 mt-1">Across 6 Mumbai Hubs</span>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl text-violet-400 border border-slate-800">
                  <MapPin className="h-5 w-5" />
                </div>
              </div>

              <div className="glass-panel rounded-2xl p-5 flex items-center justify-between shadow-sm">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Active Alerts</span>
                  <span className="text-2xl font-bold tracking-tight mt-1 text-red-400">{summary.activeAlerts}</span>
                  <span className="text-[10px] text-red-500 mt-1">{activeAlerts.length} unresolved</span>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl text-red-400 border border-slate-800">
                  <ShieldAlert className="h-5 w-5" />
                </div>
              </div>

              <div className="glass-panel rounded-2xl p-5 flex items-center justify-between shadow-sm">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Critical Failures</span>
                  <span className="text-2xl font-bold tracking-tight mt-1 text-amber-500">{summary.criticalAssets}</span>
                  <span className="text-[10px] text-amber-500/70 mt-1">{assetsAtRisk} total at risk</span>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl text-amber-500 border border-slate-800">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </div>

              <div className="glass-panel rounded-2xl p-5 flex items-center justify-between shadow-sm">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Avg Reliability</span>
                  <span className="text-2xl font-bold tracking-tight mt-1 text-emerald-400">
                    {summary.averageReliability}%
                  </span>
                  <span className="text-[10px] text-emerald-500/70 mt-1">Overall infrastructure health</span>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl text-emerald-400 border border-slate-800">
                  <CheckCircle className="h-5 w-5" />
                </div>
              </div>

            </div>

            {/* Main Dashboard Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Alert Feed (5/12 grid) */}
              <div className="lg:col-span-5 flex flex-col gap-4 glass-panel rounded-2xl p-6">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                    Operator Dispatch Alert Feed ({activeAlerts.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Critical alerts auto-generated by Prediction Agents.
                  </p>
                </div>

                <div className="flex flex-col gap-4 overflow-y-auto max-h-[500px] pr-1">
                  {activeAlerts.length === 0 ? (
                    <div className="text-center py-16 bg-slate-900/30 rounded-xl border border-slate-800 flex flex-col items-center gap-2">
                      <CheckCircle className="h-8 w-8 text-emerald-500" />
                      <span className="text-xs text-slate-500 font-semibold">No active warnings or failures reported.</span>
                    </div>
                  ) : (
                    activeAlerts.map((alert) => (
                      <div 
                        key={alert.id} 
                        className={`p-4 rounded-xl border flex flex-col gap-3 bg-slate-900/50 ${
                          alert.severity === 'critical' ? 'border-red-500/20 glow-critical' : 'border-amber-500/20'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase mr-2 ${
                              alert.severity === 'critical' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {alert.severity}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(alert.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                          <button
                            onClick={() => resolveAlertMutation.mutate(alert.id)}
                            disabled={resolveAlertMutation.isPending}
                            className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-white border border-emerald-500/20 text-[10px] font-bold px-2.5 py-1 rounded transition-all flex items-center gap-1"
                          >
                            <Wrench className="h-3 w-3" />
                            Resolve & Reset
                          </button>
                        </div>

                        <div className="flex flex-col gap-1">
                          <h4 className="text-xs font-bold text-slate-200">{alert.title}</h4>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[9px] text-slate-500 uppercase font-mono">
                              {alert.asset_name} • {alert.station_name} Station
                            </span>
                            {alert.failure_probability !== undefined && (
                              <span className="font-mono text-[10px] font-bold text-red-400">
                                {Math.round(alert.failure_probability * 100)}% fail risk
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{alert.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Assets predictions and status (7/12 grid) */}
              <div className="lg:col-span-7 flex flex-col gap-4 glass-panel rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                      Predictive Maintenance Schedule
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      All assets graded by failure likelihood.
                    </p>
                  </div>

                  <div className="text-[10px] font-mono text-violet-400 bg-violet-950/20 border border-violet-800/30 px-2 py-1 rounded">
                    Queue consumer processing reports live
                  </div>
                </div>

                {/* Table list */}
                <div className="max-h-[500px] overflow-y-auto overflow-x-auto border border-slate-800 rounded-xl bg-slate-900/20">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead className="sticky top-0 z-10">
                      <tr className="border-b border-slate-800 text-slate-500 font-mono text-[9px] uppercase tracking-wider bg-slate-900/50">
                        <th className="p-3">Asset</th>
                        <th className="p-3">Station</th>
                        <th className="p-3">Health Index</th>
                        <th className="p-3">Fail Probability</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Est. Failure</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {isInfraLoading ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500">Loading schedules...</td>
                        </tr>
                      ) : assets.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500">No assets in database.</td>
                        </tr>
                      ) : (
                        sortedOperatorAssets.map((asset) => {
                          const score = asset.score !== undefined ? asset.score : 100;
                          const failProb = asset.failure_probability !== undefined ? asset.failure_probability : 0.0;
                          const estFail = asset.predicted_failure_time;

                          return (
                            <tr key={asset.id} className="hover:bg-slate-900/40 transition-colors">
                              <td className="p-3">
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-semibold text-slate-300">{asset.name}</span>
                                  <span className="text-[9px] text-slate-500 capitalize">{asset.type.replace('_', ' ')}</span>
                                </div>
                              </td>
                              <td className="p-3 text-slate-400 font-medium">{asset.station_name}</td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <div className="h-1.5 w-16 bg-slate-800 rounded-full overflow-hidden">
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
                              <td className={`p-3 font-mono font-semibold ${getFailureProbabilityColor(failProb)}`}>
                                {(failProb * 100).toFixed(0)}%
                              </td>
                              <td className="p-3">
                                <StatusBadge status={asset.status} />
                              </td>
                              <td className="p-3">
                                {estFail ? (
                                  <span className="text-red-400 font-semibold flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {/* Parse estimated hour gap from ISO string */}
                                    {Math.ceil((new Date(estFail).getTime() - Date.now()) / (1000 * 60 * 60))} hrs
                                  </span>
                                ) : (
                                  <span className="text-slate-500 font-mono">Stable</span>
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

            {/* Analytics Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8">
                <HealthTrendChart data={healthTrendData} isLoading={isHealthTrendLoading} />
              </div>
              <div className="lg:col-span-4">
                <RiskDistributionChart data={riskDistribution} />
              </div>
            </div>

            <TypeBreakdownChart data={typeBreakdown} />

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className={`w-full border-t border-slate-900 py-6 text-center text-[10px] text-slate-600 font-mono ${viewMode === 'operator' ? 'shrink-0' : 'mt-12'}`}>
        Transit Infrastructure Intelligence • Hackathon Foundation Starter v1.0.0
      </footer>
    </div>
  );
}
