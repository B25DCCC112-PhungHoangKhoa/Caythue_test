import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Star,
  Zap,
  Info,
  ShieldCheck,
  ChevronRight,
  Loader2,
  MessageSquare,
  Gift,
  HelpCircle,
  LayoutGrid,
  Flame,
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { useBookingStore } from '../../store/useBookingStore';
import { VietQRModal } from '../../components/ui/VietQRModal';
import type {
  IGame,
  IService,
  IRankTier,
  IReview,
  ICustomOption,
  CreateOrderResponse,
  IBankInfo,
} from '../../types';

export const GameDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [allGames, setAllGames] = useState<IGame[]>([]);
  const [game, setGame] = useState<IGame | null>(null);
  const [services, setServices] = useState<IService[]>([]);
  const [rankTiers, setRankTiers] = useState<IRankTier[]>([]);
  const [reviews, setReviews] = useState<IReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // In-game credentials state directly on this page
  const [accountType, setAccountType] = useState('Garena');
  const [inGameAccount, setInGameAccount] = useState('');
  const [inGamePassword, setInGamePassword] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // VietQR Modal state if order is created directly
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [createdOrderData, setCreatedOrderData] = useState<{
    _id: string;
    orderCode: string;
    transferCode?: string;
    transferMessage?: string;
    totalPrice: number;
    qrUrl: string;
    bankInfo?: IBankInfo;
  } | null>(null);

  const {
    selectedService,
    startRankTier,
    targetRankTier,
    currentUnit,
    targetUnit,
    quantity,
    customOptionsSelection,
    pricePreview,
    isCalculating,
    calculationError,
    setSelectedGame,
    setSelectedService,
    setStartRankTier,
    setTargetRankTier,
    setCurrentUnit,
    setTargetUnit,
    setQuantity,
    toggleCustomOption,
    setCustomOptionInput,
    resetBooking,
  } = useBookingStore();

  // Load all games list for the top navigation bar
  useEffect(() => {
    const fetchGames = async () => {
      try {
        const res = await axiosClient.get<{ success: boolean; games: IGame[] }>('/games');
        if (res.data.success && res.data.games) {
          const orderMap: Record<string, number> = {
            'lien-quan-mobile': 0,
            lmht: 1,
            dtcl: 2,
            valorant: 3,
            cs2: 4,
            'toc-chien': 5,
          };
          const sorted = [...res.data.games].sort(
            (a, b) => (orderMap[a.slug] ?? 99) - (orderMap[b.slug] ?? 99)
          );
          setAllGames(sorted);
        }
      } catch {
        // Silent error
      }
    };
    fetchGames();
  }, []);

  // Smooth View Transition handlers
  const handleSelectGame = (targetSlug: string) => {
    const doc = document as Document & { startViewTransition?: (cb: () => void) => void };
    if (!targetSlug) {
      if (typeof doc.startViewTransition === 'function') {
        doc.startViewTransition(() => {
          navigate('/#services-section');
        });
      } else {
        navigate('/#services-section');
      }
      return;
    }

    if (targetSlug === slug) return;

    if (typeof doc.startViewTransition === 'function') {
      doc.startViewTransition(() => {
        navigate(`/games/${targetSlug}`);
      });
    } else {
      navigate(`/games/${targetSlug}`);
    }
  };

  const handleSelectService = (svc: IService) => {
    const doc = document as Document & { startViewTransition?: (cb: () => void) => void };
    if (typeof doc.startViewTransition === 'function') {
      doc.startViewTransition(() => {
        setSelectedService(svc);
      });
    } else {
      setSelectedService(svc);
    }
  };

  // Load Game & Services
  useEffect(() => {
    const fetchGameDetail = async () => {
      if (!slug) return;
      try {
        // Only trigger full page loading if initial mount
        if (!game) {
          setLoading(true);
        }
        setError(null);

        const gameRes = await axiosClient.get<{
          success: boolean;
          game: IGame;
          services: IService[];
        }>(`/games/${slug}`);

        if (gameRes.data.success && gameRes.data.game) {
          const gameData = gameRes.data.game;
          const svcs = gameRes.data.services || [];
          const queryServiceId = searchParams.get('service');
          const matchedService = svcs.find((s) => s._id === queryServiceId) || svcs[0];

          const tiersRes = await axiosClient.get<{
            success: boolean;
            rankTiers: IRankTier[];
          }>(`/rank-tiers?gameId=${gameData._id}`);

          const updateStates = () => {
            setGame(gameData);
            setServices(svcs);
            setSelectedGame(gameData);
            if (matchedService) {
              setSelectedService(matchedService);
            }
            if (tiersRes.data.success && tiersRes.data.rankTiers.length > 0) {
              const tiers = tiersRes.data.rankTiers;
              setRankTiers(tiers);
              setStartRankTier(tiers[0]);
              if (tiers.length > 1) setTargetRankTier(tiers[1]);
            }
          };

          const doc = document as Document & { startViewTransition?: (cb: () => void) => void };
          if (typeof doc.startViewTransition === 'function') {
            doc.startViewTransition(updateStates);
          } else {
            updateStates();
          }
        }
      } catch {
        setError('Không tìm thấy thông tin tựa game này.');
      } finally {
        setLoading(false);
      }
    };

    fetchGameDetail();
  }, [slug]);

  // Load Reviews when selected service changes
  useEffect(() => {
    const fetchReviews = async () => {
      if (!selectedService) return;
      try {
        const res = await axiosClient.get<{ success: boolean; reviews: IReview[] }>(
          `/reviews?serviceId=${selectedService._id}`
        );
        if (res.data.success) {
          setReviews(res.data.reviews || []);
        }
      } catch {
        // Silent error
      }
    };

    fetchReviews();
  }, [selectedService]);

  const customOptionsList: ICustomOption[] =
    selectedService?.customOptions && selectedService.customOptions.length > 0
      ? selectedService.customOptions
      : [];

  const handleHireNow = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedService) {
      alert('Vui lòng chọn một gói dịch vụ!');
      return;
    }

    const type = selectedService.serviceType || 'RANK_TIER';

    if (type === 'RANK_TIER') {
      if (!startRankTier || !targetRankTier) {
        alert('Vui lòng chọn đầy đủ các bậc rank!');
        return;
      }
      if (targetRankTier.index <= startRankTier.index) {
        alert('Bậc rank mục tiêu phải cao hơn bậc rank hiện tại!');
        return;
      }
    } else if (type === 'PER_UNIT') {
      const unitLabel = selectedService.priceConfig?.unitLabel || 'sao';
      if (targetUnit <= currentUnit) {
        alert(`Số ${unitLabel} mong muốn phải lớn hơn số ${unitLabel} hiện tại!`);
        return;
      }
    } else if (type === 'MATCH_COUNT') {
      if (quantity < 1) {
        alert('Số lượng cần cày phải từ 1 trở lên!');
        return;
      }
    }

    if (!inGameAccount.trim() || !inGamePassword.trim()) {
      alert('Vui lòng điền đầy đủ Tên tài khoản và Mật khẩu game!');
      return;
    }

    for (const opt of customOptionsList) {
      const state = customOptionsSelection[opt.key];
      if (state?.selected && opt.requiresInput && !state.inputValue?.trim()) {
        alert(`Vui lòng nhập thông tin cho “${opt.name}”!`);
        return;
      }
    }

    try {
      setSubmittingOrder(true);
      const selectedCustomOptionsList = Object.entries(customOptionsSelection)
        .filter(([, val]) => val.selected)
        .map(([k, val]) => ({
          key: k,
          inputValue: val.inputValue,
        }));

      const res = await axiosClient.post<CreateOrderResponse>('/orders', {
        serviceId: selectedService._id,
        startRankTierId: type === 'RANK_TIER' ? startRankTier?._id : undefined,
        targetRankTierId: type === 'RANK_TIER' ? targetRankTier?._id : undefined,
        currentUnit: type === 'PER_UNIT' ? currentUnit : undefined,
        targetUnit: type === 'PER_UNIT' ? targetUnit : undefined,
        quantity: type === 'MATCH_COUNT' ? quantity : undefined,
        customOptions: selectedCustomOptionsList,
        accountInfo: {
          inGameAccount: inGameAccount.trim(),
          inGamePassword: inGamePassword,
          inGameServer: accountType,
          inGameName: '',
          contactPhone: '',
          note: orderNote.trim(),
        },
        paymentMethod: 'VIETQR',
      });

      if (res.data.success && res.data.order) {
        setCreatedOrderData(res.data.order);
        setQrModalOpen(true);
      }
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        if (window.confirm('Bạn cần đăng nhập để đặt đơn cày rank. Chuyển đến trang Đăng nhập ngay?')) {
          navigate('/login');
        }
        return;
      }
      alert(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Không thể tạo đơn hàng lúc này. Vui lòng thử lại!'
      );
    } finally {
      setSubmittingOrder(false);
    }
  };

  if (loading && !game) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="inline-block w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin motion-reduce:animate-none mb-4" />
        <p className="text-xs text-slate-500">Đang tải bảng tính giá cày rank…</p>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="p-8 rounded-2xl bg-white border border-rose-200 text-rose-600 shadow-sm">
          <p className="text-base font-bold">{error || 'Không tìm thấy thông tin game'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 0. GAME SELECTOR (Matching CayThue24 & HomePage sticky bar) */}
      <div className="bg-white border-b border-slate-200 sticky top-18 z-30 shadow-xs backdrop-blur-md bg-opacity-95 -mt-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 mb-6">
        <div className="max-w-7xl mx-auto flex items-center gap-2 sm:gap-3 overflow-x-auto py-3 no-scrollbar scroll-smooth">
          <button
            onClick={() => handleSelectGame('')}
            className="relative flex items-center gap-2 px-4 py-2 rounded-xl transition-colors duration-200 shrink-0 font-bold text-xs sm:text-sm bg-slate-100 text-slate-700 hover:bg-slate-200/80 border border-slate-200 active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-2 focus-visible:outline-orange-500"
          >
            <LayoutGrid className="w-4 h-4 shrink-0" />
            <span>Tất cả games</span>
          </button>

          {allGames.map((g, idx) => {
            const isSelected = g.slug === slug;
            const isHot = idx === 0 || g.slug === 'dtcl' || g.slug === 'lien-quan-mobile';

            return (
              <button
                key={g._id}
                onClick={() => handleSelectGame(g.slug)}
                className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl transition-colors duration-200 shrink-0 font-semibold text-xs sm:text-sm active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-2 focus-visible:outline-orange-500 ${
                  isSelected
                    ? 'bg-orange-50 text-orange-600 font-bold border border-orange-400'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300'
                }`}
              >
                {isHot && (
                  <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center gap-0.5">
                    <Flame className="w-2.5 h-2.5 fill-white" /> Hot
                  </span>
                )}
                <div className="w-6 h-6 rounded-md overflow-hidden flex items-center justify-center shrink-0">
                  {g.thumbnail ? (
                    <img src={g.thumbnail} alt={g.name} className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-xs font-bold text-slate-600">{g.name.slice(0, 2)}</span>
                  )}
                </div>
                <span className="tracking-tight whitespace-nowrap">{g.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. Breadcrumb */}
      <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
        <Link to="/" className="hover:text-orange-600 transition-colors">
          Trang chủ
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <Link to={`/games/${game.slug}`} className="hover:text-orange-600 transition-colors">
          Cày thuê {game.name}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-900 font-bold">{selectedService?.name || 'Chi tiết dịch vụ'}</span>
      </div>

      {/* 2. Services Selector Pills */}
      {services.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-xs font-semibold text-slate-500 mr-2 shrink-0">
            Gói cày:
          </span>
          {services.map((svc) => {
            const isSelected = selectedService?._id === svc._id;
            return (
              <button
                key={svc._id}
                onClick={() => handleSelectService(svc)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors duration-200 border focus-visible:outline-2 focus-visible:outline-orange-500 active:scale-[0.98] motion-reduce:transform-none ${
                  isSelected
                    ? 'bg-orange-50 border-orange-500 text-orange-600'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                {svc.name}
              </button>
            );
          })}
        </div>
      )}

      {/* 3. Main Product Details */}
      <div
        key={selectedService?._id || game._id}
        className="animate-smooth-fade grid grid-cols-1 lg:grid-cols-12 gap-8 items-start bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-sm relative"
      >
        {/* Left Column: Clean rank crest */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-4 pt-4">
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center p-4">
            <img
              src={selectedService?.thumbnail || game.thumbnail}
              alt={selectedService?.name || game.name}
              className="max-h-full max-w-full object-contain filter drop-shadow-xs"
            />
          </div>

          <div className="text-center space-y-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              Cam kết hoàn thành 100% đúng hạn
            </span>
            <p className="text-[11px] text-slate-400">Mã dịch vụ: #{selectedService?._id.slice(-6)}</p>
          </div>
        </div>

        {/* Right Column: Service Configuration */}
        <div className="lg:col-span-7 space-y-5">
          {/* Service Title */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {selectedService?.name || 'Cày rank thách đấu'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">Dịch vụ cho {game.name}</p>
          </div>

          {/* Cashback notice & reviews row */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-lg">
              <Gift className="w-3.5 h-3.5 text-amber-600" />
              <span>Nhận 3.00% hoàn tiền tích lũy cho đơn hàng này</span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500">
              <div className="flex items-center text-amber-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
              <span className="font-semibold text-slate-700">Đánh giá 5.0</span>
              <span>|</span>
              <button
                type="button"
                onClick={() => alert('Vui lòng liên hệ Hotline/Zalo hỗ trợ nếu cần tư vấn!')}
                className="flex items-center gap-1 text-orange-600 hover:underline font-semibold"
              >
                <HelpCircle className="w-3.5 h-3.5" /> Hỗ trợ tư vấn
              </button>
            </div>
          </div>

          {/* Dynamic Price Display */}
          <div className="py-3 border-y border-slate-200 flex items-baseline gap-3">
            <span className="text-3xl sm:text-4xl font-bold font-mono text-orange-600">
              {isCalculating ? (
                <span className="text-lg text-orange-400 animate-pulse motion-reduce:animate-none">Đang tính giá…</span>
              ) : pricePreview ? (
                `${pricePreview.totalPrice.toLocaleString('vi-VN')}đ`
              ) : (
                '0đ'
              )}
            </span>
            {pricePreview && pricePreview.multiplier > 1 && (
              <span className="text-xs font-mono text-slate-400 line-through">
                {pricePreview.basePrice.toLocaleString('vi-VN')}đ
              </span>
            )}
            {pricePreview && pricePreview.multiplier > 1 && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Hệ số x{pricePreview.multiplier}
              </span>
            )}
          </div>

          <form onSubmit={handleHireNow} className="space-y-5">
            {/* Polymorphic Input Section based on serviceType */}
            {(!selectedService?.serviceType || selectedService.serviceType === 'RANK_TIER') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Bậc rank hiện tại <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={startRankTier?._id || ''}
                    onChange={(e) => {
                      const found = rankTiers.find((t) => t._id === e.target.value);
                      setStartRankTier(found || null);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500 font-medium"
                  >
                    {rankTiers.map((tier) => (
                      <option key={tier._id} value={tier._id}>
                        [{tier.index}] {tier.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Bậc rank mong muốn <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={targetRankTier?._id || ''}
                    onChange={(e) => {
                      const found = rankTiers.find((t) => t._id === e.target.value);
                      setTargetRankTier(found || null);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500 font-medium"
                  >
                    {rankTiers.map((tier) => {
                      const isDisabled = startRankTier ? tier.index <= startRankTier.index : false;
                      return (
                        <option key={tier._id} value={tier._id} disabled={isDisabled}>
                          [{tier.index}] {tier.name} {isDisabled ? '(Thấp hơn hiện tại)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            )}

            {selectedService?.serviceType === 'PER_UNIT' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Số {selectedService.priceConfig?.unitLabel || 'sao'} hiện tại <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={selectedService.priceConfig?.minUnit ?? 0}
                    max={selectedService.priceConfig?.maxUnit ?? 1000}
                    value={currentUnit}
                    onChange={(e) => setCurrentUnit(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Số {selectedService.priceConfig?.unitLabel || 'sao'} mong muốn <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={(selectedService.priceConfig?.minUnit ?? 0) + 1}
                    max={selectedService.priceConfig?.maxUnit ?? 1000}
                    value={targetUnit}
                    onChange={(e) => setTargetUnit(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500 font-medium"
                  />
                </div>
              </div>
            )}

            {selectedService?.serviceType === 'MATCH_COUNT' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Số {selectedService.priceConfig?.unitLabel || 'trận'} cần cày <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={selectedService.priceConfig?.minUnit ?? 1}
                    max={selectedService.priceConfig?.maxUnit ?? 50}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-36 bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500 font-bold"
                  />
                  <span className="text-xs text-slate-500 font-medium">
                    {selectedService.priceConfig?.unitLabel || 'trận'} (Đơn giá:{' '}
                    {(selectedService.priceConfig?.unitPrice || 0).toLocaleString('vi-VN')}đ/
                    {selectedService.priceConfig?.unitLabel || 'trận'})
                  </span>
                </div>
              </div>
            )}

            {selectedService?.serviceType === 'FIXED_PACKAGE' && (
              <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-200 space-y-1">
                <span className="text-xs font-bold text-orange-800">Gói dịch vụ trọn gói</span>
                <p className="text-xs text-slate-600">
                  Giá cố định:{' '}
                  <span className="font-bold text-orange-600 font-mono">
                    {(selectedService.priceConfig?.fixedPrice || 0).toLocaleString('vi-VN')}đ
                  </span>
                  . Hoàn thành toàn bộ yêu cầu cam kết.
                </p>
              </div>
            )}

            {calculationError && (
              <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                {calculationError}
              </p>
            )}

            {/* 4. Tùy chọn mở rộng */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-orange-600" />
                Tùy chọn mở rộng
              </label>

              {/* Checkboxes List */}
              <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                {customOptionsList.map((opt) => {
                  const state = customOptionsSelection[opt.key] || {
                    selected: false,
                    inputValue: '',
                  };
                  return (
                    <label
                      key={opt.key}
                      className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 hover:text-slate-900 select-none transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={state.selected}
                        onChange={() => toggleCustomOption(opt.key)}
                        className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300"
                      />
                      <span className="font-medium">{opt.name}</span>
                      {opt.percentage > 0 && (
                        <span className="text-orange-600 font-semibold font-mono text-xs">
                          +{opt.percentage.toFixed(2)}%
                        </span>
                      )}
                      {opt.description && (
                        <span
                          className="text-slate-400 hover:text-slate-600 cursor-help"
                          title={opt.description}
                        >
                          <Info className="w-3.5 h-3.5 inline ml-0.5" />
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>

              {/* Dynamic Inputs */}
              <div className="space-y-2.5 pt-1">
                {customOptionsList
                  .filter((opt) => opt.requiresInput && customOptionsSelection[opt.key]?.selected)
                  .map((opt) => {
                    const state = customOptionsSelection[opt.key];
                    return (
                      <div key={opt.key} className="space-y-1">
                        <label className="block text-xs font-medium text-slate-700 flex items-center gap-1">
                          <span>{opt.name}</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder={opt.inputPlaceholder || `Nhập thông tin cho ${opt.name}…`}
                          value={state?.inputValue || ''}
                          onChange={(e) => {
                            setCustomOptionInput(opt.key, e.target.value);
                          }}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 transition-colors"
                        />
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* 5. In-game credentials */}
            <div className="pt-3 border-t border-slate-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Tài khoản <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500 font-medium"
                  >
                    <option value="Garena">Garena</option>
                    <option value="Riot Games">Riot Games</option>
                    <option value="Steam">Steam</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Google">Google</option>
                    <option value="Khác">Tài khoản khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Tài khoản cần cày <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Điền tên đăng nhập"
                    value={inGameAccount}
                    onChange={(e) => setInGameAccount(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Mật khẩu tài khoản <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Điền mật khẩu"
                    value={inGamePassword}
                    onChange={(e) => setInGamePassword(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3 text-orange-600" />
                  <span>Ghi chú đơn hàng</span>
                  <span className="text-slate-400 font-normal text-[11px]">(Tướng yêu thích, giờ rảnh, yêu cầu thêm…)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="VD: Cày sau 19h tối, ưu tiên đánh các tướng Nakroth, Valhein..."
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>

            {/* 6. Primary CTA Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submittingOrder || isCalculating || !pricePreview}
                className="w-full py-3.5 px-6 rounded-xl bg-orange-600 hover:bg-orange-500 active:bg-orange-700 disabled:opacity-50 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-colors focus-visible:outline-2 focus-visible:outline-orange-500"
              >
                {submittingOrder ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" />
                    <span>Đang khởi tạo đơn hàng…</span>
                  </>
                ) : (
                  <span>Thuê cày ngay</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 7. Reviews Section */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Phản hồi về dịch vụ {selectedService?.name || game.name}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Ý kiến nhận xét từ khách hàng thực tế</p>
          </div>
          <span className="text-xs text-slate-500 font-semibold">{reviews.length} đánh giá</span>
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs italic">
            Chưa có đánh giá nào cho gói dịch vụ này. Hãy là người đầu tiên trải nghiệm!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((rev) => (
              <div
                key={rev._id}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">
                    {typeof rev.userId === 'object' && 'name' in rev.userId
                      ? rev.userId.name
                      : 'Khách hàng ẩn danh'}
                  </span>
                  <div className="flex text-amber-400">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-slate-600">“{rev.comment}”</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* VietQR Modal */}
      {createdOrderData && (
        <VietQRModal
          isOpen={qrModalOpen}
          onClose={() => {
            setQrModalOpen(false);
            resetBooking();
            navigate(`/orders/${createdOrderData._id}`);
          }}
          qrUrl={createdOrderData.qrUrl}
          orderCode={createdOrderData.orderCode}
          transferCode={createdOrderData.transferCode}
          transferMessage={createdOrderData.transferMessage}
          bankInfo={createdOrderData.bankInfo}
          totalPrice={createdOrderData.totalPrice}
          orderId={createdOrderData._id}
        />
      )}
    </div>
  );
};

export default GameDetailPage;
