import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker'
import 'dayjs/locale/ru'

const honeyTextFieldSx = {
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
}

const DateSelect = ({ value, onChange }) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
      <div className="flex flex-col">
        <label className="mb-2 block text-sm font-bold text-[#7a5a1a]">
          Дата установки
        </label>
        <MobileDatePicker
          value={value}
          onChange={onChange}
          localeText={{ okButtonLabel: 'Выбрать', cancelButtonLabel: 'Отмена' }}
          slotProps={{
            textField: {
              fullWidth: true,
              size: 'medium',
              placeholder: 'ДД.ММ.ГГГГ',
              sx: honeyTextFieldSx,
            },
            dialog: {
              sx: {
                zIndex: 10001,
                '& .MuiPaper-root': {
                  borderRadius: '8px',
                  border: '1px solid #f1d88a',
                },
              },
            },
          }}
        />
      </div>
    </LocalizationProvider>
  )
}

export default DateSelect
