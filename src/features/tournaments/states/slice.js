import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "../../../helpers/apiHelper";

const thunk = (type, fn) =>
  createAsyncThunk(type, async (arg, { rejectWithValue }) => {
    try { return await fn(arg); } catch (e) { return rejectWithValue(e.message); }
  });

export const fetchOverview = thunk("tournaments/overview", () => api("/overview"));
export const fetchDetail = thunk("tournaments/detail", async (id) => {
  const [tournament, teams, matches, standings] = await Promise.all([
    api(`/tournaments/${id}`),
    api(`/tournaments/${id}/teams`),
    api(`/tournaments/${id}/matches`),
    api(`/tournaments/${id}/standings`),
  ]);
  return { tournament, teams, matches, standings };
});
export const createTournament = thunk("tournaments/create", (body) => api("/tournaments", { method: "POST", body }));
export const addTeam = thunk("tournaments/addTeam", ({ id, name }) =>
  api(`/tournaments/${id}/teams`, { method: "POST", body: { name } }));
export const addPlayer = thunk("tournaments/addPlayer", ({ teamId, ...body }) =>
  api(`/teams/${teamId}/players`, { method: "POST", body }));
export const updateTournament = thunk("tournaments/update", ({ id, ...body }) =>
  api(`/tournaments/${id}`, { method: "PUT", body }));
export const deleteMatch = thunk("tournaments/deleteMatch", (matchId) =>
  api(`/matches/${matchId}`, { method: "DELETE" }));
export const fetchComments = thunk("tournaments/comments", (id) => api(`/tournaments/${id}/comments`));
export const postComment = thunk("tournaments/postComment", ({ id, body }) =>
  api(`/tournaments/${id}/comments`, { method: "POST", body: { body } }));
export const deleteComment = thunk("tournaments/deleteComment", (id) => api(`/comments/${id}`, { method: "DELETE" }));
export const addMatch = thunk("tournaments/addMatch", ({ id, ...body }) =>
  api(`/tournaments/${id}/matches`, { method: "POST", body }));
export const saveScore = thunk("tournaments/saveScore", ({ matchId, ...body }) =>
  api(`/matches/${matchId}`, { method: "PUT", body }));

const slice = createSlice({
  name: "tournaments",
  initialState: { overview: { tournaments: [], recent: [], upcoming: [] }, current: null, comments: [], teams: [], matches: [], standings: [], loading: false },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchOverview.pending, (s) => { s.loading = true; })
      .addCase(fetchOverview.fulfilled, (s, a) => { s.loading = false; s.overview = a.payload; })
      .addCase(fetchOverview.rejected, (s) => { s.loading = false; })
      .addCase(fetchDetail.pending, (s) => { s.loading = true; })
      .addCase(fetchDetail.fulfilled, (s, { payload }) => {
        s.loading = false;
        s.current = payload.tournament;
        s.teams = payload.teams;
        s.matches = payload.matches;
        s.standings = payload.standings;
      })
      .addCase(fetchComments.fulfilled, (s, a) => { s.comments = a.payload; })
      .addCase(fetchDetail.rejected, (s) => { s.loading = false; s.current = null; });
  },
});

export default slice.reducer;
