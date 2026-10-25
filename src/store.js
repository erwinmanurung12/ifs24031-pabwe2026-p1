import { configureStore } from "@reduxjs/toolkit";
import auth from "./features/auth/states/slice";
import users from "./features/users/states/slice";
import tournaments from "./features/tournaments/states/slice";

export const makeStore = (preloadedState) => configureStore({ reducer: { auth, tournaments, users }, preloadedState });
export const store = makeStore();
