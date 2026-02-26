import React, { useState, useEffect } from 'react';
import ComboBox from '../componentsMUI/ComboBox';
import DateSelect from '../componentsMUI/DateSelect';
import dayjs from 'dayjs';
import { X } from 'lucide-react';
import api from '../api/axios';

const BeehiveDetails = ({ isOpen, onClose, hiveId, session }) => {
    const [details, setDetails] = useState({ breed: null, swarms: '', date: null });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && hiveId && session?.user?.id) {
            setLoading(true);

            api.get(`/api/beehive/${hiveId}`, {
                params: { user_id: session.user.id }
            })
            .then(res => {
                const data = res.data; 
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
            .catch(err => {
                console.error("Load error:", err.response?.data || err.message);
            })
            .finally(() => setLoading(false));
        }
    }, [isOpen, hiveId, session]);

    if (!isOpen) return null;

    const handleSave = async (e) => {
        e.preventDefault();
        if (!session?.user?.id) return alert("Вы не авторизованы");

        setLoading(true);
        try {
            const payload = {
                hive_id: String(hiveId),
                user_id: session.user.id,
                breed: details.breed,
                swarms: details.swarms,
                install_date: details.date ? details.date.format('YYYY-MM-DD') : null
            };

            await api.post('/api/beehive', payload);

            onClose();
        } catch (err) {
            const errorMessage = err.response?.data?.error || "Ошибка сохранения";
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div 
            className='fixed inset-0 z-[9999] flex justify-center items-start sm:items-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto'
            onClick={onClose}
        >
            <div 
                className='relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8 my-8 animate-in zoom-in duration-200'
                onClick={(e) => e.stopPropagation()} 
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 p-2">
                    <X size={24} />
                </button>

                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Улей № {hiveId}</h2>
                
                <form onSubmit={handleSave}>
                    <div className="grid gap-5 mb-8">
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
                        className="w-full bg-yellow-300 hover:bg-yellow-400 font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
                    >
                        {loading ? 'Сохранение...' : 'Сохранить данные'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default BeehiveDetails;