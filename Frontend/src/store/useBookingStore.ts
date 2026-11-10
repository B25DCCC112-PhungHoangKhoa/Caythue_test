import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axiosClient from '../api/axiosClient';
import type {
  IGame,
  IService,
  IRankTier,
  CalculatePriceResponse,
} from '../types';

export interface CustomOptionSelectionItem {
  selected: boolean;
  inputValue: string;
}

interface BookingState {
  selectedGame: IGame | null;
  selectedService: IService | null;
  startRankTier: IRankTier | null;
  targetRankTier: IRankTier | null;
  customOptionsSelection: Record<string, CustomOptionSelectionItem>;
  pricePreview: CalculatePriceResponse | null;
  isCalculating: boolean;
  calculationError: string | null;

  setSelectedGame: (game: IGame | null) => void;
  setSelectedService: (service: IService | null) => void;
  setStartRankTier: (tier: IRankTier | null) => void;
  setTargetRankTier: (tier: IRankTier | null) => void;
  toggleCustomOption: (key: string, selected?: boolean) => void;
  setCustomOptionInput: (key: string, value: string) => void;
  calculatePricePreview: () => Promise<void>;
  resetBooking: () => void;
}

export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
      selectedGame: null,
      selectedService: null,
      startRankTier: null,
      targetRankTier: null,
      customOptionsSelection: {},
      pricePreview: null,
      isCalculating: false,
      calculationError: null,

      setSelectedGame: (game) => {
        set({
          selectedGame: game,
          selectedService: null,
          startRankTier: null,
          targetRankTier: null,
          customOptionsSelection: {},
          pricePreview: null,
          calculationError: null,
        });
      },

      setSelectedService: (service) => {
        set({
          selectedService: service,
          customOptionsSelection: {},
          calculationError: null,
        });
        get().calculatePricePreview();
      },

      setStartRankTier: (tier) => {
        set({ startRankTier: tier });
        const { targetRankTier } = get();
        if (tier && targetRankTier && targetRankTier.index <= tier.index) {
          set({
            targetRankTier: null,
            pricePreview: null,
            calculationError: 'Bậc rank đích phải cao hơn bậc rank hiện tại',
          });
          return;
        }
        get().calculatePricePreview();
      },

      setTargetRankTier: (tier) => {
        const { startRankTier } = get();
        if (tier && startRankTier && tier.index <= startRankTier.index) {
          set({
            calculationError: 'Bậc rank đích phải cao hơn bậc rank hiện tại',
            pricePreview: null,
          });
          return;
        }
        set({ targetRankTier: tier, calculationError: null });
        get().calculatePricePreview();
      },

      toggleCustomOption: (key, selected) => {
        set((state) => {
          const current = state.customOptionsSelection[key] || {
            selected: false,
            inputValue: '',
          };
          const nextSelected = selected !== undefined ? selected : !current.selected;
          return {
            customOptionsSelection: {
              ...state.customOptionsSelection,
              [key]: {
                ...current,
                selected: nextSelected,
              },
            },
          };
        });
        get().calculatePricePreview();
      },

      setCustomOptionInput: (key, value) => {
        set((state) => ({
          customOptionsSelection: {
            ...state.customOptionsSelection,
            [key]: {
              selected: true,
              inputValue: value,
            },
          },
        }));
      },

      calculatePricePreview: async () => {
        const {
          selectedService,
          startRankTier,
          targetRankTier,
          customOptionsSelection,
        } = get();

        if (!selectedService || !startRankTier || !targetRankTier) {
          set({ pricePreview: null });
          return;
        }

        if (targetRankTier.index <= startRankTier.index) {
          set({
            pricePreview: null,
            calculationError: 'Bậc rank đích phải cao hơn bậc rank hiện tại',
          });
          return;
        }

        // Format customOptions array
        const selectedCustomOptionsList = Object.entries(customOptionsSelection)
          .filter(([, val]) => val.selected)
          .map(([k, val]) => ({
            key: k,
            inputValue: val.inputValue,
          }));

        set({ isCalculating: true, calculationError: null });
        try {
          const res = await axiosClient.post<CalculatePriceResponse>('/orders/calculate', {
            serviceId: selectedService._id,
            startRankTierId: startRankTier._id,
            targetRankTierId: targetRankTier._id,
            customOptions: selectedCustomOptionsList,
          });

          if (res.data.success) {
            set({ pricePreview: res.data, isCalculating: false, calculationError: null });
          }
        } catch (error: unknown) {
          const errMsg =
            (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            'Không thể tính giá cày rank lúc này';
          set({
            pricePreview: null,
            isCalculating: false,
            calculationError: errMsg,
          });
        }
      },

      resetBooking: () => {
        set({
          selectedGame: null,
          selectedService: null,
          startRankTier: null,
          targetRankTier: null,
          customOptionsSelection: {},
          pricePreview: null,
          isCalculating: false,
          calculationError: null,
        });
      },
    }),
    {
      name: 'booking-storage',
    }
  )
);

export default useBookingStore;
