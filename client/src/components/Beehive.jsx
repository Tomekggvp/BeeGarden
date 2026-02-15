import React from 'react'
import { assets } from '../assets/assets'
import BeehiveAddBtn from './BeehiveAddBtn'

const Beehive = () => {
  return (
    <div className=''>
        <button className='cursor-pointer'> <img src={assets.apiary} alt='' className=' w-[17vw] sm:w-[13vw]
         md:w-[15vw] lg:w-25 xl:w-23 h-auto'/>
        </button>
     {/* <div className='w-25 h-25 bg-red-600'></div> */}


    </div>
  )
}

export default Beehive  