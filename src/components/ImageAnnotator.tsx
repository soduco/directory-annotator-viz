import React, { ComponentType, Dispatch, ReactElement, useCallback, useReducer, useRef } from "react";
import { fabric } from "fabric";
import { useFabricJSEditor, FabricJSCanvas } from "fabricjs-react";
import { useEffect, useState } from "react";
import { HotKeys } from "react-hotkeys";
import Box from "@mui/material/Box";


export interface Element {
    box: number[];
    text?: string;
    clone() : Element;
}


function hasBox(x: Element) {
    return "box" in x;
}

export type ActionType = "add" | "delete" | "selected" | "updated"
export type zoomActionType = "zoomIn" | "zoomOut" | "fitToView" | "zoomToOriginalSize"
export type toolbarActionType = zoomActionType | "filter";
export interface IToolbarReduceCallback {
    zoom : number;
    isVisible : (x: Element) => boolean;
}

export interface ImageAnnotatorProps {
    backgroundImage : string;
    data: Set<Element>;
    toolbar?: ReactElement;
    zoom : number;
    isVisible: (o: Element) => boolean;  
    on: Dispatch<{type: ActionType, target: Element}>
}

interface Context {
    props: ImageAnnotatorProps;
    data: Set<Element>;
}

interface ExtendedCanvas extends fabric.Canvas {
    context?: Context
}


class RectElement extends fabric.Rect {
    e : Element;


    onModified(ev : any) {
        this.e.box = [this.left!, this.top!, this.getScaledWidth(), this.getScaledHeight()];
        //console.log("Modified:", this.e.box);

        let c = this.canvas as ExtendedCanvas;
        c.context?.props.on?.({type: "updated", target: this.e});
    }

   
    constructor(e : Element & { box : number[]}) {
        super({left: e.box[0],
            top: e.box[1],
            width: e.box[2],
            height: e.box[3],
            strokeWidth: 2,
            fill: "transparent",
            stroke: "blue",
            lockRotation: true,
            lockScalingX: false,
            lockScalingY: false,
            strokeUniform: true,
            objectCaching: false
        });
        this.e = e;
        this.on("modified", this.onModified.bind(this));
        this.on("selected", () => (this.canvas as ExtendedCanvas).context?.props.on({type: 'selected', target: e}))
    }

    delete() {
        let c = this.canvas as ExtendedCanvas;
        let ctx = c.context;
        ctx?.data.delete(this.e);
        c?.remove(this);
        ctx?.props.on?.({type: 'delete', target: this.e});
    }

    clone() {
        let other = this.e.clone();
        let c = this.canvas as ExtendedCanvas;
        let ctx = c.context;
        ctx?.data.add(other);
        c.add(new RectElement(other));
        ctx?.props.on?.({type: "add", target: other});
    }

}

/* Shortcuts */
const keyMap = {
    DELETE_ELEMENT: "del",
    DUPLICATE_ELEMENT: "ctrl+d",
}




