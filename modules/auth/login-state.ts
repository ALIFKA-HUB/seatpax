import type { AuthResult } from './service';
export type LoginState = { email: string; stage: 'email' | 'code'; pending: boolean; message: string; resendAt: number; requestId: number };
export const initialLoginState: LoginState = { email: '', stage: 'email', pending: false, message: '', resendAt: 0, requestId: 0 };
export type LoginEvent =
  | { type: 'editEmail'; email: string }
  | { type: 'startRequest'; now: number }
  | { type: 'requestResult'; id: number; email: string; result: AuthResult; now: number }
  | { type: 'startVerify' }
  | { type: 'verifyResult'; id: number; result: AuthResult }
  | { type: 'reset' }
  | { type: 'clearError' };
export function loginReducer(state: LoginState, event: LoginEvent): LoginState {
  switch (event.type) {
    case 'editEmail': return { ...initialLoginState, email: event.email, requestId: state.requestId + 1 };
    case 'reset': return { ...initialLoginState, email: state.email, requestId: state.requestId + 1 };
    case 'clearError': return { ...state, message: '' };
    case 'startRequest':
      if (state.pending || event.now < state.resendAt) return state;
      return { ...state, pending: true, message: '', requestId: state.requestId + 1 };
    case 'startVerify':
      return state.pending ? state : { ...state, pending: true, message: '', requestId: state.requestId + 1 };
    case 'requestResult':
      if (event.id !== state.requestId || event.email !== state.email) return state;
      return event.result.ok
        ? { ...state, stage: 'code', pending: false, resendAt: event.now + 60_000, message: '' }
        : { ...state, pending: false, message: event.result.message };
    case 'verifyResult':
      if (event.id !== state.requestId) return state;
      return { ...state, pending: false, message: event.result.ok ? '' : event.result.message };
  }
}
