import { lazy, Suspense, useState } from 'react'
import { Plus } from 'lucide-react'
import AddBeehiveInfo from './AddBeehiveInfo.jsx'
import BgHome from './BgHome'
import ConfirmDeleteModal from './ConfirmDeleteModal.jsx'
import { supabase } from '../services/supabaseClient'
import { createUserHive, deleteUserHive, moveUserHive } from '../lib/hiveData'
import ApiaryPanel from './ApiaryPanel'

const BeehiveDetails = lazy(() => import('./BeehiveDetails'))

const BeehiveAddBtn = ({ session, hives = [], hivesLoading = false, hivesError, onRetryHives, onHivesChange, apiaryControls }) => {
  const { activeApiary, apiaries } = apiaryControls
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [beehiveNum, setBeehiveNum] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const openAddModal = () => { setSaveError(''); setIsAddModalOpen(true) }

  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [selectedHiveId, setSelectedHiveId] = useState(null)
  const [transferMessage, setTransferMessage] = useState('')

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [hiveToDelete, setHiveToDelete] = useState(null)

  const updateHives = (updater) => {
    if (onHivesChange) {
      onHivesChange(updater)
    }
  }

  const handleConfirm = async () => {
    const hiveNumber = beehiveNum.trim()

    if (!hiveNumber || !session?.user?.id || !activeApiary || isSaving) return

    if (hives.find((item) => String(item.id) === hiveNumber)) {
      setSaveError('Улей с таким номером уже существует!')
      return
    }

    setIsSaving(true)
    setSaveError('')

    try {
      const data = await createUserHive(supabase, session.user.id, hiveNumber, activeApiary.id)

      const newHive = {
        id: data.hive_number,
        number: data.hive_number,
        apiaryId: data.apiary_id,
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
      setSaveError(err.message || 'Ошибка сохранения')
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
      await deleteUserHive(supabase, session.user.id, hiveToDelete)

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
        <ApiaryPanel key={activeApiary?.id} {...apiaryControls} />
        {hivesError && <div role={hives.length ? 'status' : 'alert'} className="mb-4 rounded-lg border border-[#f1d88a] bg-[#fffaf0] px-4 py-3 text-sm font-bold text-[#7a5a1a]"><p>{hives.length ? 'Показаны сохранённые ульи. Обновим автоматически при восстановлении связи.' : hivesError}</p><button type="button" onClick={onRetryHives} className="mt-2 min-h-12 rounded-lg border border-[#f1d88a] px-4 py-3">Обновить сейчас</button></div>}
        {transferMessage && <p role="status" className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-800">{transferMessage}</p>}
        <div className="mb-6 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="mb-3 hidden items-center gap-2 rounded-lg border border-[#f8b400]/35 bg-[#fffaf0] px-3 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#9a5a00] shadow-sm sm:inline-flex">
              <span className="h-2 w-2 rounded-full bg-[#f8b400]"></span>
              BeeGarden
            </div>
            <h1 className="max-w-3xl break-words font-['Tenor_Sans'] text-4xl leading-none text-[#2f2100] sm:text-7xl">
              <span className="sm:hidden">Ульи</span>
              <span className="hidden sm:inline">{activeApiary?.name || 'Пасека'}</span>
            </h1>
            <p className="mt-3 hidden max-w-xl text-base font-semibold text-[#6f5a26] sm:block">
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
              onClick={openAddModal}
              disabled={!activeApiary || apiaryControls.loading}
              className="inline-flex items-center gap-2 rounded-lg bg-[#f8b400] px-5 py-4 font-black text-[#2b1a00] shadow-[0_10px_22px_rgba(248,180,0,0.24)] transition-all hover:-translate-y-0.5 hover:bg-[#ffd24a] active:translate-y-0"
            >
              <Plus size={20} />
              Добавить улей
            </button>
          </div>
        </div>

        {(hivesLoading || apiaryControls.loading) && hives.length === 0 ? (
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
            onAddHive={openAddModal}
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
        errorMessage={saveError}
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
            apiaries={apiaries}
            currentApiaryId={activeApiary.id}
            onTransfer={async (destinationId) => {
              const data = await moveUserHive(supabase, session.user.id, selectedHiveId, destinationId)
              updateHives((current) => current.map((item) => String(item.id) === String(selectedHiveId)
                ? { ...item, apiaryId: data.apiary_id } : item))
              setTransferMessage(`Улей №${selectedHiveId} перенесён в пасеку «${apiaries.find((item) => item.id === destinationId)?.name || ''}». Номер сохранён.`)
              setIsDetailsOpen(false)
              setSelectedHiveId(null)
            }}
          />
        </Suspense>
      )}
    </main>
  )
}

export default BeehiveAddBtn
