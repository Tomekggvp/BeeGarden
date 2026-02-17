import React from 'react'
import { XIcon } from 'lucide-react'
const AddBeehiveInfo = ({ isOpen, onClose, onConfirm,beehiveNum, setBeehiveNum}) => {

    if(!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in duration-200">

        <div className="bg-linear-to-r from-[#e8e805] to-[#f7c223] p-6 flex justify-between items-center">
          <h3 className="text-xl font-bold text-black flex items-center gap-2">
            🐝 Введите номер улея
          </h3>
          <button onClick={onClose} className="text-black/70 hover:text-black transition-colors">
            <XIcon size={24} />
          </button>
        </div>

        <div className="p-6 bg-gray-50 flex gap-0 justify-end">


            <div className="flex flex-col gap-4">
                <label className="text-sm font-bold text-gray-700 ml-1">
                Номер улея 
                </label>
    
        <div className="relative">
            <input 
                type="text"
                value={beehiveNum}
                onChange={(e) => setBeehiveNum(e.target.value)}
                placeholder=""
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 outline-none transition-all
                        focus:border-[#f7c223] focus:ring-4 focus:ring-[#f7c223]/20 bg-gray-50 text-gray-800"
                autoFocus
            />
        

         </div>

             </div>

          <button 
            onClick={onClose}
            className="px-4 py-2 mt-30 text-gray-500 hover:text-gray-700 font-medium transition-colors"
          >

            Отмена

          </button>

          <button 
            onClick={onConfirm}
            className="px-6 py-2 mt-30 bg-[#f7c223] hover:bg-[#e8e805] text-black font-bold rounded-xl shadow-md active:scale-95 transition-all"
          >
            Подтвердить

          </button>
          
        </div>
      </div>
    </div>
  )
}

export default AddBeehiveInfo