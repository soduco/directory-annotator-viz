import { AppBar, Box, FormControl, IconButton, InputLabel, MenuItem, Toolbar } from "@mui/material"
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { Dispatch, useState } from "react";
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import ZoomInMapIcon from '@mui/icons-material/ZoomInMap';
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';
import { toolbarActionType } from "./ImageAnnotator";


interface ImageAnnotatorToolbarProps {
    boxTypes: Record<string, string>
    dispatch?: Dispatch<{type: toolbarActionType, value?: any}>
}




export function ImageAnnotatorToolbar(props : ImageAnnotatorToolbarProps) {
    const [selectedBoxTypes, setSelectedBoxTypes] = useState<string[]>([]);

    return (
    <AppBar position="sticky" sx={{width: "100%", height: "auto", flex: "0 1 auto"}} color="inherit">
    <Toolbar >
    <FormControl sx={{mt: 2, mb: 1}} size="small">
    <InputLabel>Affichage</InputLabel>
    <Select
      sx={{width: 150}}
      value={selectedBoxTypes as any}
      onChange={(e : SelectChangeEvent<string>) => {
            let accectedTypes = e.target.value as unknown as string[];
            setSelectedBoxTypes(accectedTypes);
            props.dispatch?.({type: "filter", value: (x: any) => (accectedTypes.includes(x.type)) })
        }}
      multiple
    >  
    { Object.entries(props.boxTypes).map(([k, v]) => (<MenuItem value={k}>{v}</MenuItem>)) }
    </Select>
    </FormControl>
    <IconButton aria-label="zoom in" onClick={() => props.dispatch?.({type: "zoomIn"})}>
        <ZoomInIcon />
    </IconButton> 
    <IconButton aria-label="zoom out" onClick={() => props.dispatch?.({type: "zoomOut"})}>
        <ZoomOutIcon />
    </IconButton>
    <IconButton aria-label="zoom to view" onClick={() => props.dispatch?.({type: "fitToView"})}>
        <ZoomInMapIcon />
    </IconButton>
    <IconButton aria-label="reset zoom" onClick={() => props.dispatch?.({type: "zoomToOriginalSize"})}>
        <ZoomOutMapIcon />
    </IconButton>
    { /* <Button onClick={onAddCircle}>Add circle</Button> */ }
    { /* <Button onClick={onAddRectangle}>Add Rectangle</Button> */}
    </Toolbar>
    </AppBar>
    );
}