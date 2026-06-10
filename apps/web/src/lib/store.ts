import { create } from 'zustand';

interface TransitStore {
  viewMode: 'commuter' | 'operator';
  setViewMode: (mode: 'commuter' | 'operator') => void;
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
}));
