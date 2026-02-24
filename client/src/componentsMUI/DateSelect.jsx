import React from 'react'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker'; 
import 'dayjs/locale/ru';

const DateSelect = ({ value, onChange }) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
      <div className="flex flex-col">
        <label className="block mb-2 text-sm font-medium text-gray-700">Дата установки</label>
        <MobileDatePicker
          value={value}
          onChange={onChange}
          localeText={{ okButtonLabel: 'Выбрать', cancelButtonLabel: 'Отмена' }}
          slotProps={{
            textField: { 
              fullWidth: true,
              size: 'medium', 
              placeholder: 'ДД.ММ.ГГГГ'
            },
            dialog: {
              sx: {
                zIndex: 10001 
              }
            }
          }}
        />
      </div>
    </LocalizationProvider>
  )
}

export default DateSelect