import { XIcon } from 'lucide-react'
import { assets } from '../assets/assets'
import Beehive from './Beehive'

const BgHome = ({
  component = [],
  removeComponent,
  onOpenDetails,
  onAddHive,
  showDelete = false,
  badgeByHiveId = {},
}) => {
  const isEmpty = component.length === 0

  return (
    <div
      className="apiary-shell relative mx-auto min-h-[240px] w-full overflow-hidden rounded-lg bg-cover bg-center p-4 sm:p-6"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(255, 238, 145, 0.24), rgba(255, 154, 31, 0.2)), url(${assets.gras})`,
      }}
    >
      {isEmpty ? (
        <div className="relative z-10 flex min-h-[180px] items-center justify-center text-center">
          <div className="max-w-md rounded-lg border border-[#f1d88a] bg-[#fffaf0]/90 p-6 shadow-sm backdrop-blur">
            <p className="mb-3 font-['Rubik'] text-4xl text-[#2f2100]">
              Пасека пустая
            </p>
            <p className="mb-6 text-base font-semibold text-[#8b4f00]">
              Добавьте первый улей, чтобы начать карту.
            </p>
            <button
              type="button"
              onClick={onAddHive}
              className="min-h-11 rounded-lg primary-action px-5 py-3 font-black transition-colors "
            >
              Добавить улей
            </button>
          </div>
        </div>
      ) : (
        <div className="apiary-grid relative z-10">
          {component.map((item) => (
            <div key={item.id} className="group flex justify-center">
              <div className="relative inline-flex">
              {showDelete && removeComponent && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    removeComponent(item.id)
                  }}
                  className="absolute right-1 top-1 z-20 flex h-11 w-11 items-center justify-center rounded-full text-[#9a5a00] transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 sm:h-11 sm:w-11"
                  aria-label={`Удалить улей ${item.number}`}
                >
                  <XIcon className="h-6 w-6 rounded-full border border-[#f1d88a] bg-white p-1 shadow-sm" />
                </button>
              )}

              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  onOpenDetails(item.id)
                }}
                className="hive-button !w-auto rounded-lg p-1 transition-all hover:-translate-y-1 active:translate-y-0"
              >
                <Beehive
                  beehiveNum={item.number}
                  badges={badgeByHiveId[String(item.id)] || badgeByHiveId[String(item.number)] || []}
                />
              </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default BgHome
