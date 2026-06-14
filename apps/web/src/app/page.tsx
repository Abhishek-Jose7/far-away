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
  ChevronLeft,
  Building,
  CheckSquare,
  List,
  Star,
  UserCheck
} from 'lucide-react';
import { Infrastructure, Alert, Report } from '@transitiq/types';
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
    setCurrentUser,
    activeCommuterScreen,
    setActiveCommuterScreen,
    selectedFacilityId,
    setSelectedFacilityId
  } = useTransitStore();

  // Local state for reporting / feedback
  const [reportForm, setReportForm] = useState({
    category: 'toilet',
    location: '',
    description: '',
    severity: 'medium',
    cleanliness_rating: 4
  });
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

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

  const { data: reportsResponse, refetch: refetchReports } = useQuery({
    queryKey: ['reports'],
    queryFn: api.getReports
  });

  // 2. Mutations
  const reportMutation = useMutation({
    mutationFn: api.submitReport,
    onSuccess: () => {
      setSuccessMsg('Issue reported successfully! Operator & prediction engine notified.');
      setReportForm({ category: 'toilet', location: '', description: '', severity: 'medium', cleanliness_rating: 4 });
      queryClient.invalidateQueries({ queryKey: ['infrastructure'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      if (selectedAssetId) {
        queryClient.invalidateQueries({ queryKey: ['assetDetails', selectedAssetId] });
      }
      setTimeout(() => {
        setSuccessMsg('');
        setActiveCommuterScreen('tracking');
      }, 2000);
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

  const assignReportMutation = useMutation({
    mutationFn: ({ reportId, assignee }: { reportId: string; assignee: string }) => 
      api.assignReport(reportId, assignee),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
    onError: (err: any) => {
      alert(`Failed to assign: ${err.message}`);
    }
  });

  const resolveReportMutation = useMutation({
    mutationFn: api.resolveReportComplaint,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['infrastructure'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      if (selectedAssetId) {
        queryClient.invalidateQueries({ queryKey: ['assetDetails', selectedAssetId] });
      }
    },
    onError: (err: any) => {
      alert(`Failed to resolve complaint: ${err.message}`);
    }
  });

  // Extract assets, alerts, and reports array
  const assets: Infrastructure[] = infraResponse?.data || [];
  const activeAlerts: Alert[] = (alertsResponse?.data || []).filter((a: Alert) => a.resolved === 0);
  const reports: Report[] = reportsResponse?.data || [];

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

  // Derived Stations list for map & sidebar
  const stations = [
    { id: 'st_cst', name: 'CSMT Hub', lng: 72.8353, lat: 18.9400, address: 'Chhatrapati Shivaji Maharaj Terminus, Fort, Mumbai, 400001' },
    { id: 'st_dadar', name: 'Dadar Junction', lng: 72.8478, lat: 19.0178, address: 'Dadar East Station Rd, Dadar East, Mumbai, 400014' },
    { id: 'st_andheri', name: 'Andheri Central', lng: 72.8468, lat: 19.1197, address: 'Andheri Station West, Railway Colony, Mumbai, 400069' },
    { id: 'st_kurla', name: 'Kurla Interchange', lng: 72.8797, lat: 19.0652, address: 'Kurla West Station Rd, Brahmanwadi, Kurla, Mumbai, 400070' },
    { id: 'st_ghatkopar', name: 'Ghatkopar Station', lng: 72.9082, lat: 19.0860, address: 'Ghatkopar East Station Rd, Pant Nagar, Mumbai, 400075' },
    { id: 'st_thane', name: 'Thane Terminus', lng: 72.9759, lat: 19.1860, address: 'Thane West Railway Station Rd, Thane, Maharashtra, 400601' },
  ];

  // Helper to dynamically calculate station status text and color
  const getStationStatus = (stationId: string) => {
    const stationAssets = assets.filter(a => a.station_id === stationId);
    const stationReports = reports.filter(r => r.status !== 'resolved' && assets.some(a => a.id === r.infrastructure_id && a.station_id === stationId));

    if (stationAssets.some(a => a.status === 'critical') || stationReports.some(r => r.severity === 'high')) {
      return { text: 'Major Issue Reported', color: 'bg-rose-500 text-white', dot: 'bg-rose-500' };
    }
    if (stationAssets.some(a => a.status === 'warning') || stationReports.length > 0) {
      const issuesCount = stationReports.length || 1;
      return { text: `${issuesCount} Active Issue${issuesCount > 1 ? 's' : ''}`, color: 'bg-amber-500 text-white', dot: 'bg-amber-500' };
    }
    return { text: 'Operational', color: 'bg-emerald-500 text-white', dot: 'bg-emerald-500' };
  };

  const getStationStatusColor = (stationId: string) => {
    const status = getStationStatus(stationId);
    if (status.dot.includes('rose')) return 'bg-red-500';
    if (status.dot.includes('amber')) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  // Filtered stations based on search query (searching either station name or facility name matching types)
  const filteredStations = stations.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const selectedStation = stations.find(s => s.id === selectedStationId);

  // Compute overall health score average for selected station
  const getStationHealth = (stationId: string) => {
    const stationAssets = assets.filter(a => a.station_id === stationId);
    if (stationAssets.length === 0) return 92; // default
    const scores = stationAssets.map(a => {
      // Find latest health score for asset, default to 100
      return (a as any).score !== undefined ? (a as any).score : 100;
    });
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  // Generate facilities status list dynamically from the station's real database assets plus some mock categories
  const getStationFacilities = (stationId: string) => {
    const stationAssets = assets.filter(a => a.station_id === stationId);
    
    // Find active unresolved reports for mock facilities
    const stationReports = reports.filter(r => r.status !== 'resolved' && assets.some(a => a.id === r.infrastructure_id && a.station_id === stationId));

    const getStatusForCategory = (category: string) => {
      const activeCatReports = stationReports.filter(r => r.category === category);
      if (activeCatReports.some(r => r.severity === 'high')) return 'critical';
      if (activeCatReports.length > 0) return 'warning';
      return 'healthy';
    };

    const escalatorStatus = stationAssets.filter(a => a.type === 'escalator').some(a => a.status === 'critical') ? 'critical' :
                            stationAssets.filter(a => a.type === 'escalator').some(a => a.status === 'warning') ? 'warning' : 'healthy';

    const liftStatus = stationAssets.filter(a => a.type === 'elevator').some(a => a.status === 'critical') ? 'critical' :
                       stationAssets.filter(a => a.type === 'elevator').some(a => a.status === 'warning') ? 'warning' : 'healthy';

    const chargerStatus = stationAssets.filter(a => a.type === 'charger').some(a => a.status === 'critical') ? 'critical' :
                          stationAssets.filter(a => a.type === 'charger').some(a => a.status === 'warning') ? 'warning' : 'healthy';

    return [
      { id: 'toilet', name: 'Public Toilet', status: getStatusForCategory('toilet'), rating: '4.1/5', lastVerified: '12 mins ago' },
      { id: 'water', name: 'Water Fountain', status: getStatusForCategory('water'), rating: '4.5/5', lastVerified: '24 mins ago' },
      { id: 'escalator', name: 'Escalator Feed', status: escalatorStatus, rating: null, lastVerified: '10 mins ago' },
      { id: 'lift', name: 'Accessibility Lift', status: liftStatus, rating: null, lastVerified: '8 mins ago' },
      { id: 'ticket_machine', name: 'Ticketing/EV Charger', status: chargerStatus, rating: null, lastVerified: '30 mins ago' },
    ];
  };

  // Get active issues list for selected station
  const getStationActiveIssues = (stationId: string) => {
    const stationAssets = assets.filter(a => a.station_id === stationId && a.status !== 'healthy');
    const stationReports = reports.filter(r => r.status !== 'resolved' && r.status !== 'pending' && assets.some(a => a.id === r.infrastructure_id && a.station_id === stationId));

    const issues: string[] = [];
    stationAssets.forEach(a => {
      issues.push(`${a.name} - ${a.status === 'critical' ? 'Out of Service' : 'Maintenance in progress'}`);
    });
    stationReports.forEach(r => {
      issues.push(`Public complaint logged on ${r.category}: "${r.description}" (Assigned: ${r.assignee || 'Pending allocation'})`);
    });

    if (issues.length === 0) return ['All systems nominal. No active issues reported.'];
    return issues;
  };

  // Handle report submission
  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Dynamically match facility category to a real asset at this station
    const stationAssets = assets.filter(a => a.station_id === selectedStationId);
    let matchedAsset = stationAssets[0]; // fallback
    
    if (reportForm.category === 'escalator') {
      matchedAsset = stationAssets.find(a => a.type === 'escalator') || matchedAsset;
    } else if (reportForm.category === 'lift') {
      matchedAsset = stationAssets.find(a => a.type === 'elevator') || matchedAsset;
    } else if (reportForm.category === 'charging_point') {
      matchedAsset = stationAssets.find(a => a.type === 'charger') || matchedAsset;
    } else if (reportForm.category === 'footbridge') {
      matchedAsset = stationAssets.find(a => a.type === 'footbridge') || matchedAsset;
    }

    reportMutation.mutate({
      infrastructure_id: matchedAsset.id,
      user_id: currentUser,
      description: reportForm.description,
      severity: reportForm.severity,
      category: reportForm.category,
      location: reportForm.location,
      cleanliness_rating: reportForm.category === 'toilet' || reportForm.category === 'water' ? reportForm.cleanliness_rating : undefined
    });
  };

  // Derived information for the Authority view
  const selectedReport = reports.find(r => r.id === selectedReportId);

  // Authority stats
  const authorityStats = {
    open: reports.filter(r => r.status !== 'resolved').length,
    assigned: reports.filter(r => r.status === 'assigned').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
    pending: reports.filter(r => r.status === 'pending').length
  };

  // Default selection when authority page loads
  useEffect(() => {
    const activeReports = reports.filter(r => r.status !== 'resolved');
    if (activeReports.length > 0 && !selectedReportId) {
      setSelectedReportId(activeReports[0].id);
    }
  }, [reports, selectedReportId]);

  return (
    <div className={`flex flex-col text-slate-800 bg-slate-100/50 relative overflow-hidden select-none ${viewMode !== 'commuter' ? 'h-screen' : 'min-h-screen'}`}>
      
      {/* Floating Header on Desktop */}
      <header className="hidden md:flex glass-panel sticky top-4 left-4 right-4 z-30 mx-4 mt-4 px-6 py-4 items-center justify-between border border-slate-200/50 rounded-3xl shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-orange-500 to-amber-500 p-2.5 rounded-2xl text-white shadow-md shadow-orange-500/25 ring-1 ring-white/20">
            <Activity className="h-5.5 w-5.5 animate-pulse text-white" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
              TransitIQ
              <span className="text-[9px] bg-orange-500/10 text-orange-600 border border-orange-500/20 px-2 py-0.5 rounded-full font-mono font-bold tracking-wider">OS V1.1</span>
            </h1>
            <p className="text-[9px] text-orange-650 font-mono tracking-widest uppercase mt-0.5">
              Public Infrastructure Operating System
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
                setActiveCommuterScreen('home');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all ${
                viewMode === 'commuter'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Citizen App
            </button>
            <button
              onClick={() => {
                setViewMode('operator');
                setCurrentUser('usr_3'); // Switch to operator Vikram Singh
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all ${
                viewMode === 'operator'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Operator Control
            </button>
            <button
              onClick={() => {
                setViewMode('authority');
                setCurrentUser('usr_5'); // Switch to operator/admin Abhishek Patil
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all ${
                viewMode === 'authority'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Authority Desk
            </button>
          </div>

          <button 
            onClick={() => { 
              refetchInfra(); 
              refetchAlerts(); 
              refetchSummary(); 
              refetchReports();
              if (viewMode === 'operator') refetchHealthTrend(); 
            }}
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
              <option value="usr_4">usr_demo_4 (Amit - Tech)</option>
              <option value="usr_5">usr_demo_5 (Abhishek - Authority)</option>
            </select>
          </div>
        </div>
      </header>

      {/* Floating Header on Mobile */}
      <div className="flex md:hidden absolute top-4 left-4 right-4 z-30 justify-between items-center px-2 pointer-events-none">
        <button
          onClick={() => {
            if (viewMode === 'commuter') {
              if (activeCommuterScreen === 'station') setActiveCommuterScreen('home');
              else if (activeCommuterScreen === 'facility') setActiveCommuterScreen('station');
              else if (activeCommuterScreen === 'report') setActiveCommuterScreen('facility');
              else if (activeCommuterScreen === 'tracking') setActiveCommuterScreen('home');
              else setSelectedStationId(null);
            }
          }}
          className="h-11 w-11 rounded-full bg-white/95 border border-slate-200/80 shadow-lg flex items-center justify-center text-slate-800 pointer-events-auto active:scale-90 transition-all"
        >
          <ChevronLeft className="h-6 w-6 text-slate-850" />
        </button>

        <div className="bg-white/95 border border-slate-200/80 px-5 py-2.5 rounded-2xl shadow-lg backdrop-blur-md flex items-center gap-2 pointer-events-auto">
          <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
          <span className="text-sm font-extrabold tracking-wider text-orange-550 font-sans">transit.iq</span>
        </div>

        <div className="h-11 w-11 pointer-events-none" />
      </div>

      {/* Main Section */}
      <main className={`flex-1 w-full max-w-[1400px] mx-auto px-4 md:px-6 pb-6 mt-4 z-10 relative flex flex-col gap-6 pointer-events-none ${viewMode !== 'commuter' ? 'overflow-y-auto' : 'h-[calc(100vh-140px)] md:flex-row'}`}>
        
        {viewMode === 'commuter' && (
          <>
            {/* Citizen Left Sidebar Navigation Panel */}
            <div className="hidden md:flex w-[420px] flex-col gap-4 glass-panel rounded-3xl p-5 shadow-xl border border-slate-200/50 pointer-events-auto overflow-y-auto shrink-0 animate-slide-up">
              
              {/* SCREEN 1: HOME SCREEN */}
              {activeCommuterScreen === 'home' && (
                <div className="flex flex-col gap-4 h-full">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900">Nearby Infrastructure</h2>
                      <p className="text-[10px] text-slate-500 font-semibold font-mono tracking-wider mt-0.5">MUMBAI METRO & RAILWAY</p>
                    </div>
                    <button 
                      onClick={() => setActiveCommuterScreen('tracking')}
                      className="text-[10px] bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl font-extrabold text-orange-655 flex items-center gap-1 hover:bg-slate-200"
                    >
                      <List className="h-3.5 w-3.5" />
                      Track Reports
                    </button>
                  </div>

                  {/* Search station or facility */}
                  <div className="relative w-full">
                    <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4.5 w-4.5 text-orange-500" />
                    <input
                      type="text"
                      placeholder="Search transit station or facility..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-xs text-slate-800 w-full focus:outline-none focus:border-orange-500 font-semibold"
                    />
                  </div>

                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1 mt-1">Transit Hubs</span>
                  
                  {/* Station List */}
                  <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[420px] pr-1">
                    {filteredStations.length === 0 ? (
                      <span className="text-xs text-slate-500 italic py-4 text-center">No stations found.</span>
                    ) : (
                      filteredStations.map(st => {
                        const status = getStationStatus(st.id);
                        return (
                          <div
                            key={st.id}
                            onClick={() => {
                              setSelectedStationId(st.id);
                              setActiveCommuterScreen('station');
                            }}
                            className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 hover:border-slate-200/80 transition-all shadow-sm cursor-pointer hover:shadow"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-11 w-11 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500">
                                <MapPin className="h-5.5 w-5.5" />
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-extrabold text-slate-900">{st.name}</span>
                                <span className="text-[8.5px] text-slate-400 font-semibold">Mumbai Hub · Local Area</span>
                              </div>
                            </div>
                            <span className={`text-[8px] font-bold px-2 py-0.7 rounded-full uppercase tracking-wider ${
                              status.color.includes('emerald') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              status.color.includes('amber') ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                              'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {status.text}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* SCREEN 2: STATION DETAILS */}
              {activeCommuterScreen === 'station' && selectedStation && (
                <div className="flex flex-col gap-4 h-full">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <button 
                      onClick={() => setActiveCommuterScreen('home')}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900">{selectedStation.name}</h2>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">STATION INFRASTRUCTURE PAGE</p>
                    </div>
                  </div>

                  {/* Health gauge */}
                  <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-slate-800">Station Health Index</span>
                      <span className="text-[10px] text-slate-500 leading-relaxed block max-w-[200px] font-semibold">
                        Overall operational score computed from all active assets.
                      </span>
                    </div>
                    <div className="relative h-16 w-16 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path className="text-slate-200" strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path className="text-orange-500" strokeDasharray={`${getStationHealth(selectedStation.id)}, 100`} strokeWidth="3.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      </svg>
                      <span className="absolute text-xs font-mono font-bold text-slate-800">{getStationHealth(selectedStation.id)}%</span>
                    </div>
                  </div>

                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1 mt-1">Facilities</span>

                  {/* Facilities list */}
                  <div className="flex flex-col gap-2 overflow-y-auto max-h-[280px]">
                    {getStationFacilities(selectedStation.id).map(f => (
                      <div
                        key={f.id}
                        onClick={() => {
                          setSelectedFacilityId(f.id);
                          setActiveCommuterScreen('facility');
                        }}
                        className="flex justify-between items-center p-3 bg-white border border-slate-100 hover:border-slate-200/80 rounded-2xl cursor-pointer shadow-sm hover:shadow"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-slate-850">{f.name}</span>
                          <span className="text-[8px] text-slate-400 font-mono">Last Verified: {f.lastVerified}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {f.rating && (
                            <span className="text-[9px] bg-amber-50 text-amber-700 font-bold border border-amber-200 px-2 py-0.5 rounded-lg flex items-center gap-0.5">
                              <Star className="h-2.5 w-2.5 text-amber-500 fill-amber-500" />
                              {f.rating}
                            </span>
                          )}
                          <span className={`text-[8px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border ${
                            f.status === 'healthy' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            f.status === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {f.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Active issues checklist */}
                  <div className="mt-2 flex flex-col gap-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">Active Station Issues</span>
                    <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-2xl flex flex-col gap-1.5 max-h-[140px] overflow-y-auto">
                      {getStationActiveIssues(selectedStation.id).map((issue, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-[10.5px] leading-relaxed text-slate-700">
                          <AlertTriangle className="h-3.5 w-3.5 text-orange-500 shrink-0 mt-0.5" />
                          <span className="font-semibold">{issue}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SCREEN 3: FACILITY PAGE */}
              {activeCommuterScreen === 'facility' && selectedStation && selectedFacilityId && (
                <div className="flex flex-col gap-4 h-full">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <button 
                      onClick={() => setActiveCommuterScreen('station')}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900">
                        {selectedFacilityId === 'toilet' ? 'Platform Toilet Block' : 
                         selectedFacilityId === 'water' ? 'Platform Water Fountain' : 
                         selectedFacilityId === 'escalator' ? 'Station Escalators' :
                         selectedFacilityId === 'lift' ? 'Accessibility Lifts' : 'Ticketing Machine Port'}
                      </h2>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{selectedStation.name}</p>
                    </div>
                  </div>

                  {/* Details block */}
                  <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl flex flex-col gap-3 shadow-sm">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-slate-500">Operation Status:</span>
                      <span className="font-bold text-emerald-600">Active / Operational</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-slate-500">Last Cleaned / Checked:</span>
                      <span className="font-bold text-slate-700">12 minutes ago</span>
                    </div>
                    {(selectedFacilityId === 'toilet' || selectedFacilityId === 'water') && (
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-slate-500">Average Cleanliness Score:</span>
                        <span className="font-bold text-amber-700 flex items-center gap-0.5">
                          <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                          {selectedFacilityId === 'toilet' ? '4.1/5' : '4.5/5'}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-slate-500">Total Commuter Reports (24h):</span>
                      <span className="font-bold text-slate-700">
                        {reports.filter(r => r.category === selectedFacilityId && r.status !== 'resolved').length} reports
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-orange-50/50 border border-orange-200/60 rounded-2xl flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-orange-655 uppercase tracking-wide">Notice to Commuters</span>
                    <p className="text-[11.5px] leading-relaxed text-slate-700 font-medium">
                      TransitIQ predicts maintenance dispatches automatically based on passenger telemetry. Help keeping the infrastructure healthy by reporting broken facilities.
                    </p>
                  </div>

                  {/* Trigger Action */}
                  <button
                    onClick={() => {
                      setReportForm({
                        category: selectedFacilityId,
                        location: 'Platform 3',
                        description: '',
                        severity: 'medium',
                        cleanliness_rating: 4
                      });
                      setActiveCommuterScreen('report');
                    }}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-2xl text-xs transition-all shadow-md shadow-orange-500/20 mt-auto flex items-center justify-center gap-1.5"
                  >
                    <PlusCircle className="h-4.5 w-4.5" />
                    Report Issue / Complaint
                  </button>
                </div>
              )}

              {/* SCREEN 4: REPORT ISSUE FORM */}
              {activeCommuterScreen === 'report' && selectedStation && (
                <div className="flex flex-col gap-4 h-full">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <button 
                      onClick={() => setActiveCommuterScreen('facility')}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900">Report Broken Infrastructure</h2>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{selectedStation.name}</p>
                    </div>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleReportSubmit} className="flex flex-col gap-3.5">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Facility Category</label>
                      <select
                        value={reportForm.category}
                        onChange={(e) => setReportForm({ ...reportForm, category: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none"
                      >
                        <option value="toilet">Toilet Block</option>
                        <option value="escalator">Escalator</option>
                        <option value="lift">Lift / Elevator</option>
                        <option value="water">Water Fountain</option>
                        <option value="footbridge">Skywalk / Footbridge</option>
                        <option value="charging_point">EV Charging Station</option>
                        <option value="lighting">Lighting System</option>
                        <option value="safety">Security / Safety</option>
                        <option value="other">Other Facilities</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Severity</label>
                        <select
                          value={reportForm.severity}
                          onChange={(e) => setReportForm({ ...reportForm, severity: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none"
                        >
                          <option value="low">Low (Minor Glitch)</option>
                          <option value="medium">Medium (Impaired)</option>
                          <option value="high">High (Broken/Stopped)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Location Details</label>
                        <input
                          type="text"
                          placeholder="e.g. Platform 3 near Stairs"
                          value={reportForm.location}
                          onChange={(e) => setReportForm({ ...reportForm, location: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none"
                        />
                      </div>
                    </div>

                    {(reportForm.category === 'toilet' || reportForm.category === 'water') && (
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">
                          Cleanliness Score: {reportForm.cleanliness_rating}/5
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min="1"
                            max="5"
                            value={reportForm.cleanliness_rating}
                            onChange={(e) => setReportForm({ ...reportForm, cleanliness_rating: parseInt(e.target.value) })}
                            className="w-full accent-orange-500 cursor-pointer"
                          />
                          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">Stars</span>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Description</label>
                      <textarea
                        rows={3}
                        placeholder="Please describe the malfunction details..."
                        value={reportForm.description}
                        onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-semibold focus:outline-none focus:border-orange-500"
                        required
                      />
                    </div>

                    {successMsg ? (
                      <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs rounded-xl text-center font-bold">{successMsg}</div>
                    ) : (
                      <button
                        type="submit"
                        disabled={reportMutation.isPending}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-2xl text-xs transition-all shadow-md shadow-orange-500/20 active:scale-98"
                      >
                        {reportMutation.isPending ? 'Queuing report...' : 'Submit Report'}
                      </button>
                    )}
                  </form>
                </div>
              )}

              {/* SCREEN 5: TRACKING PAGE */}
              {activeCommuterScreen === 'tracking' && (
                <div className="flex flex-col gap-4 h-full">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <button 
                      onClick={() => setActiveCommuterScreen('home')}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900">Reported Issues</h2>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Citizen Tracking Desk</p>
                    </div>
                  </div>

                  {/* User's reported issues */}
                  <div className="flex flex-col gap-3 overflow-y-auto max-h-[440px] pr-1">
                    {reports.filter(r => r.user_id === currentUser).length === 0 ? (
                      <div className="text-center py-12 bg-slate-50 border border-slate-200/50 rounded-2xl italic text-xs text-slate-500">
                        You have not submitted any reports yet.
                      </div>
                    ) : (
                      reports.filter(r => r.user_id === currentUser).map(r => (
                        <div key={r.id} className="bg-white border border-slate-150 p-4 rounded-2xl flex flex-col gap-2 shadow-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-bold font-mono text-slate-400">Issue #{r.id.substring(4)}</span>
                            <span className={`text-[8.5px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                              r.status === 'pending' ? 'bg-slate-50 text-slate-500 border-slate-200' :
                              r.status === 'verified' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              r.status === 'assigned' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              {r.status}
                            </span>
                          </div>

                          <div className="flex flex-col gap-0.5">
                            <h4 className="text-xs font-bold text-slate-900 capitalize">{r.category} Malfunction</h4>
                            <span className="text-[9px] text-slate-450 font-bold uppercase">{r.asset_name || 'Station asset'} · {r.location || 'Central Corridor'}</span>
                          </div>

                          <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2.5 rounded-xl">"{r.description}"</p>

                          <div className="grid grid-cols-2 gap-2 mt-1 text-[10px] font-semibold border-t border-slate-100 pt-2 text-slate-500">
                            <div>
                              <span>Assigned To:</span>
                              <span className="block text-slate-700 font-bold truncate mt-0.5">{r.assignee || 'Western Railway'}</span>
                            </div>
                            <div>
                              <span>Expected Action:</span>
                              <span className="block text-slate-700 font-bold mt-0.5">
                                {r.status === 'pending' ? 'Queue Verification' :
                                 r.status === 'verified' ? 'Inspection Scheduled' :
                                 r.status === 'assigned' ? 'Technician Dispatched' :
                                 'Resolved & Verified'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Unified Map Container (visible in commuter mode) */}
            <div className="absolute md:relative inset-0 md:inset-auto z-0 md:z-10 flex-1 w-full h-full md:h-auto md:rounded-[32px] overflow-hidden border-0 md:border md:border-slate-200/50 md:shadow-md pointer-events-auto bg-slate-50">
              <TransitMap
                stations={stations}
                selectedStationId={selectedStationId}
                onStationClick={(id) => {
                  setSelectedStationId(selectedStationId === id ? null : id);
                  setActiveCommuterScreen('station');
                }}
                getStationStatusColor={getStationStatusColor}
              />
            </div>
          </>
        )}

        {/* -------------------- OPERATOR CONTROL VIEW -------------------- */}
        {viewMode === 'operator' && (
          <div className="flex flex-col gap-6 pointer-events-auto animate-fade-in w-full pb-8">
            
            {/* Operator metrics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="glass-panel p-5 rounded-3xl border border-slate-200/50 shadow-md">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">Total Assets</span>
                <span className="text-2xl font-bold font-mono text-slate-800 block mt-1">{summary.totalInfrastructure}</span>
              </div>
              <div className="glass-panel p-5 rounded-3xl border border-slate-200/50 shadow-md">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">Healthy Fleet</span>
                <span className="text-2xl font-bold font-mono text-emerald-600 block mt-1">{assets.filter(a => a.status === 'healthy').length}</span>
              </div>
              <div className="glass-panel p-5 rounded-3xl border border-slate-200/50 shadow-md">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">Warning States</span>
                <span className="text-2xl font-bold font-mono text-amber-605 block mt-1">{assets.filter(a => a.status === 'warning').length}</span>
              </div>
              <div className="glass-panel p-5 rounded-3xl border border-slate-200/50 shadow-md">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">Critical Outages</span>
                <span className="text-2xl font-bold font-mono text-rose-600 block mt-1">{assets.filter(a => a.status === 'critical').length}</span>
              </div>
              <div className="glass-panel p-5 rounded-3xl border border-slate-200/50 shadow-md">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">Open Complaints</span>
                <span className="text-2xl font-bold font-mono text-orange-655 block mt-1">{reports.filter(r => r.status !== 'resolved').length}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Alert Center */}
              <div className="lg:col-span-5 flex flex-col gap-4 glass-panel rounded-3xl p-5 shadow-md border border-slate-200/50">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900">Predictive Alerts Feed</h3>
                    <p className="text-[9px] text-slate-400 font-mono mt-0.5">Critical Outage Forecasts</p>
                  </div>
                  <span className="text-[9px] font-mono text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                    {activeAlerts.length} Warnings
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
                          <p className="text-xs text-slate-650 mt-1 leading-relaxed">{alert.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Maintenance Schedule table */}
              <div className="lg:col-span-7 flex flex-col gap-4 glass-panel rounded-3xl p-5 shadow-md border border-slate-200/50">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900">Asset Risk Ranking</h3>
                    <p className="text-[9px] text-slate-400 font-mono mt-0.5">Deterioration scores based on reports and age</p>
                  </div>
                  <span className="text-[9px] font-mono text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                    Live Telemetry
                  </span>
                </div>

                <div className="max-h-[450px] overflow-y-auto border border-slate-200/80 rounded-2xl bg-white shadow-inner">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
                      <tr className="text-slate-500 font-mono text-[9px] uppercase tracking-wider">
                        <th className="p-3 font-extrabold">Asset Name</th>
                        <th className="p-3 font-extrabold">Transit Hub</th>
                        <th className="p-3 font-extrabold">Health Index</th>
                        <th className="p-3 font-extrabold">Outage Risk</th>
                        <th className="p-3 font-extrabold">Status</th>
                        <th className="p-3 font-extrabold">Est. Fail</th>
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
                              <td className="p-3 font-bold text-slate-800">{asset.name}</td>
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
                                  <span className="text-red-650 font-bold flex items-center gap-1">
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

            {/* Analytics Section */}
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

        {/* -------------------- GOVERNMENT / AUTHORITY VIEW -------------------- */}
        {viewMode === 'authority' && (
          <div className="flex flex-col gap-6 pointer-events-auto animate-fade-in w-full pb-8">
            
            {/* Authority stats metrics */}
            <div className="grid grid-cols-4 gap-4">
              <div className="glass-panel p-5 rounded-3xl border border-slate-200/50 shadow-md">
                <span className="text-[9px] text-slate-450 font-extrabold uppercase tracking-widest">Open Complaints</span>
                <span className="text-2xl font-bold font-mono text-slate-800 block mt-1">{authorityStats.open}</span>
              </div>
              <div className="glass-panel p-5 rounded-3xl border border-slate-200/50 shadow-md">
                <span className="text-[9px] text-slate-450 font-extrabold uppercase tracking-widest">Pending Verification</span>
                <span className="text-2xl font-bold font-mono text-rose-600 block mt-1">{authorityStats.pending}</span>
              </div>
              <div className="glass-panel p-5 rounded-3xl border border-slate-200/50 shadow-md">
                <span className="text-[9px] text-slate-450 font-extrabold uppercase tracking-widest">Assigned to Agencies</span>
                <span className="text-2xl font-bold font-mono text-amber-600 block mt-1">{authorityStats.assigned}</span>
              </div>
              <div className="glass-panel p-5 rounded-3xl border border-slate-200/50 shadow-md">
                <span className="text-[9px] text-slate-450 font-extrabold uppercase tracking-widest">Resolved & Verified</span>
                <span className="text-2xl font-bold font-mono text-emerald-600 block mt-1">{authorityStats.resolved}</span>
              </div>
            </div>

            {/* Split complaint listing and assignment desk */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Complaints Desk List (5/12 grid) */}
              <div className="lg:col-span-5 flex flex-col gap-4 glass-panel rounded-3xl p-5 shadow-md border border-slate-200/50">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900">Citizen Complaints Desk</h3>
                    <p className="text-[9px] text-slate-400 font-mono mt-0.5">Verified reports requiring action</p>
                  </div>
                  <span className="text-[9px] font-mono text-orange-655 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                    {reports.filter(r => r.status !== 'resolved').length} Complaints
                  </span>
                </div>

                <div className="flex flex-col gap-3 max-h-[450px] overflow-y-auto pr-1">
                  {reports.filter(r => r.status !== 'resolved').length === 0 ? (
                    <div className="text-center py-16 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center gap-2">
                      <CheckCircle className="h-8 w-8 text-emerald-500" />
                      <span className="text-xs text-slate-505 font-bold">No outstanding citizen issues.</span>
                    </div>
                  ) : (
                    reports.filter(r => r.status !== 'resolved').map(rep => (
                      <div 
                        key={rep.id}
                        onClick={() => setSelectedReportId(rep.id)}
                        className={`p-4 rounded-2xl border flex flex-col gap-2 bg-white shadow-sm transition-all hover:shadow cursor-pointer ${
                          selectedReportId === rep.id ? 'border-orange-500 ring-2 ring-orange-500/10' : 'border-slate-150'
                        }`}
                      >
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-400 font-mono">Issue #{rep.id.substring(4)}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-bold uppercase border ${
                            rep.status === 'pending' ? 'bg-slate-50 text-slate-500 border-slate-200' :
                            rep.status === 'verified' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {rep.status}
                          </span>
                        </div>

                        <div className="flex flex-col gap-0.5">
                          <h4 className="text-xs font-bold text-slate-800 capitalize">{rep.category} Malfunction</h4>
                          <span className="text-[9px] text-slate-450 font-bold uppercase">{rep.asset_name || 'Station Asset'} · {rep.station_name || 'Central Terminal'}</span>
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-2 italic">"{rep.description}"</p>
                        
                        <div className="flex justify-between items-center border-t border-slate-100 pt-2 mt-1 text-[9px] text-slate-500 font-bold uppercase">
                          <span>Severity: <span className="text-orange-655 font-bold">{rep.severity}</span></span>
                          <span>Assignee: <span className="text-slate-700 font-extrabold">{rep.assignee || 'Western Railway'}</span></span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Assignment & Action Panel (7/12 grid) */}
              <div className="lg:col-span-7 flex flex-col gap-4 glass-panel rounded-3xl p-5 shadow-md border border-slate-200/50">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900">Resolution & Dispatch Desk</h3>
                    <p className="text-[9px] text-slate-400 font-mono mt-0.5">Agency allocation and field verification</p>
                  </div>
                </div>

                {selectedReport ? (
                  <div className="bg-white border border-slate-150 p-6 rounded-2xl flex flex-col gap-5 shadow-inner">
                    <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[9px] text-orange-655 font-bold uppercase tracking-wider block">Complaint Details</span>
                        <h4 className="text-base font-extrabold text-slate-900 capitalize mt-0.5">{selectedReport.category} Issue</h4>
                        <span className="text-[10px] text-slate-500 font-semibold mt-1 block uppercase">
                          {selectedReport.asset_name || 'Station asset'} · {selectedReport.station_name || 'Central Terminal'}
                        </span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold border uppercase ${
                        selectedReport.severity === 'high' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        selectedReport.severity === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {selectedReport.severity} Priority
                      </span>
                    </div>

                    <div className="flex flex-col gap-2">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">Citizen Statement</span>
                      <p className="text-sm text-slate-700 italic bg-slate-50 p-4 rounded-xl border border-slate-150">
                        "{selectedReport.description}"
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-650">
                      <div>
                        <span>Reported By:</span>
                        <span className="block text-slate-800 font-extrabold mt-1 flex items-center gap-1.5">
                          <UserIcon className="h-4.5 w-4.5 text-orange-500" />
                          {selectedReport.user_name || 'Citizen Commuter'}
                        </span>
                      </div>
                      <div>
                        <span>Complaint ID:</span>
                        <span className="block text-slate-800 font-extrabold mt-1 font-mono">
                          {selectedReport.id}
                        </span>
                      </div>
                    </div>

                    {/* Agency Assignment selector */}
                    <div className="flex flex-col gap-2 border-t border-slate-100 pt-4">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">Assign Service Agency</span>
                      <div className="flex gap-3">
                        <select
                          value={selectedReport.assignee || ''}
                          onChange={(e) => assignReportMutation.mutate({ reportId: selectedReport.id, assignee: e.target.value })}
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none cursor-pointer"
                        >
                          <option value="">Unassigned</option>
                          <option value="Western Railway">Western Railway</option>
                          <option value="Central Railway">Central Railway</option>
                          <option value="Brihanmumbai Municipal Corporation (BMC)">Brihanmumbai Municipal Corporation (BMC)</option>
                          <option value="MMRDA">MMRDA Transit</option>
                          <option value="Mumbai Metro One">Mumbai Metro One</option>
                        </select>
                        {selectedReport.status === 'assigned' && (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-250 rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-1">
                            <UserCheck className="h-4 w-4" />
                            Assigned
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Resolve button */}
                    <button
                      onClick={() => resolveReportMutation.mutate(selectedReport.id)}
                      disabled={resolveReportMutation.isPending}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-2xl text-xs transition-all shadow-md shadow-emerald-600/10 flex items-center justify-center gap-1.5 mt-2 disabled:opacity-50"
                    >
                      <CheckSquare className="h-4.5 w-4.5" />
                      {resolveReportMutation.isPending ? 'Marking resolved...' : 'Mark Complaint Resolved'}
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-24 bg-slate-50 border border-slate-200/50 rounded-2xl italic text-xs text-slate-400">
                    Select a complaint on the left panel to review and assign.
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

      </main>

      {/* Mobile Bottom Sheets (Citizen status vs dispatcher tabs) */}
      {viewMode === 'commuter' && (
        <div className="flex md:hidden absolute bottom-4 left-4 right-4 z-20 pointer-events-auto max-h-[60%] overflow-y-auto bg-white/95 border border-slate-200/80 shadow-2xl backdrop-blur-lg p-5 rounded-[32px] flex-col gap-3.5 animate-slide-up">
          <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto" />
          
          {selectedStationId ? (
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-500 shrink-0 shadow-inner">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{selectedStation?.name || 'Selected station'}</h3>
                    <p className="text-[9px] text-slate-400 mt-0.5">Transit Hub · Mumbai Segment</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setSelectedStationId(null);
                    setActiveCommuterScreen('home');
                  }}
                  className="h-7 w-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 active:scale-95"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {activeCommuterScreen === 'station' && (
                <div className="flex flex-col gap-3">
                  <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest pl-1">Station Health: {getStationHealth(selectedStationId)}%</span>
                  <div className="grid grid-cols-2 gap-2">
                    {getStationFacilities(selectedStationId).map(f => (
                      <button
                        key={f.id}
                        onClick={() => {
                          setSelectedFacilityId(f.id);
                          setActiveCommuterScreen('facility');
                        }}
                        className="p-3 rounded-xl border text-[10.5px] font-bold text-left bg-white border-slate-150 shadow-sm"
                      >
                        <span className="block truncate">{f.name}</span>
                        <span className={`text-[7.5px] font-bold uppercase tracking-wider block mt-1 ${f.status === 'healthy' ? 'text-emerald-600' : 'text-amber-600'}`}>{f.status}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeCommuterScreen === 'facility' && selectedFacilityId && (
                <div className="flex flex-col gap-3">
                  <div className="bg-slate-50 p-3 rounded-xl text-[11px] leading-relaxed">
                    <span className="font-bold text-slate-800 block mb-1">Status: Operational</span>
                    Last verified 12 minutes ago. Help us keep it running by submitting a report.
                  </div>
                  <button
                    onClick={() => setActiveCommuterScreen('report')}
                    className="w-full bg-orange-500 text-white font-bold py-2.5 rounded-xl text-xs"
                  >
                    Report Issue
                  </button>
                </div>
              )}

              {activeCommuterScreen === 'report' && (
                <form onSubmit={handleReportSubmit} className="flex flex-col gap-3">
                  <div className="flex justify-between items-center pb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Malfunction Details</span>
                    <button 
                      type="button" 
                      onClick={() => setActiveCommuterScreen('facility')}
                      className="text-[10px] text-slate-500 hover:text-slate-850 font-bold"
                    >
                      Back
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[8px] font-bold text-slate-400 uppercase block mb-1">Category</label>
                      <select
                        value={reportForm.category}
                        onChange={(e) => setReportForm({ ...reportForm, category: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                      >
                        <option value="toilet">Toilet</option>
                        <option value="escalator">Escalator</option>
                        <option value="lift">Lift / Elevator</option>
                        <option value="water">Water Fountain</option>
                        <option value="footbridge">Skywalk</option>
                        <option value="charging_point">EV Charger</option>
                        <option value="lighting">Lighting</option>
                        <option value="safety">Safety</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[8px] font-bold text-slate-400 uppercase block mb-1">Severity</label>
                      <select
                        value={reportForm.severity}
                        onChange={(e) => setReportForm({ ...reportForm, severity: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <label className="text-[8px] font-bold text-slate-400 uppercase block mb-1">Location Details</label>
                      <input
                        type="text"
                        placeholder="e.g. Platform 3 near Stairs"
                        value={reportForm.location}
                        onChange={(e) => setReportForm({ ...reportForm, location: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none"
                      />
                    </div>
                  </div>

                  {(reportForm.category === 'toilet' || reportForm.category === 'water') && (
                    <div>
                      <label className="text-[8px] font-bold text-slate-400 uppercase block mb-1">
                        Cleanliness Rating: {reportForm.cleanliness_rating}/5
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={reportForm.cleanliness_rating}
                          onChange={(e) => setReportForm({ ...reportForm, cleanliness_rating: parseInt(e.target.value) })}
                          className="w-full accent-orange-500 cursor-pointer"
                        />
                        <span className="text-[10px] font-bold text-orange-655 font-mono">{reportForm.cleanliness_rating} Stars</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-[8px] font-bold text-slate-400 uppercase block mb-1">Description</label>
                    <textarea
                      rows={2}
                      placeholder="Malfunction details..."
                      value={reportForm.description}
                      onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-orange-500"
                      required
                    />
                  </div>

                  {successMsg ? (
                    <div className="p-2 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] rounded-xl text-center font-bold">{successMsg}</div>
                  ) : (
                    <button
                      type="submit"
                      disabled={reportMutation.isPending}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-md shadow-orange-500/20"
                    >
                      {reportMutation.isPending ? 'Submitting...' : 'Submit Report'}
                    </button>
                  )}
                </form>
              )}
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
                  className="bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-9 py-3 text-xs text-slate-850 w-full focus:outline-none focus:border-orange-500 font-semibold"
                />
              </div>
              <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto">
                {stations.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).map(s => (
                  <div
                    key={s.id}
                    onClick={() => {
                      setSelectedStationId(s.id);
                      setActiveCommuterScreen('station');
                    }}
                    className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl cursor-pointer"
                  >
                    <span className="text-xs font-bold text-slate-800">{s.name}</span>
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer on desktop */}
      <footer className="hidden md:flex w-full border-t border-slate-200/60 py-4 text-center text-[9px] text-slate-400 font-mono tracking-widest uppercase z-20 relative bg-slate-50/50">
        Mumbai Transit Hub Control Room · Powered by TransitIQ Public OS v1.1
      </footer>
    </div>
  );
}
