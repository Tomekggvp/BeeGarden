import React from 'react'
import { assets } from '../assets/assets'
import BeehiveAddBtn from './BeehiveAddBtn'

const Beehive = ({beehiveNum}) => {
  return (
    <div className=''>
        <button className='cursor-pointer'> <img src={assets.apiary} alt='' className='w-[17vw] sm:w-[13vw]
         md:w-[15vw] lg:w-25 xl:w-23 h-auto'/>
        </button>
   
   <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
        <span className="
          /* Центрирование и смещение чуть вниз, если нужно */
          translate-y-2 
          /* Адаптивный шрифт: меняется синхронно с шириной картинки */
          text-[4vw] sm:text-[3vw] md:text-[4vw] lg:text-3xl 
          font-black 
          text-white
          drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]
          tracking-tighter
        ">
          {beehiveNum}
        </span>
      </div>


    </div>
  )
}

export default Beehive  