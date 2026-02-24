import React from 'react'
import Autocomplete from '@mui/material/Autocomplete';
import { queenBee } from '../assets/assets';
import TextField from '@mui/material/TextField';

// Добавляем пропсы value и onChange
const ComboBox = ({ value, onChange }) => {
  return (
    <div>
      <label className="block mb-2.5 text-sm font-medium text-heading">Пчеломатка</label>
      <Autocomplete
        disablePortal
        options={queenBee}
        getOptionLabel={(option) => option.name || ""}
        // Находим объект в списке, который соответствует строке value
        value={queenBee.find(opt => opt.name === value) || null}
        // При изменении отдаем родителю только имя (строку)
        onChange={(event, newValue) => {
          onChange(newValue ? newValue.name : null);
        }}
        sx={{ width: '100%' }} // Сделаем на всю ширину контейнера
        renderInput={(params) => <TextField {...params} label="Выберите породу" />}
      />
    </div>
  )
}

export default ComboBox