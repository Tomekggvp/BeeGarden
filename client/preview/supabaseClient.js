import { PREVIEW_USER_ID, query, channel, removeChannel, getRows } from './store'

const previewSession = { user: { id: PREVIEW_USER_ID, email: 'preview@beegarden.local' }, access_token: 'local-preview-only' }
let session = previewSession
const listeners = new Set()
export const supabase = {
  from: query, channel, removeChannel,
  rpc: async (name) => ({ data: name === 'ensure_default_apiary' ? getRows('apiaries').filter((row) => row.is_default) : null, error: null }),
  auth: {
    getSession: async () => ({ data: { session }, error: null }),
    onAuthStateChange(callback) {
      listeners.add(callback)
      return { data: { subscription: { unsubscribe: () => listeners.delete(callback) } } }
    },
    signInWithPassword: async () => { session = previewSession; listeners.forEach((callback) => callback('SIGNED_IN', session)); return { data: { session }, error: null } },
    signOut: async () => { session = null; listeners.forEach((callback) => callback('SIGNED_OUT', null)); return { error: null } },
  },
}
