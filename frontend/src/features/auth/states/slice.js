import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api, clearSession, getUser, setSession } from "../../../helpers/apiHelper";

const thunk = (type, fn) =>
  createAsyncThunk(type, async (arg, { rejectWithValue }) => {
    try { return await fn(arg); } catch (e) { return rejectWithValue(e.message); }
  });

export const login = thunk("auth/login", async (creds) => {
  const data = await api("/auth/login", { method: "POST", body: creds });
  setSession(data.token, data.user);
  return data.user;
});

export const register = thunk("auth/register", (body) => api("/auth/register", { method: "POST", body }));

const slice = createSlice({
  name: "auth",
  initialState: { user: getUser(), loading: false },
  reducers: {
    logout(state) { clearSession(); state.user = null; },
  },
  extraReducers: (b) => {
    b.addCase(login.pending, (s) => { s.loading = true; })
      .addCase(login.fulfilled, (s, a) => { s.loading = false; s.user = a.payload; })
      .addCase(login.rejected, (s) => { s.loading = false; })
      .addCase(register.pending, (s) => { s.loading = true; })
      .addCase(register.fulfilled, (s) => { s.loading = false; })
      .addCase(register.rejected, (s) => { s.loading = false; });
  },
});

export const { logout } = slice.actions;
export default slice.reducer;
