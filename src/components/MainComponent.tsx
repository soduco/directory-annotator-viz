
import { useContext, useEffect, useReducer, useState } from "react";
import {Annotation, AppContext, VisualizationContext} from "./ApplicationContext"
//import { DirectoryImageViewer } from "./DirectoryImageViewer"
import { NLPEditor } from "./NLPEditor"

// @ts-ignore
import ResizePanel from "react-resize-panel"
import { ImageAnnotator } from "./ImageAnnotator";
import { ImageAnnotatorToolbar } from "./ImageAnnotatorToolbar";
import { useQuery } from "react-query";
import { getImage } from "../API";
import { AxiosError } from "axios";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useCallback } from "react";

interface MainComponentProps { 
    directory?: string
    view?: number
}





function LeftPanel(props : {
        setSelectedItem: (e : Annotation | null) => void, 
        setFocusedItem: (e : Annotation | null) => void
    }){

    const boxTypes = {
        "ENTRY" : "Entry",
        "LINE" : "Line",
        "SECTION_LEVEL_1" : "Section I",
        "SECTION_LEVEL_2" : "Section II",
        "COLUMN_LEVEL_1" : "Column I",
        "COLUMN_LEVEL_2" : "Column II",
        "TITLE_LEVEL_1" : "Title I",
        "TITLE_LEVEL_2" : "Title II"
    };

    const app_ctx = useContext(AppContext);
    const [backgroundImageData, setBackgroundImageData] = useState<string>();
    const query_img = useQuery(["background", app_ctx?.directory, app_ctx?.view], 
        () => getImage(app_ctx!.directory, app_ctx!.view), {
            enabled: (app_ctx != null),
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            onSuccess: (buffer) => {
                let data_url = "data:image/jpeg;base64," + buffer.toString('base64');
                setBackgroundImageData(data_url);
            }
        });
    const toolbar = <ImageAnnotatorToolbar boxTypes={boxTypes} />;


    
    const data_reducer = useCallback((annotations : Set<Annotation>, action : {type : string, target: any}) =>
    {
        if (action.target instanceof Annotation) {
            let t = action.target as Annotation;
            console.log(action.type.toUpperCase(), t.id, t.type, t.box);
        }
        switch (action.type) {
            case 'reset':
                return action.target;
            case 'add':
                annotations.add(action.target); 
                break;
            case 'delete':
                annotations.delete(action.target);
                props.setSelectedItem(null);
                props.setFocusedItem(null); 
                break;
            case 'updated':
                break;
            case 'selected':
                props.setSelectedItem(action.target);
                break;
        }
        return annotations;
    }, []);

    
    let [data, dispatch] = useReducer(data_reducer, new Set<Annotation>());

    useEffect(() => { dispatch({type: "reset", target: app_ctx!.annotations}) }, [app_ctx?.annotations]);

    if (query_img.isError) {
        let err = query_img.error as AxiosError;
        return <Typography variant="h6" component="div">Error : {err.message}</Typography>;
    } else if (query_img.isLoading) {
        return <CircularProgress color="secondary"/>;
    } else {
        return <Box className="container panel" component="div">
            { backgroundImageData && app_ctx?.annotations &&
            <ImageAnnotator toolbar={toolbar}
                zoom={1}
                backgroundImage={backgroundImageData}
                data={data}
                isVisible={() => true}
                on={dispatch}
            />
            }
        </Box>
    }
}




export function MainComponent(props : MainComponentProps) {
    const [focusItem, setFocusItem] = useState<Annotation | null>(null);
    const [selectedItem, setSelectedItem] = useState<Annotation | null>(null);

    console.log("Item sel", selectedItem);

    return (
        <Box sx={{ height: "100%", width: "100%", display: "flex", flexFlow: "column nowrap"}}>
            <VisualizationContext.Provider value={{
                focusItem: focusItem, setFocusItem: setFocusItem,
                selectedItem: selectedItem, setSelectedItem: setSelectedItem
                }}>
                <Box component="div" sx={{ height: "100%", display: "flex", flexFlow: "row nowrap"}}>
                <LeftPanel setSelectedItem={setSelectedItem} setFocusedItem={setFocusItem} />
                <ResizePanel direction="w" style={{ width: 800 }}>
                  <Box className="sidebar panel" component="div">
                    <NLPEditor />
                  </Box>
                </ResizePanel>
                </Box>
            </VisualizationContext.Provider>
        </Box>
    )

} 