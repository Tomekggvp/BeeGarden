import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import { queenBee } from '../assets/assets'

const honeyFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    color: '#2f2100',
    fontWeight: 700,
    '& fieldset': {
      borderColor: '#f1d88a',
      borderWidth: '2px',
    },
    '&:hover fieldset': {
      borderColor: '#f8b400',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#f8b400',
      boxShadow: '0 0 0 4px rgba(248, 180, 0, 0.2)',
    },
  },
  '& .MuiInputLabel-root': {
    color: '#7a5a1a',
    fontWeight: 700,
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#9a5a00',
  },
}

const ComboBox = ({ value, onChange }) => {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-[#7a5a1a]">
        Пчеломатка
      </label>
      <Autocomplete
        disablePortal
        options={queenBee}
        getOptionLabel={(option) => option.name || ''}
        value={queenBee.find((option) => option.name === value) || null}
        onChange={(_event, newValue) => {
          onChange(newValue ? newValue.name : null)
        }}
        sx={{ width: '100%' }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Выберите породу"
            sx={honeyFieldSx}
          />
        )}
      />
    </div>
  )
}

export default ComboBox
