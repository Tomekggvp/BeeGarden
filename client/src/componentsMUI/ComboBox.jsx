import React from 'react'
import Autocomplete from '@mui/material/Autocomplete';
import { queenBee } from '../assets/assets';
import TextField from '@mui/material/TextField';

const ComboBox = () => {
  return (
   <div>
    
     
         <label htmlFor="queenBee" className="block mb-2.5 text-sm font-medium text-heading">Пчеломатка</label>
             <Autocomplete
          disablePortal
          options={queenBee}
           getOptionLabel={(option) => option.name}
          sx={{ width: 200}}
          renderInput={(params) => <TextField {...params} label="" />}
             />
     

    </div>
  )
}

export default ComboBox