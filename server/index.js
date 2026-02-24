import express from 'express';
import cors from 'cors';
import { supabase } from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

// 1. Тестовый маршрут
app.get('/ping', (req, res) => res.send('Сервер BeeGarden живой!'));

// 2. Получение данных улья (GET)
app.get('/api/beehive/:id', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('beehive_details')
    .select('*')
    .eq('hive_id', id)
    .single();

  if (error && error.code !== 'PGRST116') {
    return res.status(500).json({ error: error.message });
  }
  res.json(data || {});
});

// 3. Сохранение/Обновление (POST)
app.post('/api/beehive', async (req, res) => {
  const { hive_id, breed, swarms, install_date } = req.body;

  if (!hive_id) return res.status(400).json({ error: "hive_id is missing" });

  const { data, error } = await supabase
    .from('beehive_details')
    .upsert({
      hive_id: String(hive_id),
      breed: breed || null,
      swarms: parseInt(swarms) || 0,
      install_date: install_date || null 
    }, { 
      onConflict: 'hive_id' 
    });

  if (error) {
    console.error("Supabase Error:", error.message);
    return res.status(500).json({ error: error.message });
  }

  res.json({ success: true });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server: http://localhost:${PORT}`));