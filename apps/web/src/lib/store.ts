import { create } from 'zustand';

interface TransitStore {
  viewMode: 'commuter' | 'operator' | 'authority';
  setViewMode: (mode: 'commuter' | 'operator' | 'authority') => void;
  selectedAssetId: string | null;
  setSelectedAssetId: (id: string | null) => void;
  selectedStationId: string | null;
  setSelectedStationId: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterStatus: 'all' | 'healthy' | 'warning' | 'critical';
  setFilterStatus: (status: 'all' | 'healthy' | 'warning' | 'critical') => void;
  filterType: string;
  setFilterType: (type: string) => void;
  currentUser: string;
  setCurrentUser: (userId: string) => void;
  activeCommuterScreen: 'home' | 'station' | 'facility' | 'report' | 'tracking';
  setActiveCommuterScreen: (screen: 'home' | 'station' | 'facility' | 'report' | 'tracking') => void;
  selectedFacilityId: string | null;
  setSelectedFacilityId: (id: string | null) => void;
}

export const useTransitStore = create<TransitStore>((set) => ({
  viewMode: 'commuter',
  setViewMode: (viewMode) => set({ viewMode }),
  selectedAssetId: null,
  setSelectedAssetId: (selectedAssetId) => set({ selectedAssetId }),
  selectedStationId: null,
  setSelectedStationId: (selectedStationId) => set({ selectedStationId }),
  searchQuery: '',
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  filterStatus: 'all',
  setFilterStatus: (filterStatus) => set({ filterStatus }),
  filterType: 'all',
  setFilterType: (filterType) => set({ filterType }),
  currentUser: 'usr_1',
  setCurrentUser: (currentUser) => set({ currentUser }),
  activeCommuterScreen: 'home',
  setActiveCommuterScreen: (activeCommuterScreen) => set({ activeCommuterScreen }),
  selectedFacilityId: null,
  setSelectedFacilityId: (selectedFacilityId) => set({ selectedFacilityId }),
}));
