import React, { useEffect, useState } from 'react';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  Upload,
  Settings,
  Zap,
  Check,
  Save,
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import type { IGame, IService, ICustomOption } from '../../types';

export const ManageServices: React.FC = () => {
  const [services, setServices] = useState<IService[]>([]);
  const [games, setGames] = useState<IGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Service Edit/Create Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<IService | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields for Service
  const [name, setName] = useState('');
  const [gameId, setGameId] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isActive, setIsActive] = useState(true);

  // Custom Options ("Tùy chọn mở rộng") Modal State
  const [optionsModalOpen, setOptionsModalOpen] = useState(false);
  const [selectedServiceForOptions, setSelectedServiceForOptions] = useState<IService | null>(null);
  const [customOptionsList, setCustomOptionsList] = useState<ICustomOption[]>([]);
  const [savingOptions, setSavingOptions] = useState(false);
  const [optionsSuccessMsg, setOptionsSuccessMsg] = useState<string | null>(null);

  // New Custom Option Form Fields
  const [newOptName, setNewOptName] = useState('');
  const [newOptKey, setNewOptKey] = useState('');
  const [newOptPercentage, setNewOptPercentage] = useState<number>(10);
  const [newOptRequiresInput, setNewOptRequiresInput] = useState(false);
  const [newOptPlaceholder, setNewOptPlaceholder] = useState('');
  const [newOptDesc, setNewOptDesc] = useState('');

  const fetchServicesAndGames = async () => {
    try {
      setLoading(true);
      setError(null);
      const [svcRes, gameRes] = await Promise.all([
        axiosClient.get<{ success: boolean; services: IService[] }>('/services?all=true'),
        axiosClient.get<{ success: boolean; games: IGame[] }>('/games?all=true'),
      ]);

      if (svcRes.data.success) setServices(svcRes.data.services);
      if (gameRes.data.success) {
        setGames(gameRes.data.games);
        if (gameRes.data.games.length > 0 && !gameId) {
          setGameId(gameRes.data.games[0]._id);
        }
      }
    } catch {
      setError('Lỗi khi tải danh sách dịch vụ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServicesAndGames();
  }, []);

  const openCreateModal = () => {
    setEditingService(null);
    setName('');
    setDescription('');
    setThumbnailUrl('');
    setThumbnailFile(null);
    setIsActive(true);
    if (games.length > 0) setGameId(games[0]._id);
    setModalOpen(true);
  };

  const openEditModal = (svc: IService) => {
    setEditingService(svc);
    setName(svc.name);
    setGameId(typeof svc.gameId === 'object' && '_id' in svc.gameId ? svc.gameId._id : svc.gameId);
    setDescription(svc.description || '');
    setThumbnailUrl(svc.thumbnail);
    setThumbnailFile(null);
    setIsActive(svc.isActive);
    setModalOpen(true);
  };

  // Open "Tùy chọn mở rộng" Manager Modal
  const openCustomOptionsModal = (svc: IService) => {
    setSelectedServiceForOptions(svc);
    setCustomOptionsList(
      svc.customOptions && svc.customOptions.length > 0 ? [...svc.customOptions] : []
    );
    setOptionsSuccessMsg(null);
    setNewOptName('');
    setNewOptKey('');
    setNewOptPercentage(10);
    setNewOptRequiresInput(false);
    setNewOptPlaceholder('');
    setNewOptDesc('');
    setOptionsModalOpen(true);
  };

  // Add a new option to current list in modal
  const handleAddNewOption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOptName.trim()) return;

    const generatedKey =
      newOptKey.trim() ||
      newOptName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '_');

    const newOption: ICustomOption = {
      key: generatedKey,
      name: newOptName.trim(),
      percentage: Number(newOptPercentage) || 0,
      requiresInput: newOptRequiresInput,
      inputPlaceholder: newOptPlaceholder.trim(),
      description: newOptDesc.trim(),
      isActive: true,
    };

    setCustomOptionsList([...customOptionsList, newOption]);
    setNewOptName('');
    setNewOptKey('');
    setNewOptPercentage(10);
    setNewOptRequiresInput(false);
    setNewOptPlaceholder('');
    setNewOptDesc('');
  };

  // Delete an option from list
  const handleDeleteOption = (index: number) => {
    const updated = customOptionsList.filter((_, idx) => idx !== index);
    setCustomOptionsList(updated);
  };

  // Toggle active state of an option
  const handleToggleOptionActive = (index: number) => {
    const updated = [...customOptionsList];
    updated[index].isActive = !updated[index].isActive;
    setCustomOptionsList(updated);
  };

  // Update percentage or name in list
  const handleUpdateOptionField = (
    index: number,
    field: keyof ICustomOption,
    value: string | number | boolean
  ) => {
    const updated = [...customOptionsList];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setCustomOptionsList(updated);
  };

  // Save "Tùy chọn mở rộng" to backend via PUT /api/admin/services/:id/options
  const handleSaveCustomOptions = async () => {
    if (!selectedServiceForOptions) return;
    try {
      setSavingOptions(true);
      setOptionsSuccessMsg(null);
      const res = await axiosClient.put<{
        success: boolean;
        message: string;
        customOptions: ICustomOption[];
      }>(`/admin/services/${selectedServiceForOptions._id}/options`, {
        customOptions: customOptionsList,
      });

      if (res.data.success) {
        setOptionsSuccessMsg('Đã lưu cấu hình tùy chọn mở rộng thành công!');
        fetchServicesAndGames();
        setTimeout(() => setOptionsSuccessMsg(null), 3000);
      }
    } catch {
      alert('Không thể lưu tùy chọn mở rộng lúc này!');
    } finally {
      setSavingOptions(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !gameId) return;

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('gameId', gameId);
      formData.append('description', description.trim());
      formData.append('isActive', String(isActive));

      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      } else if (thumbnailUrl.trim()) {
        formData.append('thumbnail', thumbnailUrl.trim());
      }

      if (editingService) {
        await axiosClient.put(`/admin/services/${editingService._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await axiosClient.post('/admin/services', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      setModalOpen(false);
      fetchServicesAndGames();
    } catch (err: unknown) {
      alert(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Lỗi khi lưu thông tin gói dịch vụ'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa gói dịch vụ này?')) return;
    try {
      await axiosClient.delete(`/admin/services/${serviceId}`);
      fetchServicesAndGames();
    } catch {
      alert('Không thể xóa dịch vụ này!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            Quản Lý Gói Dịch Vụ Cày Rank
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Thiết lập tên gói cày, ảnh đại diện và tùy chọn mở rộng (Đặt lịch, Chọn tướng, Cày siêu tốc...)
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto shadow-lg shadow-cyan-500/20"
        >
          <Plus className="w-4 h-4" />
          Thêm Gói Dịch Vụ Mới
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Services Table */}
      <div className="bg-gaming-card border border-gaming-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Đang tải danh sách dịch vụ…</div>
        ) : services.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">Chưa có gói dịch vụ nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gaming-dark/60 text-slate-400 text-xs font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Ảnh</th>
                  <th className="py-3.5 px-4">Tên Gói</th>
                  <th className="py-3.5 px-4">Tựa Game</th>
                  <th className="py-3.5 px-4">Loại & Bảng Giá</th>
                  <th className="py-3.5 px-4">Tùy Chọn Mở Rộng</th>
                  <th className="py-3.5 px-4">Trạng Thái</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gaming-border/60 text-slate-300">
                {services.map((svc) => {
                  const gameTitle =
                    typeof svc.gameId === 'object' && 'name' in svc.gameId
                      ? svc.gameId.name
                      : '---';
                  const optionsCount = svc.customOptions?.length || 0;

                  return (
                    <tr key={svc._id} className="hover:bg-gaming-border/30 transition-colors">
                      <td className="py-3 px-4">
                        <img
                          src={svc.thumbnail}
                          alt={svc.name}
                          className="w-12 h-10 rounded-lg object-contain border border-gaming-border bg-slate-900"
                        />
                      </td>
                      <td className="py-3 px-4 font-bold text-white text-sm">{svc.name}</td>
                      <td className="py-3 px-4 text-cyan-400 font-semibold">{gameTitle}</td>
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            Bậc Rank
                          </span>
                          <p className="text-[11px] text-slate-400">Tích lũy Rank Tiers</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => openCustomOptionsModal(svc)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold transition-colors active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-cyan-500"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Tùy Chọn Mở Rộng ({optionsCount})</span>
                          <Settings className="w-3 h-3 ml-0.5" />
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            svc.isActive
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-rose-500/10 text-rose-400'
                          }`}
                        >
                          {svc.isActive ? 'Hoạt động' : 'Tạm dừng'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(svc)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Sửa thông tin gói"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(svc._id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: QUẢN LÝ "TÙY CHỌN MỞ RỘNG" (Matching Image 3)   */}
      {/* ======================================================== */}
      {optionsModalOpen && selectedServiceForOptions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn motion-reduce:animate-none">
          <div className="w-full max-w-3xl bg-gaming-card border border-cyan-500/40 rounded-3xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  Cấu hình tùy chọn mở rộng: {selectedServiceForOptions.name}
                </h3>
              </div>
              <button
                onClick={() => setOptionsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {optionsSuccessMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>{optionsSuccessMsg}</span>
              </div>
            )}

            {/* List of current custom options */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white">
                Danh sách tùy chọn hiện tại ({customOptionsList.length}):
              </h4>

              {customOptionsList.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-4 bg-slate-900/60 rounded-xl border border-slate-800">
                  Chưa có tùy chọn nào. Hãy thêm tùy chọn ở form bên dưới.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {customOptionsList.map((opt, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-white text-sm">{opt.name}</span>
                          <span className="font-mono text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                            {opt.key}
                          </span>
                          <span
                            className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                              opt.percentage > 0
                                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            +{opt.percentage}%
                          </span>
                          {opt.requiresInput && (
                            <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">
                              Cần nhập text
                            </span>
                          )}
                        </div>

                        {opt.requiresInput && opt.inputPlaceholder && (
                          <p className="text-[11px] text-slate-400 italic">
                            Placeholder: "{opt.inputPlaceholder}"
                          </p>
                        )}
                        {opt.description && (
                          <p className="text-[11px] text-slate-400">
                            Tooltip: "{opt.description}"
                          </p>
                        )}
                      </div>

                      {/* Controls: Percentage edit & Delete */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <div className="flex items-center gap-1">
                          <label className="text-[10px] text-slate-400">%:</label>
                          <input
                            type="number"
                            min={0}
                            max={200}
                            value={opt.percentage}
                            onChange={(e) =>
                              handleUpdateOptionField(idx, 'percentage', Number(e.target.value) || 0)
                            }
                            className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono font-bold text-white text-xs"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleOptionActive(idx)}
                          className={`p-1.5 rounded-lg border text-xs font-bold transition-colors ${
                            opt.isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}
                          title={opt.isActive ? 'Đang bật' : 'Đang tắt'}
                        >
                          {opt.isActive ? 'Bật' : 'Tắt'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteOption(idx)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                          title="Xóa tùy chọn này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add New Custom Option Form */}
            <form
              onSubmit={handleAddNewOption}
              className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3"
            >
              <h4 className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> Thêm tùy chọn mới cho gói này:
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Tên tùy chọn <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Chọn tướng, Đặt lịch cày, Live stream..."
                    value={newOptName}
                    onChange={(e) => setNewOptName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Phụ phí (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={200}
                    value={newOptPercentage}
                    onChange={(e) => setNewOptPercentage(Number(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white text-center focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Mã định danh (Key tùy chọn - Tự động nếu trống)
                  </label>
                  <input
                    type="text"
                    placeholder="VD: pick_hero, schedule, live_stream..."
                    value={newOptKey}
                    onChange={(e) => setNewOptKey(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Mô tả Tooltip (Hiển thị khi rê chuột)
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Booster sẽ đánh đúng tướng bạn yêu cầu..."
                    value={newOptDesc}
                    onChange={(e) => setNewOptDesc(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Requires input checkbox & placeholder */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={newOptRequiresInput}
                    onChange={(e) => setNewOptRequiresInput(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-500"
                  />
                  <span>Yêu cầu khách nhập nội dung bổ sung (như Tên tướng, Khung giờ cày...)</span>
                </label>

                {newOptRequiresInput && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Placeholder mẫu cho ô nhập text
                    </label>
                    <input
                      type="text"
                      placeholder="VD: (VD: Valhein, Butterfly, Nakroth)"
                      value={newOptPlaceholder}
                      onChange={(e) => setNewOptPlaceholder(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                )}
              </div>

              <div className="pt-1 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold text-xs flex items-center gap-1.5 transition-colors border border-cyan-500/30"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm Tùy Chọn Này Vào Danh Sách</span>
                </button>
              </div>
            </form>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setOptionsModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleSaveCustomOptions}
                disabled={savingOptions}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {savingOptions ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Lưu Cấu Hình Tùy Chọn Mở Rộng</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: TẠO / SỬA GÓI DỊCH VỤ CƠ BẢN                   */}
      {/* ======================================================== */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-gaming-card border border-gaming-border rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gaming-border">
              <h3 className="text-base font-bold text-white">
                {editingService ? 'Sửa Gói Dịch Vụ' : 'Thêm Gói Dịch Vụ Mới'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Tên Gói Dịch Vụ <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Cày Siêu Tốc"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-gaming-dark border border-gaming-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Tựa Game <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={gameId}
                    onChange={(e) => setGameId(e.target.value)}
                    className="w-full bg-gaming-dark border border-gaming-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    {games.map((g) => (
                      <option key={g._id} value={g._id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 space-y-1">
                <p className="font-bold">Mô hình tính giá: Tích lũy theo Rank Tiers</p>
                <p className="text-[11px] text-slate-400">
                  Giá cày được cộng dồn tự động từ chi phí của các bậc rank trong game. Cấu hình chi phí chi tiết tại mục Rank Tiers.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Mô Tả Gói Dịch Vụ
                </label>
                <textarea
                  rows={2}
                  placeholder="Mô tả ưu điểm của gói cày..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-gaming-dark border border-gaming-border rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              {/* Thumbnail */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  Ảnh Đại Diện (Thumbnail) <span className="text-rose-400">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="URL ảnh hoặc tải file"
                    value={thumbnailUrl}
                    onChange={(e) => {
                      setThumbnailUrl(e.target.value);
                      setThumbnailFile(null);
                    }}
                    className="flex-1 bg-gaming-dark border border-gaming-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                  <label className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Tải File</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setThumbnailFile(e.target.files[0]);
                          setThumbnailUrl(e.target.files[0].name);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="svcIsActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-500"
                />
                <label htmlFor="svcIsActive" className="text-xs font-semibold text-slate-300">
                  Cho phép khách đặt gói dịch vụ này
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gaming-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-xs font-bold text-white flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingService ? 'Lưu Thay Đổi' : 'Thêm Gói'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageServices;
