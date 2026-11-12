import {configureStore,combineReducers} from '@reduxjs/toolkit';import cartReducer from '@/lib/cart';
export const rootReducer=combineReducers({cart:cartReducer});
export const makeStore=()=>configureStore({reducer:rootReducer});
