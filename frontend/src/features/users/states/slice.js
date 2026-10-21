import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "../../../helpers/apiHelper";

const thunk = (type, fn) =>
  createAsyncThunk(type, async (arg, { rejectWithValue }) => {
    try { return await fn(arg); } catch (e) { return rejectWithValue(e.message); }
  });

export const fetchUsers = thunk("users/list", () => api("/users"));
export const createUser = thunk("users/create", (body) => api("/users", { method: "POST", body }));
export const deleteUser = thunk("users/delete", (id) => api(`/users/${id}`, { method: "DELETE" }));

const slice = createSlice({
  name: "users",
  initialState: { list: [] },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchUsers.fulfilled, (s, a) => { s.list = a.payload; });
  },
});

export default slice.reducer;
