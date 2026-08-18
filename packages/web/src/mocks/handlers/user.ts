/**
 * Handlers for the user module (identity).
 */

import { http, HttpResponse } from 'msw';
import { store } from '../store.js';
import { API } from './shared.js';

export const userHandlers = [http.get(`${API}/auth/me`, () => HttpResponse.json(store.user))];
