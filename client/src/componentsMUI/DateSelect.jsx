import React from 'react'
import dayjs from "dayjs";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import 'dayjs/locale/ru';

const DateSelect = () => {
  return (
     <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
      
        <DatePicker
          defaultValue={dayjs('2022-04-17')}
          views={['year', 'month', 'day']}
        />

    </LocalizationProvider>
  )
}

export default DateSelect