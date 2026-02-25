import express from 'express';
import cors from 'cors';
import { supabase } from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/beehive/:id', async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.query;

  if (!user_id) return res.status(401).json({ error: "Unauthorized" });

  const { data, error } = await supabase
    .from('beehive_details')
    .select('*')
    .eq('hive_id', id)
    .eq('user_id', user_id)
    .single();

  if (error && error.code !== 'PGRST116') {
    return res.status(500).json({ error: error.message });
  }
  res.json(data || {});
});

app.post('/api/beehive', async (req, res) => {
  try {
    const { hive_id, user_id, breed, swarms, install_date } = req.body;

    if (!hive_id || !user_id) {
      return res.status(400).json({ error: "hive_id and user_id are required" });
    }

    const { data, error } = await supabase
      .from('beehive_details')
      .upsert({
        hive_id: String(hive_id),
        user_id: user_id,
        breed: breed || null,
        swarms: parseInt(swarms) || 0,
        install_date: install_date || null 
      }, { 

        onConflict: 'hive_id,user_id' 
      });

    if (error) {
      console.error("Supabase Error:", error.message);
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));