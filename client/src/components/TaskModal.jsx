import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { X, Plus, Trash2 } from 'lucide-react';

const TaskModal = ({ isOpen, onClose, hiveId, session }) => {
  const [tasks, setTasks] = useState([]);
  const [text, setText] = useState('');

  useEffect(() => {
    if (isOpen && hiveId) {
      const fetchTasks = async () => {
        const { data } = await supabase
          .from('tasks')
          .select('*')
          .eq('hive_id', String(hiveId))
          .eq('user_id', session.user.id);
        setTasks(data || []);
      };
      fetchTasks();
    }
  }, [isOpen, hiveId, session]);

  const handleAdd = async () => {
    if (!text.trim()) return;
    const { data, error } = await supabase
      .from('tasks')
      .insert([{ hive_id: String(hiveId), user_id: session.user.id, task_text: text }])
      .select();
    if (!error) {
      setTasks([...tasks, data[0]]);
      setText('');
    }
  };

  const handleDelete = async (id) => {
    await supabase.from('tasks').delete().eq('id', id);
    setTasks(tasks.filter(t => t.id !== id));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border-4 border-yellow-400">
        <div className="bg-yellow-400 p-6 flex justify-between items-center">
          <h2 className="text-xl font-bold">Улей №{hiveId}</h2>
          <button onClick={onClose}><X /></button>
        </div>
        <div className="p-6">
          <div className="flex gap-2 mb-4">
            <input 
              value={text} 
              onChange={(e) => setText(e.target.value)}
              className="flex-1 border p-2 rounded-lg outline-none focus:border-yellow-500"
              placeholder="Добавить задачу..."
            />
            <button onClick={handleAdd} className="bg-yellow-400 p-2 rounded-lg"><Plus /></button>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {tasks.map(t => (
              <div key={t.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <span>{t.task_text}</span>
                <button onClick={() => handleDelete(t.id)} className="text-red-500"><Trash2 size={18}/></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default TaskModal;