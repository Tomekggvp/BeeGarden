import { XIcon } from 'lucide-react'
import Beehive from './Beehive'

const BgHome = ({ component = [], removeComponent, onOpenDetails, onAddHive, showDelete = false }) => {
  const isEmpty = component.length === 0

  return (
    <div className="apiary-shell relative mx-auto min-h-[430px] w-full overflow-hidden rounded-lg border border-[#f0b35a] bg-[#fff0c8] p-4 shadow-sm sm:p-6">
      <div className="apiary-topline absolute inset-x-0 top-0 h-1"></div>

      {isEmpty ? (
        <div className="relative z-10 flex min-h-[360px] items-center justify-center text-center">
          <div className="max-w-md">
            <p className="mb-3 font-['Tenor_Sans'] text-4xl text-[#2f2100]">
              Пасека пустая
            </p>
            <p className="mb-6 text-base font-semibold text-[#8b4f00]">
              Добавьте первый улей, чтобы начать карту.
            </p>
            <button
              type="button"
              onClick={onAddHive}
              className="rounded-lg bg-[#f8b400] px-5 py-3 font-black text-[#2b1a00] transition-all hover:bg-[#ffd24a] active:scale-95"
            >
              Добавить улей
            </button>
          </div>
        </div>
      ) : (
        <div className="apiary-grid relative z-10">
          {component.map((item) => (
            <div key={item.id} className="group relative flex justify-center">
              {showDelete && removeComponent && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    removeComponent(item.id)
                  }}
                  className="absolute right-2 top-2 z-20 rounded-lg border border-[#f1d88a] bg-white p-2 text-[#9a5a00] shadow-sm transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                  aria-label={`Удалить улей ${item.number}`}
                >
                  <XIcon size={15} />
                </button>
              )}

              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  onOpenDetails(item.id)
                }}
                className="hive-button rounded-lg p-3 transition-all hover:-translate-y-1 active:translate-y-0"
              >
                <Beehive beehiveNum={item.number} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default BgHome
