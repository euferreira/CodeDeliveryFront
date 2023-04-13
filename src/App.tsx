import React from 'react';
import './App.css';
import {Mapping} from './components/Mapping';
import {ThemeProvider} from '@mui/material/styles';
import theme from './theme';
import {CssBaseline} from '@mui/material';
import {SnackbarProvider} from "notistack";

function App() {
    return (
        <ThemeProvider theme={theme}>
            <SnackbarProvider maxSnack={3}>
                <CssBaseline/>
                <Mapping/>
            </SnackbarProvider>
        </ThemeProvider>
    );
}

export default App;
