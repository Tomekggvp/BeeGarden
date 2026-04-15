import { useState } from 'react'
import { XIcon, Menu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'

const menuItems = [
  { label: 'Список дел', path: 'Tasks' },
  { label: 'Записи', path: 'Notes' },
  { label: 'Лечение', path: 'Treatment' },
  { label: 'Ветеринарный контроль', path: 'VetControl' },
  { label: 'Пчелосемьи', path: 'BeeColonyGraphics' },
  { label: 'Проверки', path: 'ChecksPerformed' },
  { label: 'Календарь', path: 'Calendar' },
  { label: 'Выбор локации', path: 'Location' },
  { label: 'Добавить улей', path: '' },
]

export default function TemporaryDrawer() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const closeDrawer = () => setOpen(false)

  const handleNavigate = (path) => {
    closeDrawer()
    navigate(`/${path}`)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    closeDrawer()
    navigate('/')
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="p-3 text-black hover:scale-105 active:scale-95 transition-transform"
        aria-label="Открыть меню"
      >
        <Menu className="w-7 h-7" />
      </button>

      {open && (
        <div
          className="menu-overlay fixed inset-0 z-[1000] min-h-screen bg-[#16120b]/90 backdrop-blur-md"
          onClick={closeDrawer}
        >
          <nav
            className="menu-panel relative min-h-screen w-full px-6 py-8 sm:px-10 flex items-center justify-center overflow-y-auto"
            onClick={closeDrawer}
            aria-label="Главное меню"
          >
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                closeDrawer()
              }}
              className="menu-close fixed top-5 right-5 sm:top-8 sm:right-8 p-3 text-yellow-100 hover:text-white hover:scale-105 active:scale-95 transition-all"
              aria-label="Закрыть меню"
            >
              <XIcon className="w-8 h-8" />
            </button>

            <div className="w-full max-w-5xl text-center">
              <p className="menu-kicker mb-6 text-sm sm:text-base font-bold uppercase text-yellow-300 tracking-[0.35em]">
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
                    className="menu-item font-['Tenor_Sans'] text-3xl sm:text-5xl lg:text-6xl text-[#fff3b0] hover:text-white drop-shadow-[0_3px_0_rgba(0,0,0,0.35)] transition-colors"
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
                  className="menu-item mt-6 font-['Tenor_Sans'] text-3xl sm:text-5xl lg:text-6xl text-red-300 hover:text-red-100 drop-shadow-[0_3px_0_rgba(0,0,0,0.35)] transition-colors"
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
