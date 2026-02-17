import React from 'react'
import { assets } from '../assets/assets'
import { XIcon } from 'lucide-react'
import Beehive from './Beehive'

const BgHome = ({component,removeComponent}) => {
  return (
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
                <Beehive number={item.number} beehiveNum={item.number} />
              </div>
            ))}
            
            {component.length === 0 && (
              <p className='col-span-full text-center text-3xl text-white py-10'>Пусто</p>
            )}
          </div>
        </div>
  )
}

export default BgHome