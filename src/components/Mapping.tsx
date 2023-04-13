import {Button, Grid, MenuItem, Select} from "@mui/material";
import {makeStyles} from "@material-ui/core";
import * as React from "react";
import {FormEvent, useCallback, useEffect, useRef, useState} from "react";
import {Route} from "../util/models";
import {Loader} from "google-maps";
import {getCurrentPosition} from "../util/geolocation";
import {makeCarIcon, makeMarkerIcon, Map} from "../util/map";
import {sample, shuffle} from "lodash";
import {RouteExistsError} from "../errors/route-exists.error";
import {useSnackbar} from "notistack";
import {Navbar} from "./Navbar";
import io, {connect, Socket} from "socket.io-client";

const API_URL = process.env.REACT_APP_API_URL as string;

const googleMapsLoader = new Loader(process.env.REACT_APP_API_KEY);

const colors = [
    "#b71c1c",
    "#4a148c",
    "#2e7d32",
    "#e65100",
    "#2962ff",
    "#c2185b",
    "#FFCD00",
    "#3e2723",
    "#03a9f4",
    "#827717",
];

const useStyles = makeStyles({
    root: {
        width: "100%",
        height: "100%",
    },
    form: {
        margin: "16px",
    },
    btnSubmitWrapper: {
        textAlign: "center",
        marginTop: "8px",
    },
    map: {
        width: "100%",
        height: "100%",
    },
});

export const Mapping: React.FunctionComponent = (props) => {
    const classes = useStyles();
    const [routes, setRoutes] = useState<Route[]>([]);
    const [routeIdSelected, setRouteIdSelected] = useState<string>("");
    const mapRef = useRef<Map>();
    const socketIORef = useRef<Socket>();
    const {enqueueSnackbar} = useSnackbar();

    const finishRoute = useCallback((route: Route) => {
        enqueueSnackbar(`Rota ${route.title} finalizada`, {
            variant: "success",
        })
        mapRef.current?.removeRoute(route._id);
    }, [enqueueSnackbar]);

    useEffect(() => {
        if (!socketIORef.current?.connected) {
            enqueueSnackbar("Conectando ao servidor", {
                variant: "info",
                autoHideDuration: 3000,
            });
            socketIORef.current = connect(API_URL, {
                transports: ["websocket"],
            });
        }

        socketIORef.current?.on("connect", () => {
            enqueueSnackbar("Conectado ao servidor", {
                variant: "success",
                autoHideDuration: 3000,
            });
        });
        socketIORef.current?.on("disconnect", () => {
            enqueueSnackbar("Desconectado do servidor", {
                variant: "error",
                autoHideDuration: 3000,
            });
        });
        socketIORef.current?.on("error", (err) => {
            enqueueSnackbar("Erro no servidor", {
                variant: "error",
                autoHideDuration: 3000,
            });
        });

        const handler = (data: {
            routeId: string;
            position: [number, number];
            finished: boolean;
        }) => {
            mapRef.current?.moveCurrentMarker(data.routeId, {
                lat: data.position[0],
                lng: data.position[1],
            });
            const route = routes.find((route) => route._id === routeIdSelected) as Route;
            if (data.finished) {
                finishRoute(route);
            }
        };
        socketIORef.current?.on("new-position", handler);
        return () => {
            socketIORef.current?.off("new-position", handler);
        }
    }, [enqueueSnackbar, routes, routeIdSelected, finishRoute]);

    useEffect(() => {
        fetch(`${API_URL}/routes`)
            .then((data) => data.json())
            .then((data) => setRoutes(data))
            .catch((err) => console.log(err));
    }, []);

    useEffect(() => {
        (async () => {
            const [, position] = await Promise.all([
                googleMapsLoader.load(),
                getCurrentPosition({enableHighAccuracy: true}),
            ]);
            const divMap = document.getElementById("map") as HTMLElement;
            mapRef.current = new Map(divMap, {
                center: position,
                zoom: 15,
            });
        })();
    }, []);

    const startRoute = useCallback(
        (event: FormEvent) => {
            event.preventDefault();
            const route = routes.find((route) => route._id === routeIdSelected);
            const color = sample(shuffle(colors)) as string;

            try {
                mapRef.current?.addRoute(routeIdSelected, {
                    currentMarkerOptions: {
                        position: route?.startPosition,
                        icon: makeCarIcon(color),
                    },
                    endMarkerOptions: {
                        position: route?.endPosition,
                        icon: makeMarkerIcon(color),
                    },
                });
                socketIORef.current?.emit("new-direction", {
                    routeId: routeIdSelected,
                });
            } catch (e) {
                if (e instanceof RouteExistsError) {
                    enqueueSnackbar("A rota já está sendo exibida", {
                        variant: "error",
                        autoHideDuration: 3000,
                    });
                    return;
                }
                throw e;
            }
        },
        [routeIdSelected, routes, enqueueSnackbar]
    );

    return (
        <Grid className={classes.root} container>
            <Grid item xs={12} sm={3}>
                <Navbar/>
                <form onSubmit={startRoute} className={classes.form}>
                    <Select
                        fullWidth
                        displayEmpty
                        value={routeIdSelected}
                        onChange={(event) => {
                            setRouteIdSelected(event.target.value + "");
                        }}
                    >
                        <MenuItem value="">
                            <em>Selecione uma corrida</em>
                        </MenuItem>
                        {routes.map((route, key) => (
                            <MenuItem key={key} value={route._id}>
                                {route.title}
                            </MenuItem>
                        ))}
                    </Select>
                    <div className={classes.btnSubmitWrapper}>
                        <Button type="submit" color="primary" variant="contained">
                            Iniciar corrida
                        </Button>
                    </div>
                </form>
            </Grid>
            <Grid item xs={12} sm={9}>
                <div id="map" className={classes.map}/>
            </Grid>
        </Grid>
    );
};
