import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserProfile {
  id: number;
  email: string;
  fullName: string;
  role: string;
  permissions?: string[];
  avatarUrl?: string;
  [key: string]: any;
}

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isInitializing: true,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (state, action: PayloadAction<UserProfile>) => {
      // Lọc bỏ các trường nhạy cảm (token...) trước khi lưu vào store để tránh phơi bày JWT (phòng thủ XSS)
      const { token, accessToken, refreshToken, idToken, password, ...safeUser } = action.payload as any;
      state.user = safeUser as UserProfile;
      state.isAuthenticated = true;
      state.isInitializing = false;
    },
    logoutSuccess: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isInitializing = false;
    },
    setInitializing: (state, action: PayloadAction<boolean>) => {
      state.isInitializing = action.payload;
    },
  },
});

export const { setAuth, logoutSuccess, setInitializing } = authSlice.actions;

export default authSlice.reducer;
