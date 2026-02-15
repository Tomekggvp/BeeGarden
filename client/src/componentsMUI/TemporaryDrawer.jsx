import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { XIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import React, { useState } from 'react'

import { Menu } from 'lucide-react';

export default function TemporaryDrawer() {
  const [open, setOpen] = useState(false);
  

  const menuItems = [
    { label: 'Список дел', path: 'Tasks'},
    { label: 'Записи', path: 'Notes'},
    { label: 'Лечение', path: 'Treatment'},
    { label: 'Ветеринарный контроль', path: 'VetControl'},
    { label: 'Пчелосемьи', path: 'BeeColonyGraphics'},
    { label: 'Проверки', path: 'ChecksPerformed'},
    { label: 'Календарь', path: 'Calendar'},
    { label: 'Выбор локации', path: 'Location'},
    { label: 'Добавить улей', path: ''},
  ]
  const navigate = useNavigate()
  const toggleDrawer = (newOpen) => () => {
    setOpen(newOpen);
  };

  const DrawerList = (
   
    <Box sx={{ width: 250} } role="presentation" onClick={toggleDrawer(false)}>
      <List >
        {menuItems.map((item) => (
          <ListItem key={item.label} disablePadding >
            <ListItemButton>   
              <ListItemText primary={item.label} onClick={() => navigate(`/${item.path}`)}/>
            </ListItemButton>
          </ListItem>
        ))}
      </List>
  
      <XIcon className={`absolute top-6 right-6 w-6 h-6 cursor-pointer`}/>

    </Box>
  );

  return (
    <div>
      <Button onClick={toggleDrawer(true)}><Menu className='text-black'/></Button>
      <Drawer open={open} onClose={toggleDrawer(false)}  PaperProps={{
    sx: {
      backgroundColor: 'transparent',
      boxShadow: 'none',
      color: '#eaebb2',
      height: '100vh', 
      display: 'flex',
      alignItems: 'center', 
      justifyContent: 'center', 
      left: 0,
      right: 0,
      margin: 'auto',
      fontSize: '100px',
          '& .MuiListItemText-primary': {
        fontSize: {
          xs: '1.5rem',    
          sm: '1.5rem',   
          md: '2rem',      
          lg: '2.5rem',    
          xl: '2.25rem'    
        }
      }
      
    }
  }} >
        {DrawerList}
      </Drawer>
    </div>
  );
}