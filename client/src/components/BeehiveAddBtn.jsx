import { lazy, Suspense, useState } from 'react'
import { Plus } from 'lucide-react'
import AddBeehiveInfo from './AddBeehiveInfo.jsx'
import BgHome from './BgHome'
import ConfirmDeleteModal from './ConfirmDeleteModal.jsx'
import api from '../api/axios'

const BeehiveDetails = lazy(() => import('./BeehiveDetails'))

const BeehiveAddBtn = ({ session, hives = [], hivesLoading = false, onHivesChange }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [beehiveNum, setBeehiveNum] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [selectedHiveId, setSelectedHiveId] = useState(null)

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [hiveToDelete, setHiveToDelete] = useState(null)

  const updateHives = (updater) => {
    if (onHivesChange) {
      onHivesChange(updater)
    }
  }

  const handleConfirm = async () => {
    const hiveNumber = beehiveNum.trim()

    if (!hiveNumber || !session?.user?.id || isSaving) return

    if (hives.find((item) => String(item.id) === hiveNumber)) {
      alert('Улей с таким номером уже существует!')
      return
    }

    setIsSaving(true)

    try {
      const res = await api.post('/api/hives', {
        user_id: session.user.id,
        hive_number: hiveNumber,
      })

      const newHive = {
        id: res.data.hive_number,
        number: res.data.hive_number,
      }

      updateHives((currentHives) => {
        if (currentHives.some((item) => String(item.id) === String(newHive.id))) {
          return currentHives
        }

        return [...currentHives, newHive]
      })

      setBeehiveNum('')
      setIsAddModalOpen(false)
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка сохранения')
    } finally {
      setIsSaving(false)
    }
  }

  const openDeleteConfirm = (id) => {
    setHiveToDelete(id)
    setIsDeleteModalOpen(true)
  }

  const handleFinalDelete = async () => {
    if (!hiveToDelete || !session?.user?.id) return

    try {
      await api.delete(`/api/hives/${hiveToDelete}`, {
        params: { user_id: session.user.id },
      })

      updateHives((currentHives) =>
        currentHives.filter((item) => String(item.id) !== String(hiveToDelete))
      )
      setIsDeleteModalOpen(false)
      setHiveToDelete(null)
    } catch (err) {
      console.error('Ошибка удаления:', err)
      alert('Не удалось удалить улей')
    }
  }

  return (
    <main className="min-h-[calc(100vh-56px)] px-4 pb-10 sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-6xl pt-3 sm:pt-6">
        <div className="mb-6 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-lg border border-[#f8b400]/35 bg-[#fffaf0] px-3 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#9a5a00] shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[#f8b400]"></span>
              BeeGarden
            </div>
            <h1 className="max-w-3xl font-['Tenor_Sans'] text-5xl leading-none text-[#2f2100] sm:text-7xl">
              Пасека
            </h1>
            <p className="mt-3 max-w-xl text-base font-semibold text-[#6f5a26]">
              Лёгкая карта ульев для быстрых проверок и записей.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-lg border border-[#f1d88a] bg-[#fffaf0] px-4 py-3 shadow-sm">
              <span className="block text-xs font-black uppercase tracking-[0.2em] text-[#9a5a00]">
                Ульев
              </span>
              <strong className="text-3xl font-black leading-none text-[#2f2100]">
                {hives.length}
              </strong>
            </div>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#f8b400] px-5 py-4 font-black text-[#2b1a00] shadow-[0_10px_22px_rgba(248,180,0,0.24)] transition-all hover:-translate-y-0.5 hover:bg-[#ffd24a] active:translate-y-0"
            >
              <Plus size={20} />
              Добавить улей
            </button>
          </div>
        </div>

        {hivesLoading && hives.length === 0 ? (
          <div className="apiary-shell flex min-h-[360px] items-center justify-center rounded-lg border border-[#f1d88a] bg-[#fffaf0] p-8 shadow-sm">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="h-10 w-10 rounded-full border-4 border-[#ffd24a] border-t-[#b77900] animate-spin"></div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9a5a00]">
                Загрузка пасеки...
              </p>
            </div>
          </div>
        ) : (
          <BgHome
            component={hives}
            removeComponent={openDeleteConfirm}
            onOpenDetails={(id) => {
              setSelectedHiveId(id)
              setIsDetailsOpen(true)
            }}
            onAddHive={() => setIsAddModalOpen(true)}
            showDelete
          />
        )}
      </section>

      <AddBeehiveInfo
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onConfirm={handleConfirm}
        beehiveNum={beehiveNum}
        setBeehiveNum={setBeehiveNum}
        isSaving={isSaving}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleFinalDelete}
        hiveId={hiveToDelete}
      />

      {isDetailsOpen && (
        <Suspense fallback={null}>
          <BeehiveDetails
            isOpen={isDetailsOpen}
            onClose={() => {
              setIsDetailsOpen(false)
              setSelectedHiveId(null)
            }}
            hiveId={selectedHiveId}
            session={session}
          />
        </Suspense>
      )}
    </main>
  )
}

export default BeehiveAddBtn
