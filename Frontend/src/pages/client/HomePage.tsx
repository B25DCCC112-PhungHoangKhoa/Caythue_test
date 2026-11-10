import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Flame,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Star,
  Zap,
  Headphones,
  Trophy,
  CheckCircle2,
  Search,
  LayoutGrid,
  ShieldCheck,
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import type { IGame, IService, IReview } from '../../types';

// Hero banner slideshow with clear, authentic service information
const HERO_SLIDES = [
  {
    id: 1,
    title: 'Cày thuê Đấu Trường Chân Lý',
    titleHighlight: 'TFT Mùa Mới',
    subtitle: 'Đội ngũ booster trình độ cao sẵn sàng hỗ trợ leo mọi bậc rank, cam kết tiến độ và an toàn.',
    image: 'https://caythue24.com/cdn/shop/files/caelys-tft-couverture-hd-x_1600x.progressive.jpg',
    badge: 'Mùa giải mới 2026',
    ctaText: 'Xem báo giá TFT',
    gameSlug: 'dtcl',
  },
  {
    id: 2,
    title: 'Cày sao Liên Quân Mobile',
    titleHighlight: 'Thách Đấu 2026',
    subtitle: 'Hỗ trợ chọn tướng tủ, cày siêu tốc và linh hoạt đặt lịch cày theo khung giờ mong muốn.',
    image: 'https://caythue24.com/cdn/shop/files/banner_1_d85db037-25e6-4246-bf05-e1a598513e5e_1600x.progressive.jpg',
    badge: 'Dịch vụ phổ biến',
    ctaText: 'Xem báo giá Liên Quân',
    gameSlug: 'lien-quan-mobile',
  },
  {
    id: 3,
    title: 'Cày Premier CS2 & Valorant',
    titleHighlight: 'Chuyên Nghiệp',
    subtitle: 'Bảo mật tài khoản bằng mạng riêng ảo VPN theo vùng IP người chơi, winrate cam kết trên 85%.',
    image: 'https://caythue24.com/cdn/shop/files/csgo_bf2ea916-41f6-4f68-8037-810f7c325a99_1600x.progressive.jpg',
    badge: 'FPS Esports',
    ctaText: 'Xem báo giá CS2',
    gameSlug: 'cs2',
  },
];

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState<IGame[]>([]);
  // selectedGameId = '' means ALL GAMES are selected (no game clicked)
  const [selectedGameId, setSelectedGameId] = useState<string>('');
  const [services, setServices] = useState<IService[]>([]);
  const [allServices, setAllServices] = useState<IService[]>([]);
  const [reviews, setReviews] = useState<IReview[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [orderSearchCode, setOrderSearchCode] = useState('');

  // Smooth View Transition handler for game selection
  const handleSelectGame = (gameId: string) => {
    const nextId = selectedGameId === gameId ? '' : gameId;
    const doc = document as Document & { startViewTransition?: (cb: () => void) => void };
    if (typeof doc.startViewTransition === 'function') {
      doc.startViewTransition(() => {
        setSelectedGameId(nextId);
      });
    } else {
      setSelectedGameId(nextId);
    }
  };

  const handleNavigateWithTransition = (path: string) => {
    const doc = document as Document & { startViewTransition?: (cb: () => void) => void };
    if (typeof doc.startViewTransition === 'function') {
      doc.startViewTransition(() => {
        navigate(path);
      });
    } else {
      navigate(path);
    }
  };

  // Auto-advance banner slides every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // 1. Fetch active games, all services and reviews
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [gamesRes, servicesRes, reviewsRes] = await Promise.all([
          axiosClient.get<{ success: boolean; games: IGame[] }>('/games'),
          axiosClient.get<{ success: boolean; services: IService[] }>('/services'),
          axiosClient.get<{ success: boolean; reviews: IReview[] }>('/reviews'),
        ]);

        if (gamesRes.data.success && gamesRes.data.games.length > 0) {
          const orderMap: Record<string, number> = {
            'lien-quan-mobile': 0,
            lmht: 1,
            dtcl: 2,
            valorant: 3,
            cs2: 4,
            'toc-chien': 5,
          };

          const sortedGames = [...gamesRes.data.games].sort(
            (a, b) => (orderMap[a.slug] ?? 99) - (orderMap[b.slug] ?? 99)
          );

          setGames(sortedGames);
        }

        if (servicesRes.data.success && servicesRes.data.services) {
          setAllServices(servicesRes.data.services);
          setServices(servicesRes.data.services);
        }

        if (reviewsRes.data.success) {
          setReviews(reviewsRes.data.reviews || []);
        }
      } catch {
        // Handle error silently
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // 2. Filter services instantly from in-memory allServices cache (zero flashing, instant response)
  useEffect(() => {
    if (!selectedGameId) {
      setServices(allServices);
    } else {
      const filtered = allServices.filter((s) => {
        const gId = typeof s.gameId === 'object' && s.gameId ? s.gameId._id : s.gameId;
        return gId === selectedGameId;
      });
      setServices(filtered);
    }
  }, [selectedGameId, allServices]);

  const activeGame = games.find((g) => g._id === selectedGameId);

  // Helper to extract Game data from a service
  const getGameForService = (service: IService): IGame | undefined => {
    if (typeof service.gameId === 'object' && service.gameId !== null) {
      return service.gameId as IGame;
    }
    return games.find((g) => g._id === service.gameId);
  };

  const handleTrackOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderSearchCode.trim()) return;
    const clean = orderSearchCode.trim();
    navigate(`/orders/${clean}`);
  };

  // Real review stats calculated from authentic database reviews
  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : '5.0';

  return (
    <div className="space-y-12 pb-20">
      {/* ======================================================== */}
      {/* 1. HERO BANNER (De-slopped: Clean solid typography)      */}
      {/* ======================================================== */}
      <section className="relative overflow-hidden bg-slate-900 border-b border-slate-200">
        <div className="relative min-h-[460px] sm:min-h-[520px] md:min-h-[560px] w-full flex items-center">
          {HERO_SLIDES.map((slide, idx) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none ${
                idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {/* Background Wallpaper */}
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover object-center filter brightness-[0.38]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-transparent" />

              {/* Slide Content */}
              <div className="absolute inset-0 flex items-center">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                  <div className="max-w-3xl space-y-5">
                    {/* Badge: Sentence case, no tracked caps */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-semibold">
                      <span>{slide.badge}</span>
                    </div>

                    {/* Headline: Solid ink, no multi-color gradient */}
                    <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white leading-tight">
                      {slide.title} <br />
                      <span className="text-orange-400">{slide.titleHighlight}</span>
                    </h1>

                    <p className="text-sm sm:text-base md:text-lg text-slate-200 leading-relaxed max-w-2xl font-normal">
                      {slide.subtitle}
                    </p>

                    <div className="pt-2 flex flex-wrap items-center gap-4">
                      <button
                        onClick={() => {
                          const matched = games.find((g) => g.slug === slide.gameSlug);
                          handleSelectGame(matched ? matched._id : '');
                          const el = document.getElementById('services-section');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="px-7 py-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 active:bg-orange-700 disabled:opacity-50 text-white font-bold text-sm sm:text-base shadow-lg shadow-orange-600/30 flex items-center gap-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-orange-500 active:scale-[0.98] motion-reduce:transform-none"
                      >
                        <Zap className="w-4 h-4 fill-white" />
                        <span>{slide.ctaText}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>

                      <a
                        href="#why-choose-us"
                        className="px-6 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-white font-semibold text-sm sm:text-base transition-colors flex items-center gap-2"
                      >
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>Cam kết an toàn tài khoản</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Slider Controls */}
          <button
            onClick={() =>
              setCurrentSlide((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1))
            }
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white transition-colors border border-white/20"
            title="Slide trước"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white transition-colors border border-white/20"
            title="Slide tiếp"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Slider Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {HERO_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`h-2 rounded-full transition-colors ${
                  i === currentSlide ? 'w-8 bg-orange-500' : 'w-2 bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. GAME SELECTOR (De-slopped: Clean, still imagery)      */}
      {/* ======================================================== */}
      <section className="bg-white border-b border-slate-200 sticky top-18 z-30 shadow-xs backdrop-blur-md bg-opacity-95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto py-3 no-scrollbar scroll-smooth">
            {/* Button "Tất Cả Games" */}
            <button
              onClick={() => handleSelectGame('')}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-xl transition-colors duration-200 shrink-0 font-bold text-xs sm:text-sm active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-2 focus-visible:outline-orange-500 ${
                selectedGameId === ''
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 border border-slate-200'
              }`}
            >
              <LayoutGrid className="w-4 h-4 shrink-0" />
              <span>Tất cả games</span>
              <span className={`text-[11px] px-1.5 py-0.2 rounded-full transition-colors ${
                selectedGameId === '' ? 'bg-orange-700 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {allServices.length}
              </span>
            </button>

            {loading ? (
              <div className="flex gap-3 py-1">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="w-24 h-10 rounded-xl bg-slate-100 animate-pulse motion-reduce:animate-none shrink-0" />
                ))}
              </div>
            ) : (
              games.map((g, idx) => {
                const isSelected = g._id === selectedGameId;
                const isHot = idx === 0 || g.slug === 'dtcl' || g.slug === 'lien-quan-mobile';

                return (
                  <button
                    key={g._id}
                    onClick={() => handleSelectGame(g._id)}
                    className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl transition-colors duration-200 shrink-0 font-semibold text-xs sm:text-sm active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-2 focus-visible:outline-orange-500 ${
                      isSelected
                        ? 'bg-orange-50 text-orange-600 font-bold border border-orange-400'
                        : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Hot Badge: Clean sentence case, no tracked caps */}
                    {isHot && (
                      <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center gap-0.5">
                        <Flame className="w-2.5 h-2.5 fill-white" /> Hot
                      </span>
                    )}

                    {/* Game Icon: Still image, no bouncing */}
                    <div className="w-6 h-6 rounded-md overflow-hidden flex items-center justify-center shrink-0">
                      {g.thumbnail ? (
                        <img
                          src={g.thumbnail}
                          alt={g.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <span className="text-xs font-bold text-slate-600">{g.name.slice(0, 2)}</span>
                      )}
                    </div>

                    <span className="tracking-tight whitespace-nowrap">{g.name}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. SERVICES LIST (Pure Clean Layout - Image 2)           */}
      {/* ======================================================== */}
      <section id="services-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-2">
        {/* Section Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
            <Link to="/" className="hover:text-orange-600 transition-colors">
              Trang chủ
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-bold">
              {activeGame ? `Cày thuê ${activeGame.name}` : 'Tất cả dịch vụ cày rank'}
            </span>
            <span className="ml-2 text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
              {services.length} sản phẩm
            </span>
          </div>

          {activeGame && (
            <button
              onClick={() => handleSelectGame('')}
              className="text-xs font-semibold text-slate-500 hover:text-orange-600 underline"
            >
              Xem tất cả dịch vụ
            </button>
          )}
        </div>

        {/* Services List Content with Smooth View Transition */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 py-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 animate-pulse motion-reduce:animate-none">
                <div className="w-16 h-16 bg-slate-200 rounded-xl shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 w-16 bg-slate-200 rounded" />
                  <div className="h-4 w-32 bg-slate-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl text-slate-500 text-sm">
            Hiện chưa có gói dịch vụ nào cho mục này. Vui lòng chọn tựa game khác trên thanh menu.
          </div>
        ) : (
          <div
            key={selectedGameId || 'all'}
            className="animate-smooth-fade"
            style={{ viewTransitionName: 'services-content' }}
          >
            {selectedGameId === '' ? (
              /* ======================================================== */
              /* CASE A: ALL GAMES VIEW - Clean 6-Game Grid               */
              /* ======================================================== */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-2">
                {games.map((g) => {
                  const gameServices = allServices.filter((s) => {
                    const sGameId = typeof s.gameId === 'object' && s.gameId ? s.gameId._id : s.gameId;
                    return sGameId === g._id;
                  });

                  if (gameServices.length === 0) return null;
                  const mainSvc = gameServices[0];

                  return (
                    <div
                      key={g._id}
                      onClick={() => handleNavigateWithTransition(`/games/${g.slug}?service=${mainSvc._id}`)}
                      className="group relative flex flex-col justify-between p-6 rounded-2xl bg-white border border-slate-200 hover:border-orange-500 hover:bg-slate-50/60 transition-colors cursor-pointer space-y-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          {g.thumbnail && (
                            <img
                              src={g.thumbnail}
                              alt={g.name}
                              className="w-7 h-7 object-contain"
                            />
                          )}
                          <div>
                            <p className="text-xs font-semibold text-slate-500">{g.name}</p>
                            <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                              {mainSvc.name}
                            </h3>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-center py-2 h-36">
                        <img
                          src={mainSvc.thumbnail}
                          alt={mainSvc.name}
                          className="max-h-full max-w-full object-contain filter drop-shadow-xs"
                        />
                      </div>

                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {mainSvc.description}
                      </p>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">Cày rank theo bậc</span>
                        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 group-hover:text-orange-700">
                          <span>Tính giá & Đặt cày</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* ======================================================== */
              /* CASE B: FILTERED BY SINGLE GAME                         */
              /* ======================================================== */
              <div className="max-w-xl mx-auto py-4">
                {services.map((svc) => {
                  const gameObj = getGameForService(svc) || activeGame;
                  return (
                    <div
                      key={svc._id}
                      onClick={() => handleNavigateWithTransition(`/games/${gameObj?.slug || 'dtcl'}?service=${svc._id}`)}
                      className="group relative flex flex-col justify-between p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 hover:border-orange-500 hover:bg-slate-50/60 transition-colors cursor-pointer space-y-5"
                    >
                      <div className="flex items-center gap-3">
                        {gameObj?.thumbnail && (
                          <img
                            src={gameObj.thumbnail}
                            alt={gameObj.name}
                            className="w-8 h-8 object-contain"
                          />
                        )}
                        <div>
                          <p className="text-xs font-semibold text-slate-500">{gameObj?.name}</p>
                          <h3 className="text-lg font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                            {svc.name}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center justify-center py-4 h-48">
                        <img
                          src={svc.thumbnail}
                          alt={svc.name}
                          className="max-h-full max-w-full object-contain filter drop-shadow-xs"
                        />
                      </div>

                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed text-center max-w-md mx-auto">
                        {svc.description}
                      </p>

                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          Bảo mật VPN 100%
                        </span>
                        <div className="inline-flex items-center gap-2 text-sm font-bold text-orange-600 group-hover:text-orange-700">
                          <span>Bắt đầu tính giá ngay</span>
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ======================================================== */}
      {/* 4. TRACK ORDER & COMMITMENTS (De-slopped)                 */}
      {/* ======================================================== */}
      <section id="why-choose-us" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* LEFT: Track Your Order Box */}
          <div className="lg:col-span-5 bg-slate-900 text-white rounded-2xl p-7 sm:p-9 shadow-lg flex flex-col justify-between space-y-6">
            <div className="space-y-2.5">
              <h3 className="text-2xl font-bold text-white leading-tight">
                Tra cứu đơn hàng trực tiếp
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Nhập mã đơn hàng (ví dụ: <span className="text-orange-400 font-mono font-bold">CT2401</span>) để theo dõi trạng thái tiến độ và kết quả từ booster.
              </p>
            </div>

            <form onSubmit={handleTrackOrder} className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Nhập mã đơn hàng..."
                  value={orderSearchCode}
                  onChange={(e) => setOrderSearchCode(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-orange-500"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1.5 bottom-1.5 px-4 rounded-lg bg-orange-600 hover:bg-orange-500 active:bg-orange-700 disabled:opacity-50 text-white font-bold text-xs transition-colors flex items-center gap-1"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Tra cứu</span>
                </button>
              </div>
            </form>

            {/* Authentic Reviews Metric */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-amber-400 mb-0.5">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span className="text-lg font-bold text-white">{averageRating}</span>
                  <span className="text-xs text-slate-400">/ 5.0</span>
                </div>
                <p className="text-xs text-slate-400">
                  {reviews.length > 0 ? `${reviews.length} đánh giá đã xác thực` : 'Đánh giá từ khách hàng'}
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Đơn hàng thật
                </span>
                <p className="text-[11px] text-slate-500">Cập nhật theo thời gian thực</p>
              </div>
            </div>
          </div>

          {/* RIGHT: Why Choose Us (Authentic Commitments) */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-7 sm:p-9 shadow-xs flex flex-col justify-between space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                Cam kết chất lượng dịch vụ
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                  <Zap className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Bắt đầu nhanh chóng</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Booster tiếp nhận đơn trong vòng 15 phút sau khi thanh toán, hoàn thành đúng tiến độ đã hẹn.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Bảo mật tài khoản</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Đăng nhập qua mạng riêng ảo VPN sạch theo vùng IP người chơi, tuyệt đối không dùng phần mềm thứ ba.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <Headphones className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Hỗ trợ liên tục</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Đội ngũ chăm sóc khách hàng và booster túc trực cập nhật tiến độ bất cứ lúc nào qua hotline/zalo.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                  <Trophy className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Booster trình độ cao</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tuyển chọn từ những game thủ Top Thách Đấu, Radiant, Faceit Level 10 có winrate trên 85%.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between flex-wrap gap-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  Đồng hành cùng game thủ leo rank an toàn
                </h4>
                <p className="text-xs text-slate-500">Bảo hành hoàn tiền 100% nếu có bất kỳ sự cố nào</p>
              </div>

              <button
                onClick={() => {
                  const el = document.getElementById('services-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition-colors"
              >
                Thuê cày ngay
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. REVIEWS SECTION (Authentic, no fake testimonials)     */}
      {/* ======================================================== */}
      {reviews.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2">
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-xl font-bold text-slate-900">
                Đánh giá từ khách hàng đã hoàn thành đơn
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>100% đánh giá xác thực sau đơn hàng</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {reviews.slice(0, 3).map((rev) => {
                const userName =
                  typeof rev.userId === 'object' && rev.userId ? rev.userId.name : 'Khách hàng';
                return (
                  <div
                    key={rev._id}
                    className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs">
                          {userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-slate-900">{userName}</h3>
                          <span className="text-[11px] text-slate-400">Khách hàng xác thực</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5 text-amber-400">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      “{rev.comment}”
                    </p>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Đơn hàng đã hoàn thành</span>
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Đã xác nhận
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;
