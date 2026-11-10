import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axiosClient from '../api/axiosClient';
import type {
  IGame,
  IService,
  IRankTier,
  IOrderOptions,
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
  currentUnit: number;
  targetUnit: number;
  quantity: number;
  options: IOrderOptions;
  customOptionsSelection: Record<string, CustomOptionSelectionItem>;
  pricePreview: CalculatePriceResponse | null;
  isCalculating: boolean;
  calculationError: string | null;

  setSelectedGame: (game: IGame | null) => void;
  setSelectedService: (service: IService | null) => void;
  setStartRankTier: (tier: IRankTier | null) => void;
  setTargetRankTier: (tier: IRankTier | null) => void;
  setCurrentUnit: (val: number) => void;
  setTargetUnit: (val: number) => void;
  setQuantity: (val: number) => void;
  setOptions: (options: Partial<IOrderOptions>) => void;
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
      currentUnit: 10,
      targetUnit: 20,
      quantity: 5,
      options: {
        isExpress: false,
        pickRole: false,
        isDuo: false,
      },
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
          currentUnit: 10,
          targetUnit: 20,
          quantity: 5,
          customOptionsSelection: {},
          pricePreview: null,
          calculationError: null,
        });
      },

      setSelectedService: (service) => {
        const type = service?.serviceType || 'RANK_TIER';
        let curU = get().currentUnit;
        let tgtU = get().targetUnit;
        let qty = get().quantity;

        if (service?.priceConfig) {
          if (type === 'PER_UNIT') {
            curU = service.priceConfig.minUnit ?? 10;
            tgtU = (service.priceConfig.minUnit ?? 10) + 10;
          } else if (type === 'MATCH_COUNT') {
            qty = service.priceConfig.minUnit ?? 5;
          }
        }

        set({
          selectedService: service,
          currentUnit: curU,
          targetUnit: tgtU,
          quantity: qty,
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

      setCurrentUnit: (val) => {
        set({ currentUnit: val });
        const { targetUnit, selectedService } = get();
        const unitLabel = selectedService?.priceConfig?.unitLabel || 'đơn vị';
        if (targetUnit <= val) {
          set({
            calculationError: `Số ${unitLabel} mong muốn phải lớn hơn hiện tại`,
            pricePreview: null,
          });
          return;
        }
        set({ calculationError: null });
        get().calculatePricePreview();
      },

      setTargetUnit: (val) => {
        set({ targetUnit: val });
        const { currentUnit, selectedService } = get();
        const unitLabel = selectedService?.priceConfig?.unitLabel || 'đơn vị';
        if (val <= currentUnit) {
          set({
            calculationError: `Số ${unitLabel} mong muốn phải lớn hơn hiện tại`,
            pricePreview: null,
          });
          return;
        }
        set({ calculationError: null });
        get().calculatePricePreview();
      },

      setQuantity: (val) => {
        set({ quantity: val });
        if (val < 1) {
          set({
            calculationError: 'Số lượng cần cày phải từ 1 trở lên',
            pricePreview: null,
          });
          return;
        }
        set({ calculationError: null });
        get().calculatePricePreview();
      },

      setOptions: (newOptions) => {
        set((state) => ({
          options: { ...state.options, ...newOptions },
        }));
        get().calculatePricePreview();
      },

      toggleCustomOption: (key, selected) => {
        set((state) => {
          const current = state.customOptionsSelection[key] || { selected: false, inputValue: '' };
          const newSelected = selected !== undefined ? selected : !current.selected;
          return {
            customOptionsSelection: {
              ...state.customOptionsSelection,
              [key]: {
                ...current,
                selected: newSelected,
              },
            },
          };
        });
        get().calculatePricePreview();
      },

      setCustomOptionInput: (key, value) => {
        set((state) => {
          const current = state.customOptionsSelection[key] || { selected: true, inputValue: '' };
          return {
            customOptionsSelection: {
              ...state.customOptionsSelection,
              [key]: {
                ...current,
                inputValue: value,
              },
            },
          };
        });
      },

      calculatePricePreview: async () => {
        const {
          selectedService,
          startRankTier,
          targetRankTier,
          currentUnit,
          targetUnit,
          quantity,
          options,
          customOptionsSelection,
        } = get();

        if (!selectedService) {
          set({ pricePreview: null });
          return;
        }

        const type = selectedService.serviceType || 'RANK_TIER';

        if (type === 'RANK_TIER') {
          if (!startRankTier || !targetRankTier) {
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
        } else if (type === 'PER_UNIT') {
          const unitLabel = selectedService.priceConfig?.unitLabel || 'đơn vị';
          if (targetUnit <= currentUnit) {
            set({
              pricePreview: null,
              calculationError: `Số ${unitLabel} mong muốn phải lớn hơn hiện tại`,
            });
            return;
          }
        } else if (type === 'MATCH_COUNT') {
          if (quantity < 1) {
            set({
              pricePreview: null,
              calculationError: 'Số lượng cần cày phải từ 1 trở lên',
            });
            return;
          }
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
            startRankTierId: type === 'RANK_TIER' ? startRankTier?._id : undefined,
            targetRankTierId: type === 'RANK_TIER' ? targetRankTier?._id : undefined,
            currentUnit: type === 'PER_UNIT' ? currentUnit : undefined,
            targetUnit: type === 'PER_UNIT' ? targetUnit : undefined,
            quantity: type === 'MATCH_COUNT' ? quantity : undefined,
            options,
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
          currentUnit: 10,
          targetUnit: 20,
          quantity: 5,
          options: {
            isExpress: false,
            pickRole: false,
            isDuo: false,
          },
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
