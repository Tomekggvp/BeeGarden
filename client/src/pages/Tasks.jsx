import { useState } from 'react'
import { Bell } from 'lucide-react'
import BgHome from '../components/BgHome'
import TaskModal from '../components/TaskModal'
import TaskNotificationsModal from '../components/TaskNotificationsModal'

const Tasks = ({ session, hives }) => {
  const [selectedHiveId, setSelectedHiveId] = useState(null)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false)

  const handleOpenTasks = (id) => {
    setSelectedHiveId(id)
    setIsTaskModalOpen(true)
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
            Задачи
          </h1>
          <p className="mt-3 max-w-xl text-base font-semibold text-[#6f5a26]">
            Выберите улей, чтобы назначить задачу или открыть историю уведомлений.
          </p>

          <button
            type="button"
            onClick={() => setIsNotificationsModalOpen(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#f1d88a] bg-[#fffaf0] px-4 py-3 text-sm font-black text-[#8b4f00] transition-all hover:border-[#f8b400] hover:bg-[#fff4cc]"
          >
            <Bell size={16} />
            История уведомлений
          </button>
        </div>

        <BgHome
          component={hives}
          onOpenDetails={handleOpenTasks}
          showDelete={false}
        />
      </section>

      {isTaskModalOpen && (
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          hiveId={selectedHiveId}
          session={session}
        />
      )}

      {isNotificationsModalOpen && (
        <TaskNotificationsModal
          isOpen={isNotificationsModalOpen}
          onClose={() => setIsNotificationsModalOpen(false)}
          session={session}
        />
      )}
    </main>
  )
}

export default Tasks
