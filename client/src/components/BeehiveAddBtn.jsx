import React, { useEffect, useState } from 'react';
import AddBeehiveInfo from './AddBeehiveInfo.jsx';
import BgHome from './BgHome';
import BeehiveDetails from './BeehiveDetails';
import api from '../api/axios';

const BeehiveAddBtn = ({ session }) => {
    const [component, setComponent] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [beehiveNum, setBeehiveNum] = useState('');
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [selectedHiveId, setSelectedHiveId] = useState(null);

    useEffect(() => {
        const fetchHives = async () => {
            if (session?.user?.id) {
                setLoading(true);
                try {
                    const res = await api.get('/api/hives', {
                        params: { user_id: session.user.id }
                    });
                    const formatted = res.data.map(h => ({
                        id: h.hive_number,
                        number: h.hive_number
                    }));
                    setComponent(formatted);
                } catch (err) {
                    console.error("Ошибка загрузки пасеки:", err);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchHives();
    }, [session]);

    const handleConfirm = async () => {
        if (!beehiveNum || !session?.user?.id) return;
        try {
            const res = await api.post('/api/hives', {
                user_id: session.user.id,
                hive_number: beehiveNum
            });
            setComponent([...component, { id: res.data.hive_number, number: res.data.hive_number }]);
            setBeehiveNum('');
            setIsAddModalOpen(false);
        } catch (err) {
            alert(err.response?.data?.error || "Ошибка сохранения");
        }
    };

    const removeComponent = async (hiveId) => {
        try {
            await api.delete(`/api/hives/${hiveId}`, { params: { user_id: session.user.id } });
            setComponent(component.filter(item => item.id !== hiveId));
        } catch (err) {
            alert("Ошибка удаления");
        }
    };

    return (
        <div> 
            <div className='flex justify-center mb-6'>
                <button onClick={() => setIsAddModalOpen(true)} className='px-8 py-3 bg-yellow-400 font-bold rounded-lg shadow-md hover:bg-yellow-500 transition-all'>
                    Добавить улей
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10 text-gray-600 font-medium animate-pulse">Синхронизация пасеки...</div>
            ) : (
                <BgHome component={component} removeComponent={removeComponent} onOpenDetails={(id) => { setSelectedHiveId(id); setIsDetailsOpen(true); }} />
            )}

            <AddBeehiveInfo isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onConfirm={handleConfirm} beehiveNum={beehiveNum} setBeehiveNum={setBeehiveNum} />

            {isDetailsOpen && (
                <BeehiveDetails isOpen={isDetailsOpen} onClose={() => { setIsDetailsOpen(false); setSelectedHiveId(null); }} hiveId={selectedHiveId} session={session} />
            )}
        </div>
    );
};

export default BeehiveAddBtn;