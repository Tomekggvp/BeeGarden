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
        className="p-3 text-black"
        aria-label="Открыть меню"
      >
        <Menu />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[1000] bg-black/45 backdrop-blur-sm"
          onClick={closeDrawer}
        >
          <nav
            className="absolute inset-y-0 left-0 w-[82vw] max-w-sm bg-black/70 text-[#eaebb2] shadow-2xl p-6 flex flex-col justify-center"
            onClick={(event) => event.stopPropagation()}
            aria-label="Главное меню"
          >
            <button
              type="button"
              onClick={closeDrawer}
              className="absolute top-6 right-6 p-1 text-[#eaebb2] hover:text-white transition-colors"
              aria-label="Закрыть меню"
            >
              <XIcon className="w-6 h-6" />
            </button>

            <div className="flex flex-col gap-3">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleNavigate(item.path)}
                  className="text-left text-2xl md:text-3xl font-semibold hover:text-white transition-colors"
                >
                  {item.label}
                </button>
              ))}

              <button
                type="button"
                onClick={handleLogout}
                className="text-left text-2xl md:text-3xl font-semibold text-red-300 hover:text-red-200 transition-colors mt-3"
              >
                Выйти
              </button>
            </div>
          </nav>
        </div>
      )}
    </div>
  )
}
