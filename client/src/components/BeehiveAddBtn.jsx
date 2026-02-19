import React, { useEffect, useState } from 'react'
import AddBeehiveInfo from './AddBeehiveInfo'
import BgHome from './BgHome'



const BeehiveAddBtn = () => {

  const [component,setComponent] = useState([])
  const [isModalOpen,setIsModalOpen] = useState(false)
  const [beehiveNum, setBeehiveNum] = useState('')
  

  useEffect(() => {
    const savedComponents = localStorage.getItem('beehiveComponent')
    if(savedComponents) {
      setComponent(JSON.parse(savedComponents))
    }
  },[])

  useEffect(() => {
    localStorage.setItem('beehiveComponent', JSON.stringify(component))
  },[component])


  const handleConfirm = () => {
    if(!beehiveNum) return;

    const newComponent = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      
      number: beehiveNum, 
      createdAt: new Date().toISOString()
    }

    setComponent([...component, newComponent]);
    
    setBeehiveNum('')
    setIsModalOpen(false)

  }

  const removeComponent = (id) => {
  setComponent(component.filter(item => item.id !== id))
  }

 

  const openModal = (e) => {
    e.preventDefault()
    setIsModalOpen(true)

  }
 
  return (
    <div> 
       <div className='flex flex-col justify-end items-center'>
         <a onClick={openModal}
          href="#"
          className='inline-block  px-4 sm:px-6 md:px-8  py-2 sm:py-2.5 md:py-3 text-lg sm:text-xl md:text-2xl bg-linear-to-b from-[#e8e805] to-[#f7c223] hover:from-[#f7c223] hover:to-[#e8e805] text-black font-bold font-sans no-underline rounded-lg cursor-pointer shadow-[0_10px_14px_-7px_#276873] active:relative active:top-px transition-all duration-150 '>

            Добавить

         </a>
       </div>

       <BgHome 
        component={component}
        removeComponent={removeComponent}
       />

       

            <AddBeehiveInfo
              isOpen={isModalOpen}
              onClose={ () => setIsModalOpen(false)}
              onConfirm={handleConfirm}
              beehiveNum={beehiveNum}
              setBeehiveNum={setBeehiveNum}
            />
    </div>
  )
}

export default BeehiveAddBtn