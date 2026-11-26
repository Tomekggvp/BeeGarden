import { useScrollLock } from '../lib/useScrollLock'
import { useState } from 'react'
import { XIcon, Menu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { unsubscribeUserFromPush } from '../lib/pushNotifications'

export const MENU_VISIBILITY_EVENT = 'beegarden:menu-visibility'

const menuItems = [
  { label: 'Список дел', path: '/tasks' },
  { label: 'Лечение', path: '/treatment' },
  { label: 'Откачка', path: '/pumping' },
  { label: 'Графики', path: '/charts' },
  { label: 'Проверки', path: '/checks' },
  { label: 'Локация пасеки', path: '/location' },
  { label: 'Добавить улей', path: '/' },
]

export default function TemporaryDrawer({ isHidden = false }) {
  const [open, setOpen] = useState(false)
  useScrollLock(open)
  const navigate = useNavigate()

  const setMenuVisible = (value) => {
    window.dispatchEvent(new CustomEvent(MENU_VISIBILITY_EVENT, { detail: { open: value } }))
  }

  const closeDrawer = () => {
    setOpen(false)
    setMenuVisible(false)
  }

  const handleNavigate = (path) => {
    closeDrawer()
    navigate(path || '/')
  }

  const handleLogout = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user?.id) {
      await unsubscribeUserFromPush(session.user.id)
      try {
        for (const key of Object.keys(localStorage)) {
          if (key.startsWith('beegarden:') && key.endsWith(session.user.id)) localStorage.removeItem(key)
        }
      } catch { /* Storage may be unavailable. */ }
    }
    await supabase.auth.signOut({ scope: 'local' })
    closeDrawer()
    navigate('/')
  }

  return (
    <div className="pointer-events-none relative z-20 h-16 sm:h-20">
      <button
        type="button"
        hidden={isHidden || open}
        onClick={() => {
          setOpen(true)
          setMenuVisible(true)
        }}
        className="pointer-events-auto fixed left-4 top-4 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#f1d88a] bg-[#fffaf0]/95 text-[#8b4f00] shadow-sm backdrop-blur transition-colors hover:bg-[#fff4cc] sm:left-6 sm:top-6"
        aria-label="Открыть меню"
      >
        <Menu size={20} />
      </button>

      {open && (
        <div
          className="menu-overlay pointer-events-auto fixed inset-0 z-[1000] h-dvh overflow-hidden bg-[#16120b]/90 backdrop-blur-md"
          onClick={closeDrawer}
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              closeDrawer()
            }}
            className="menu-close fixed right-5 top-5 p-3 text-yellow-100 transition-all hover:scale-105 hover:text-white active:scale-95 sm:right-8 sm:top-8"
            aria-label="Закрыть меню"
          >
            <XIcon className="h-8 w-8" />
          </button>
          <nav
            className="menu-panel flex h-full w-full flex-col items-center overflow-y-auto px-6 pb-8 pt-20 sm:px-10"
            onClick={closeDrawer}
            aria-label="Главное меню"
          >
            <div className="my-auto w-full max-w-5xl shrink-0 text-center">
              <div className="flex flex-col items-center gap-2 sm:gap-3">
                {menuItems.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      handleNavigate(item.path)
                    }}
                    className="menu-item font-['Rubik'] text-3xl text-[#fff3b0] drop-shadow-[0_3px_0_rgba(0,0,0,0.35)] transition-colors hover:text-white sm:text-5xl lg:text-6xl"
                  >
                    {item.label}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    handleLogout()
                  }}
                  className="menu-item mt-6 font-['Rubik'] text-3xl text-red-300 drop-shadow-[0_3px_0_rgba(0,0,0,0.35)] transition-colors hover:text-red-100 sm:text-5xl lg:text-6xl"
                >
                  Выйти
                </button>
              </div>
            </div>
          </nav>
        </div>
      )}
    </div>
  )
}
