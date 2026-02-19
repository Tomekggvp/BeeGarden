import React from 'react'
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { queenBee } from '../assets/assets';
import ComboBox from '../componentsMUI/ComboBox';


const BeehiveDetails = ({isOpen,onClose}) => {

 

    if(!isOpen) return null;
    
  return (
    <div className='fixed z-50 inset-0 flex items-center justify-center '>
      <div onClick={onClose} className='absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity'/>
        <div className='relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in duration-200 p-15 pb-20'>
       
        <form>
            <div className="grid gap-6 mb-6 md:grid-cols-1">

                <ComboBox/>
                
                <div>
                    <label htmlFor="queenBee" className="block mb-2.5 text-sm font-medium text-heading">Количесвто роений</label>
                    <input type="text" id="queenBee" className="bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body" placeholder="" required />
                </div>

            
            
            </div>

            <div className='flex justify-center'><button type="submit" className="text-black bg-yellow-300 box-border border border-transparent hover:bg-brand-strong focus:ring-4 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none ">Сохранить</button></div>

        </form>

        </div>

    </div>
  )
}

export default BeehiveDetails