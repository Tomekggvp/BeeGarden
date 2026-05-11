import { useState } from 'react'
import { XIcon, Menu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'

export const MENU_VISIBILITY_EVENT = 'beegarden:menu-visibility'

const menuItems = [
  { label: 'Список дел', path: '/tasks' },
  { label: 'Лечение', path: '/treatment' },
  { label: 'Откачка', path: '/pumping' },
  { label: 'Графики', path: '/charts' },
  { label: 'Проверки', path: '/checks' },
  { label: 'Выбор локации', path: '/location' },
  { label: 'Добавить улей', path: '/' },
]

export default function TemporaryDrawer() {
  const [open, setOpen] = useState(false)
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
    await supabase.auth.signOut()
    closeDrawer()
    navigate('/')
  }

  return (
    <div className="relative z-20">
      <button
        type="button"
        onClick={() => {
          setOpen(true)
          setMenuVisible(true)
        }}
        className="relative z-20 p-3 text-black transition-transform hover:scale-105 active:scale-95"
        aria-label="Открыть меню"
      >
        <Menu className="h-7 w-7" />
      </button>

      {open && (
        <div
          className="menu-overlay fixed inset-0 z-[1000] min-h-screen bg-[#16120b]/90 backdrop-blur-md"
          onClick={closeDrawer}
        >
          <nav
            className="menu-panel relative flex min-h-screen w-full items-center justify-center overflow-y-auto px-6 py-8 sm:px-10"
            onClick={closeDrawer}
            aria-label="Главное меню"
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

            <div className="w-full max-w-5xl text-center">
              <p className="menu-kicker mb-6 text-sm font-bold uppercase tracking-[0.35em] text-yellow-300 sm:text-base">
                BeeGarden
              </p>

              <div className="flex flex-col items-center gap-2 sm:gap-3">
                {menuItems.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      handleNavigate(item.path)
                    }}
                    className="menu-item font-['Tenor_Sans'] text-3xl text-[#fff3b0] drop-shadow-[0_3px_0_rgba(0,0,0,0.35)] transition-colors hover:text-white sm:text-5xl lg:text-6xl"
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
                  className="menu-item mt-6 font-['Tenor_Sans'] text-3xl text-red-300 drop-shadow-[0_3px_0_rgba(0,0,0,0.35)] transition-colors hover:text-red-100 sm:text-5xl lg:text-6xl"
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
