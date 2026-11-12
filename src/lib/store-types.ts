import type {rootReducer,makeStore} from '@/lib/store';
export type RootState=ReturnType<typeof rootReducer>;
export type AppStore=ReturnType<typeof makeStore>;
