import React from 'react'
import { assets } from '../assets/assets'
import { XIcon } from 'lucide-react'
import Beehive from './Beehive'

const BgHome = ({ component, removeComponent, onOpenDetails }) => {
  return (
    <div className='max-w-4xl mx-auto mt-5 rounded-xl p-6 bg-cover bg-center' style={{ backgroundImage: `url(${assets.gras})` }}>
      <div className='grid grid-cols-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 p-2'>
        {component.map((item) => (
          <div key={item.id} className='relative group'>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                removeComponent(item.id);
              }}
              className='absolute -top-3 -right-2 z-10 bg-gray-600 text-white rounded-full p-1 hover:bg-red-600 transition-all'
            >
              <XIcon size={14} />
            </button>
            
            <div 
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onOpenDetails(item.id);
              }} 
              className="cursor-pointer transform hover:scale-105 active:scale-95 transition-all"
            >
              <Beehive number={item.number} beehiveNum={item.number} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default BgHome