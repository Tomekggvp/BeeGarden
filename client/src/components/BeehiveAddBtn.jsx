import { lazy, Suspense, useState } from 'react'
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
    <div>
      <div className="flex flex-col justify-end items-center mb-6">
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-8 py-3 bg-yellow-400 font-bold rounded-lg shadow-md hover:bg-yellow-500 transition-all"
        >
          Добавить улей
        </button>
      </div>

      {hivesLoading && hives.length === 0 ? (
        <div className="flex flex-col items-center py-10 gap-2">
          <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 text-sm">Загрузка пасеки...</p>
        </div>
      ) : (
        <BgHome
          component={hives}
          removeComponent={openDeleteConfirm}
          onOpenDetails={(id) => {
            setSelectedHiveId(id)
            setIsDetailsOpen(true)
          }}
        />
      )}

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
    </div>
  )
}

export default BeehiveAddBtn
