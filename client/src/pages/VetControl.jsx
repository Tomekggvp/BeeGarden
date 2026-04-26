import { useEffect, useMemo, useState } from 'react'
import BgHome from '../components/BgHome'
import PumpingModal from '../components/PumpingModal'
import { fetchHiveChecksMap } from '../lib/hiveChecks'

const VetControl = ({ session, hives }) => {
  const [selectedHiveId, setSelectedHiveId] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [checkMap, setCheckMap] = useState({})

  useEffect(() => {
    if (!session?.user?.id) return

    const loadCheckMap = async () => {
      try {
        const nextMap = await fetchHiveChecksMap(session.user.id)
        setCheckMap(nextMap)
      } catch (error) {
        console.error('Load pumping check flags error:', error)
      }
    }

    loadCheckMap()
  }, [session?.user?.id])

  const badgeByHiveId = useMemo(
    () =>
      Object.entries(checkMap).reduce((accumulator, [hiveId, state]) => {
        if (state.pumpingRequired) {
          accumulator[hiveId] = [
            {
              kind: 'pumping',
              title: 'Требуется откачка мёда',
            },
          ]
        }

        return accumulator
      }, {}),
    [checkMap]
  )

  const handleOpenPumping = (id) => {
    setSelectedHiveId(id)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedHiveId(null)
  }

  const handlePumpingSaved = (hiveId) => {
    setCheckMap((currentMap) => ({
      ...currentMap,
      [String(hiveId)]: {
        ...(currentMap[String(hiveId)] || {}),
        pumpingRequired: false,
      },
    }))
  }

  return (
    <main className="min-h-[calc(100vh-56px)] px-4 pb-10 sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-6xl pt-6">
        <div className="mb-6">
          <div className="mb-3 inline-flex items-center gap-2 rounded-lg border border-[#f8b400]/35 bg-[#fffaf0] px-3 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#9a5a00] shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#f8b400]"></span>
            BeeGarden
          </div>
          <h1 className="font-['Tenor_Sans'] text-5xl leading-none text-[#2f2100] sm:text-7xl">
            Откачка
          </h1>
          <p className="mt-3 max-w-xl text-base font-semibold text-[#6f5a26]">
            Выберите улей, чтобы добавить запись об откачке мёда.
          </p>
        </div>

        <BgHome
          component={hives}
          onOpenDetails={handleOpenPumping}
          showDelete={false}
          badgeByHiveId={badgeByHiveId}
        />
      </section>

      {isModalOpen && (
        <PumpingModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          hiveId={selectedHiveId}
          session={session}
          onPumpingSaved={handlePumpingSaved}
        />
      )}
    </main>
  )
}

export default VetControl
