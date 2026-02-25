import React, { useEffect, useState } from 'react'
import AddBeehiveInfo from './AddBeehiveInfo.jsx'
import BgHome from './BgHome'
import BeehiveDetails from './BeehiveDetails'

const BeehiveAddBtn = ({ session }) => {
  const [component, setComponent] = useState([])
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [beehiveNum, setBeehiveNum] = useState('')
  
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [selectedHiveId, setSelectedHiveId] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem('beehiveComponent')
    if (saved) setComponent(JSON.parse(saved))
  }, [])

  useEffect(() => {
    localStorage.setItem('beehiveComponent', JSON.stringify(component))
  }, [component])

  const handleConfirm = () => {
    if (!beehiveNum) return;

    if (component.find(item => item.id === beehiveNum)) {
      alert("Улей с таким номером уже существует!");
      return;
    }

    const newComponent = {
      id: beehiveNum, 
      number: beehiveNum, 
      createdAt: new Date().toISOString()
    }

    setComponent([...component, newComponent]);
    setBeehiveNum('');
    setIsAddModalOpen(false);
  }

  const handleOpenDetails = (id) => {
    setSelectedHiveId(id);
    setIsDetailsOpen(true);
  }

  return (
    <div> 
      <div className='flex flex-col justify-end items-center mb-6'>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className='px-8 py-3 bg-yellow-400 font-bold rounded-lg shadow-md hover:bg-yellow-500 transition-all'
        >
          Добавить улей
        </button>
      </div>

      <BgHome 
        component={component}
        removeComponent={(id) => setComponent(component.filter(item => item.id !== id))}
        onOpenDetails={handleOpenDetails} 
      />

      <AddBeehiveInfo
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onConfirm={handleConfirm}
        beehiveNum={beehiveNum}
        setBeehiveNum={setBeehiveNum}
      />


      {isDetailsOpen && (
        <BeehiveDetails 
          isOpen={isDetailsOpen}
          onClose={() => {
            setIsDetailsOpen(false);
            setSelectedHiveId(null);
          }}
          hiveId={selectedHiveId}
          session={session} 
        />
      )}
    </div>
  )
}

export default BeehiveAddBtn