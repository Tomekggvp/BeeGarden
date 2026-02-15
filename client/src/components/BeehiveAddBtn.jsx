import React, { useEffect, useState } from 'react'
import Beehive from './Beehive'
import { XIcon } from 'lucide-react'
import { assets } from '../assets/assets'

const BeehiveAddBtn = () => {

  const [component,setComponent] = useState([])


  useEffect(() => {
    const savedComponents = localStorage.getItem('beehiveComponent')
    if(savedComponents) {
      setComponent(JSON.parse(savedComponents))
    }
  },[])

  useEffect(() => {
    localStorage.setItem('beehiveComponent', JSON.stringify(component))
  },[component])

  const removeComponent = (id) => {
  setComponent(component.filter(item => item.id !== id))
  }

   const addComponent = (e) => {
    e.preventDefault()
    
    const nextNumber = component.length > 0 
      ? Math.max(...component.map(item => item.number || 0)) + 1 
      : 1;

    const newComponent = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      number: nextNumber, 
      createdAt: new Date().toISOString()
    }
    setComponent([...component, newComponent]);
  }
 
  return (
    <div> 
       <div className='flex flex-col justify-end items-center'>
         <a onClick={addComponent}
          href="#"
          className='inline-block  px-4 sm:px-6 md:px-8  py-2 sm:py-2.5 md:py-3 text-lg sm:text-xl md:text-2xl bg-linear-to-b from-[#e8e805] to-[#f7c223] hover:from-[#f7c223] hover:to-[#e8e805] text-black font-bold font-sans no-underline rounded-lg cursor-pointer shadow-[0_10px_14px_-7px_#276873] active:relative active:top-px transition-all duration-150 '>

            Добавить

         </a>
       </div>
 
       <div className='max-w-4xl mx-auto mt-5 rounded-xl p-6 bg-gray-50/50 bg-cover bg-center bg-no-repeat' style={{backgroundImage: `url(${assets.gras})`}}>
          <div className='grid grid-cols-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 h-auto overflow-y-auto custom-scrollbar p-2'>
            {component.map((item) => (
              <div key={item.id} className='relative group animate-in fade-in zoom-in duration-300'>
                <button 
                  onClick={() => removeComponent(item.id)}
                  className='absolute -top-3 -right-2 z-10 bg-gray-600 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors'
                >
                  <XIcon size={14} />
                </button>
                <Beehive number={item.number} />
              </div>
            ))}
            
            {component.length === 0 && (
              <p className='col-span-full text-center text-gray-400 py-10'>Список пуст</p>
            )}
          </div>
        </div>
     

    </div>
  )
}

export default BeehiveAddBtn