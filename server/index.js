import express from 'express';
import cors from 'cors';
import { supabase } from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

// --- СПИСОК УЛЬЕВ ---

app.get('/api/hives', async (req, res) => {
    const { user_id } = req.query;
    const { data, error } = await supabase
        .from('hives')
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
});

app.post('/api/hives', async (req, res) => {
    const { user_id, hive_number } = req.body;
    const { data, error } = await supabase
        .from('hives')
        .insert([{ user_id, hive_number }])
        .select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

app.delete('/api/hives/:hive_number', async (req, res) => {
    const { hive_number } = req.params;
    const { user_id } = req.query;
    const { error } = await supabase
        .from('hives')
        .delete()
        .eq('hive_number', hive_number)
        .eq('user_id', user_id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
});

// --- ДЕТАЛИ УЛЬЯ ---

app.get('/api/beehive/:id', async (req, res) => {
    const { id } = req.params;
    const { user_id } = req.query;
    const { data, error } = await supabase
        .from('beehive_details')
        .select('*')
        .eq('hive_id', id)
        .eq('user_id', user_id)
        .single();
    if (error && error.code !== 'PGRST116') return res.status(500).json({ error: error.message });
    res.json(data || {});
});

app.post('/api/beehive', async (req, res) => {
    const { hive_id, user_id, breed, swarms, install_date } = req.body;
    const { error } = await supabase
        .from('beehive_details')
        .upsert({
            hive_id: String(hive_id),
            user_id,
            breed,
            swarms: parseInt(swarms) || 0,
            install_date
        }, { onConflict: 'hive_id,user_id' });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));