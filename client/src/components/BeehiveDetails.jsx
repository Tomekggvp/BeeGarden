import React, { useState, useEffect } from 'react';
import ComboBox from '../componentsMUI/ComboBox';
import DateSelect from '../componentsMUI/DateSelect';
import dayjs from 'dayjs';
import { X } from 'lucide-react';

const BeehiveDetails = ({ isOpen, onClose, hiveId }) => {
    const [details, setDetails] = useState({ breed: null, swarms: '', date: null });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && hiveId) {
            setLoading(true);
            fetch(`http://localhost:5000/api/beehive/${hiveId}`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.hive_id) {
                        setDetails({
                            breed: data.breed || null,
                            swarms: data.swarms || '',
                            date: data.install_date ? dayjs(data.install_date) : null
                        });
                    } else {
                        setDetails({ breed: null, swarms: '', date: null });
                    }
                })
                .finally(() => setLoading(false));
        }
    }, [isOpen, hiveId]);

    if (!isOpen) return null;

    const handleClose = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        onClose();
    };

    return (
        <div 
            className='fixed inset-0 z-[9999] flex justify-center items-start sm:items-center p-2 sm:p-4 overflow-y-auto bg-black/60 backdrop-blur-sm'
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleClose}
        >

            <div 
                className='relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8 my-8 animate-in zoom-in duration-200'
                onClick={(e) => e.stopPropagation()} 
            >
                <button 
                    type="button"
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors p-2 z-10"
                >
                    <X size={24} />
                </button>

                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
                    Улей № {hiveId || '...'}
                </h2>
                
                <form onSubmit={async (e) => {
                    e.preventDefault();
                    setLoading(true);
                    try {
                        const payload = {
                            hive_id: String(hiveId),
                            breed: details.breed,
                            swarms: details.swarms,
                            install_date: details.date ? details.date.format('YYYY-MM-DD') : null
                        };
                        const res = await fetch('http://localhost:5000/api/beehive', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        });
                        if (res.ok) handleClose();
                    } catch (err) {
                        alert("Ошибка сохранения");
                    } finally {
                        setLoading(false);
                    }
                }}>
                    <div className="grid gap-5 sm:gap-6 mb-8">
                        <ComboBox 
                            value={details.breed} 
                            onChange={(v) => setDetails({...details, breed: v})} 
                        />
                        
                        <div className="flex flex-col">
                            <label className="mb-2 text-sm font-medium text-gray-700">Количество роений</label>
                            <input 
                                type="number" 
                                value={details.swarms} 
                                onChange={(e) => setDetails({...details, swarms: e.target.value})}
                                className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-yellow-400 text-base" 
                                required 
                            />
                        </div>

                        <DateSelect 
                            value={details.date} 
                            onChange={(v) => setDetails({...details, date: v})} 
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-yellow-300 hover:bg-yellow-400 font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-95 mb-2"
                    >
                        {loading ? 'Загрузка...' : 'Сохранить данные'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default BeehiveDetails;