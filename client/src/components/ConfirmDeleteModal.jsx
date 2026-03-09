import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, hiveId }) => {
  const [input, setInput] = useState('');

  useEffect(() => {
    if (!isOpen) setInput('');
  }, [isOpen]);

  if (!isOpen) return null;

  const isMatched = input === String(hiveId);

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 relative animate-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="text-red-500" size={32} />
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-2">Удалить улей №{hiveId}?</h3>
          <p className="text-sm text-gray-500 mb-6">
            Это действие необратимо. Все данные о пчелах будут стерты.
          </p>

          <div className="w-full mb-6">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 text-left">
              Введите номер улья для подтверждения
            </label>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Напишите ${hiveId}`}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-red-400 transition-all text-center font-bold text-lg"
              autoFocus
            />
          </div>

          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl transition-all"
            >
              Отмена
            </button>
            <button
              disabled={!isMatched}
              onClick={onConfirm}
              className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-red-200 transition-all active:scale-95"
            >
              Удалить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;