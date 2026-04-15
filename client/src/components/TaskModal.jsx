import { useEffect, useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { supabase } from '../services/supabaseClient'

const TaskModal = ({ isOpen, onClose, hiveId, session }) => {
  const [tasks, setTasks] = useState([])
  const [text, setText] = useState('')

  useEffect(() => {
    if (isOpen && hiveId) {
      const fetchTasks = async () => {
        const { data } = await supabase
          .from('tasks')
          .select('*')
          .eq('hive_id', String(hiveId))
          .eq('user_id', session.user.id)

        setTasks(data || [])
      }

      fetchTasks()
    }
  }, [isOpen, hiveId, session])

  const handleAdd = async () => {
    const taskText = text.trim()
    if (!taskText) return

    const { data, error } = await supabase
      .from('tasks')
      .insert([{ hive_id: String(hiveId), user_id: session.user.id, task_text: taskText }])
      .select()

    if (!error) {
      setTasks((currentTasks) => [...currentTasks, data[0]])
      setText('')
    }
  }

  const handleDelete = async (id) => {
    await supabase.from('tasks').delete().eq('id', id)
    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== id))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#111827]/35 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-md rounded-lg border border-[#f1d88a] bg-[#fffdf7] p-6 shadow-[0_24px_70px_rgba(93,58,0,0.18)]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-[#9a5a00] transition-colors hover:bg-[#fff4cc] hover:text-[#2f2100]"
          aria-label="Закрыть"
        >
          <X size={22} />
        </button>

        <p className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-[#9a5a00]">
          Задачи
        </p>
        <h2 className="font-['Tenor_Sans'] text-4xl leading-none text-[#2f2100]">
          Улей №{hiveId}
        </h2>

        <div className="mt-6 flex gap-2">
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            className="min-w-0 flex-1 rounded-lg border-2 border-[#f1d88a] bg-white px-4 py-3 font-semibold text-[#2f2100] outline-none transition-all focus:border-[#f8b400] focus:ring-4 focus:ring-[#f8b400]/20"
            placeholder="Добавить задачу..."
          />
          <button
            type="button"
            onClick={handleAdd}
            className="rounded-lg bg-[#f8b400] px-4 text-[#2b1a00] transition-all hover:bg-[#ffd24a] active:scale-95"
            aria-label="Добавить задачу"
          >
            <Plus />
          </button>
        </div>

        <div className="mt-5 max-h-64 space-y-2 overflow-y-auto pr-1">
          {tasks.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[#f1d88a] bg-white/70 px-4 py-5 text-center text-sm font-semibold text-[#7a5a1a]">
              Для этого улья пока нет задач.
            </p>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-[#f1d88a] bg-white px-4 py-3"
              >
                <span className="min-w-0 flex-1 break-words font-semibold text-[#2f2100]">
                  {task.task_text}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(task.id)}
                  className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
                  aria-label="Удалить задачу"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default TaskModal
