import React, { useState } from 'react'
import BgHome from '../components/BgHome'
import TaskModal from '../components/TaskModal' 

const Tasks = ({ session, hives }) => {
  const [selectedHiveId, setSelectedHiveId] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleOpenTasks = (id) => {
    setSelectedHiveId(id)
    setIsModalOpen(true)
  }

  return (
    <div className="min-h-screen pt-16 pb-10">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-black text-yellow-900 uppercase tracking-widest">
          Задачи
        </h1>
        <p className="text-gray-500">Выберите улей, чтобы назначить задачу</p>
      </div>

      <BgHome 
        component={hives} 
        onOpenDetails={handleOpenTasks} 
        removeComponent={() => {}} 
      />

      {isModalOpen && (
        <TaskModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          hiveId={selectedHiveId}
          session={session}
        />
      )}
    </div>
  )
}

export default Tasks