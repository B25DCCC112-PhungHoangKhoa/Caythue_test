import React, { useEffect, useState } from 'react';
import {
  Gamepad2,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Upload,
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import type { IGame } from '../../types';

export const ManageGames: React.FC = () => {
  const [games, setGames] = useState<IGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<IGame | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isActive, setIsActive] = useState(true);

  const fetchGames = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosClient.get<{ success: boolean; games: IGame[] }>('/games?all=true');
      if (res.data.success) {
        setGames(res.data.games);
      }
    } catch {
      setError('Không thể tải danh sách games');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  const openCreateModal = () => {
    setEditingGame(null);
    setName('');
    setSlug('');
    setDescription('');
    setThumbnailUrl('');
    setThumbnailFile(null);
    setIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (game: IGame) => {
    setEditingGame(game);
    setName(game.name);
    setSlug(game.slug);
    setDescription(game.description || '');
    setThumbnailUrl(game.thumbnail);
    setThumbnailFile(null);
    setIsActive(game.isActive);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('name', name.trim());
      if (slug.trim()) formData.append('slug', slug.trim());
      formData.append('description', description.trim());
      formData.append('isActive', String(isActive));

      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      } else if (thumbnailUrl.trim()) {
        formData.append('thumbnail', thumbnailUrl.trim());
      }

      if (editingGame) {
        // Update game
        await axiosClient.put(`/admin/games/${editingGame._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        // Create new game
        await axiosClient.post('/admin/games', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      setModalOpen(false);
      fetchGames();
    } catch (err: unknown) {
      alert(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Lỗi khi lưu thông tin game'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (gameId: string, permanent = false) => {
    const confirmMsg = permanent
      ? 'Bạn có chắc chắn muốn XÓA VĨNH VIỄN game này? Tất cả các bậc rank liên quan có thể bị ảnh hưởng!'
      : 'Bạn có chắc chắn muốn TẮT HOẠT ĐỘNG (xóa mềm) game này?';

    if (!window.confirm(confirmMsg)) return;

    try {
      await axiosClient.delete(`/admin/games/${gameId}${permanent ? '?permanent=true' : ''}`);
      fetchGames();
    } catch {
      alert('Không thể thực hiện xóa game!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-cyan-400" />
            Quản Lý Danh Mục Tựa Game
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Thêm mới tựa game, cập nhật hình ảnh và quản lý trạng thái hiển thị
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto shadow-md shadow-cyan-500/20 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-cyan-500"
        >
          <Plus className="w-4 h-4" />
          Thêm Game Mới
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Games Table */}
      <div className="bg-gaming-card border border-gaming-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Đang tải danh sách game…</div>
        ) : games.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">Chưa có tựa game nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gaming-dark/60 text-slate-400 text-xs font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Ảnh</th>
                  <th className="py-3.5 px-4">Tên Game</th>
                  <th className="py-3.5 px-4">Slug</th>
                  <th className="py-3.5 px-4">Trạng Thái</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gaming-border/60 text-slate-300">
                {games.map((g) => (
                  <tr key={g._id} className="hover:bg-gaming-border/30 transition-colors">
                    <td className="py-3 px-4">
                      <img
                        src={g.thumbnail}
                        alt={g.name}
                        className="w-12 h-10 rounded-lg object-cover border border-gaming-border"
                      />
                    </td>
                    <td className="py-3 px-4 font-bold text-white">{g.name}</td>
                    <td className="py-3 px-4 font-mono text-cyan-400">{g.slug}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          g.isActive
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {g.isActive ? 'Đang mở' : 'Đã khóa'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(g)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(g._id, false)}
                        className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition-colors"
                        title={g.isActive ? 'Khóa game' : 'Mở lại'}
                      >
                        {g.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleDelete(g._id, true)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                        title="Xóa vĩnh viễn"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-gaming-card border border-gaming-border rounded-2xl p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gaming-border">
              <h3 className="text-base font-bold text-white">
                {editingGame ? 'Chỉnh Sửa Thông Tin Game' : 'Thêm Tựa Game Mới'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Tên Game <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Liên Quân Mobile"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gaming-dark border border-gaming-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Slug (Đường dẫn tĩnh)
                </label>
                <input
                  type="text"
                  placeholder="Để trống để tự động sinh từ tên game"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full bg-gaming-dark border border-gaming-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Mô Tả Tựa Game
                </label>
                <textarea
                  rows={2}
                  placeholder="Mô tả tóm tắt về tựa game..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-gaming-dark border border-gaming-border rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              {/* Thumbnail upload or URL */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">
                  Ảnh Đại Diện (Thumbnail) <span className="text-rose-400">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="URL ảnh (https://...)"
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
                {thumbnailFile && (
                  <p className="text-[11px] text-emerald-400">
                    Đã chọn tệp: {thumbnailFile.name} (sẽ được tải lên Cloudinary)
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-500"
                />
                <label htmlFor="isActive" className="text-xs font-semibold text-slate-300">
                  Kích hoạt tựa game (Cho phép khách đặt đơn)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gaming-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-slate-500"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-xs font-bold text-white flex items-center gap-1.5 shadow-md shadow-cyan-500/20 disabled:opacity-50 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-cyan-500"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin motion-reduce:animate-none" />}
                  <span>{editingGame ? 'Cập Nhật' : 'Tạo Mới'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageGames;

