import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axiosClient from '../api/axiosClient';
import type { IUser, LoginPayload, RegisterPayload, AuthResponse } from '../types';

interface AuthState {
  user: IUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  fetchMe: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (payload: LoginPayload) => {
        set({ isLoading: true });
        try {
          const res = await axiosClient.post<AuthResponse>('/auth/login', payload);
          const { token, user } = res.data;
          set({
            token,
            user: {
              _id: user.id || user._id,
              name: user.name,
              email: user.email,
              role: user.role,
              phoneNumber: user.phoneNumber,
            },
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (payload: RegisterPayload) => {
        set({ isLoading: true });
        try {
          const res = await axiosClient.post<AuthResponse>('/auth/register', payload);
          const { token, user } = res.data;
          set({
            token,
            user: {
              _id: user.id || user._id,
              name: user.name,
              email: user.email,
              role: user.role,
              phoneNumber: user.phoneNumber,
            },
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      fetchMe: async () => {
        const { token } = get();
        if (!token) return;
        try {
          const res = await axiosClient.get<{ success: boolean; user: IUser }>('/auth/me');
          if (res.data.success && res.data.user) {
            set({
              user: res.data.user,
              isAuthenticated: true,
            });
          }
        } catch {
          get().logout();
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