export function ImageAnnotator(props : ImageAnnotatorProps)
{
    const { selectedObjects, editor, onReady } = useFabricJSEditor();
    const [ready, setReady] = useState(false);
    const canvas = useRef<ExtendedCanvas>();
    const container = useRef<HTMLDivElement>();
    const [imageDims, setImageDims] = useState({width: 0, height: 0})

    const toolbarReducer = useCallback((state : IToolbarReduceCallback, action : {type: toolbarActionType, value?: any}) => {
        switch (action.type) {
            case "zoomIn":
                return {...state, zoom : Math.min(3, state.zoom + 0.2)}
            case "zoomOut":
                return {...state, zoom : Math.max(0.2, state.zoom - 0.2)};
            case "fitToView":
                let c = canvas.current;
                let cont = container.current;
                if (cont && c) {
                    let w = cont.offsetWidth;
                    let h = cont.offsetHeight;
                    let W = imageDims.width;
                    let H = imageDims.height;
                    let r = Math.min(w / W, h / H);
                    console.log("w=", w, "W=", W, "z=", c.getZoom(), "r=", r);

                    return {...state, zoom : r};
                }
            case "zoomToOriginalSize":
                return {...state, zoom : 1};
            case "filter":
                return {...state, isVisible : action.value}
        }
    }, [imageDims]);


    const [{zoom, isVisible}, toolbarDispatch] = useReducer(toolbarReducer, { zoom : props.zoom, isVisible : props.isVisible});


    // Draw the background and the elements
    useEffect(() => {
        let c = canvas.current;
        if (c) {
            fabric.Image.fromURL(props.backgroundImage, (img) => {
                let c = canvas.current;
                if (c) {
                    console.log("Redraw elements");
                    c.clear();
                    c.setWidth(img.width!);
                    c.setHeight(img.height!);
                    setImageDims({width: img.width!, height: img.height!});
                    c.setBackgroundImage(img, c.renderAll.bind(c), {
                        // Needed to position backgroundImage at 0/0
                        originX: 'left',
                        originY: 'top'
                    });
                    c.renderOnAddRemove = false;
                    props.data.forEach( (x) => {
                        if (hasBox(x)) {
                            let r = new RectElement(x as any);
                            r.visible = props.isVisible(x);
                            c!.add(r);
                        }
                    });
                    c.renderOnAddRemove = true;
                    toolbarDispatch({type: "fitToView"});
                    c.renderAll();
                }
            });
        }
    }, [ready, props.backgroundImage, props.data]);

    // Filtering displayed data
    useEffect(() => {
        let c = canvas.current;
        if (c) {
            c.getObjects().filter(x => x instanceof RectElement).forEach((_x) => {
                let x = _x as RectElement;
                x.visible = isVisible(x.e);
            }); 
            c.requestRenderAll();
        }
    }, [isVisible]); 

    // Set the canvas state of the component when ready 
    useEffect(() => {
        let c = canvas.current;
        if (c)
            c.context = {
                props : props,
                data : props.data,
            };
        }, [ready]);

    // Set the canvas zoom
    useEffect(() => { canvas.current?.setZoom(zoom); }, [zoom]);


    const deleteSelectedObjects = function (ev? : KeyboardEvent) {
        let c = canvas.current;
        c?.getActiveObjects().forEach( (o : any) => { o.delete(); } );
    }

    const duplicateSelectedObjects = function(ev? : KeyboardEvent) {
        let c = canvas.current;
        c?.getActiveObjects().forEach( (o : any) => { o.clone(); } );
        ev!.preventDefault();
    }

    const keyHandlers = {
        DELETE_ELEMENT : deleteSelectedObjects,
        DUPLICATE_ELEMENT : duplicateSelectedObjects
    };

    const toolbar = props.toolbar && React.cloneElement(props.toolbar, {dispatch: toolbarDispatch});
    /*
    return (
        <HotKeys keyMap={keyMap} handlers={keyHandlers} allowChanges>
       <Box sx={{width: "100%", height: "100%", diplay: "flex", flexDirection: "column", overflowY: "clip" }} ref={container}>
       {toolbar}
       <Box sx={{width: "100%", maxHeight: "100%", overflow: "scroll", flex: "1 1 auto"}}>
       <FabricJSCanvas className="sample-canvas" onReady={ (c) => { 
           onReady(c);
           canvas.current = c;
           setReady(true);
           }} />
        </Box>
       </Box>
       </HotKeys>
   );
   */

   return (
   <HotKeys keyMap={keyMap} handlers={keyHandlers} allowChanges>
    <Box sx={{width: "100%", height: "100%", diplay: "flex", flexDirection: "column", overflowY: "clip" }} ref={container}>
    {toolbar}
   <Box sx={{width: "100%", maxHeight: "100%", overflow: "scroll", flex: "1 1 auto"}}>
   <FabricJSCanvas className="sample-canvas" onReady={ (c) => { 
    onReady(c);
    canvas.current = c;
    setReady(true);
    }} />
    </Box>
    </Box>
    </HotKeys>);
}