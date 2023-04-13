import {FunctionComponent} from "react";
import {AppBar, IconButton, Toolbar, Typography} from "@mui/material";
import DriverIcon from '@material-ui/icons/DriveEta';

export const Navbar: FunctionComponent = (props) => {
    return (
        <AppBar position="static">
            <Toolbar>
                <IconButton edge="start" color="inherit" aria-label="menu">
                    <DriverIcon/>
                </IconButton>
                <Typography variant="h6">
                    Code Delivery
                </Typography>
            </Toolbar>
        </AppBar>
    );
};
