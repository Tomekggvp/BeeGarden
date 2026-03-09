import React, { useEffect, useState } from 'react';
import AddBeehiveInfo from './AddBeehiveInfo.jsx';
import BgHome from './BgHome';
import BeehiveDetails from './BeehiveDetails';
import ConfirmDeleteModal from './ConfirmDeleteModal.jsx'; 
import api from '../api/axios';

const BeehiveAddBtn = ({ session }) => {
    const [component, setComponent] = useState([]);
    const [loading, setLoading] = useState(false);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [beehiveNum, setBeehiveNum] = useState('');

    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [selectedHiveId, setSelectedHiveId] = useState(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [hiveToDelete, setHiveToDelete] = useState(null);

    useEffect(() => {
        const fetchHives = async () => {
            if (session?.user?.id) {
                setLoading(true);
                try {
                    const res = await api.get('/api/hives', {
                        params: { user_id: session.user.id }
                    });
                    
                    const formattedHives = res.data.map(h => ({
                        id: h.hive_number,
                        number: h.hive_number
                    }));
                    
                    setComponent(formattedHives);
                } catch (err) {
                    console.error("Ошибка загрузки:", err);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchHives();
    }, [session]);

    const handleConfirm = async () => {
        if (!beehiveNum || !session?.user?.id) return;

        if (component.find(item => item.id === beehiveNum)) {
            alert("Улей с таким номером уже существует!");
            return;
        }

        try {
            const res = await api.post('/api/hives', {
                user_id: session.user.id,
                hive_number: beehiveNum
            });

            const newHive = { 
                id: res.data.hive_number, 
                number: res.data.hive_number 
            };
            
            setComponent([...component, newHive]);
            setBeehiveNum('');
            setIsAddModalOpen(false);
        } catch (err) {
            alert(err.response?.data?.error || "Ошибка сохранения");
        }
    };

    const openDeleteConfirm = (id) => {
        setHiveToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const handleFinalDelete = async () => {
        if (!hiveToDelete || !session?.user?.id) return;

        try {
            await api.delete(`/api/hives/${hiveToDelete}`, {
                params: { user_id: session.user.id }
            });

            setComponent(prev => prev.filter(item => item.id !== hiveToDelete));
            setIsDeleteModalOpen(false);
            setHiveToDelete(null);
        } catch (err) {
            console.error("Ошибка удаления:", err);
            alert("Не удалось удалить улей");
        }
    };

    return (
        <div> 
            <div className='flex flex-col justify-end items-center mb-6'>
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className='px-8 py-3 bg-yellow-400 font-bold rounded-lg shadow-md hover:bg-yellow-500 transition-all'
                >
                    Добавить улей
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center py-10 gap-2">
                    <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-400 text-sm">Загрузка пасеки...</p>
                </div>
            ) : (
                <BgHome 
                    component={component}
                    removeComponent={openDeleteConfirm}
                    onOpenDetails={(id) => { setSelectedHiveId(id); setIsDetailsOpen(true); }} 
                />
            )}

            <AddBeehiveInfo
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onConfirm={handleConfirm}
                beehiveNum={beehiveNum}
                setBeehiveNum={setBeehiveNum}
            />

            <ConfirmDeleteModal 
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleFinalDelete}
                hiveId={hiveToDelete}
            />

            {isDetailsOpen && (
                <BeehiveDetails 
                    isOpen={isDetailsOpen}
                    onClose={() => {
                        setIsDetailsOpen(false);
                        setSelectedHiveId(null);
                    }}
                    hiveId={selectedHiveId}
                    session={session} 
                />
            )}
        </div>
    );
};

export default BeehiveAddBtn;