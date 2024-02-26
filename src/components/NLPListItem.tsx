import React, { useEffect } from "react";
import {useState, useRef} from "react";
import { ListItem, ListItemText, TextField } from "@mui/material";
import { TextAnnotator } from "./NLPTextAnnotator";
import { TextualAnnotation } from "./ApplicationContext";



export enum NLPEditorEditMode {
    ReadOnly,
    TextEdit,
    NEREdit
};




interface AnnotationRendererProps
{
    item : TextualAnnotation
    mode: NLPEditorEditMode  // The current edition mode 
    tag: string              // The tag that will be used for labelization
    onChange?: (item: TextualAnnotation, text:string, xml: string) => void  // Callback used to notify the parent when the item is updated
}

export function AnnotationRenderer(props: AnnotationRendererProps, ref: any)
{
    const [text, setText] = useState(props.item.text_ocr);
    const [annotations, setAnnotations] = useState(props.item.ner_xml);

    // States text edition
    const [isTextEditing, setIsTextEditing] = useState(false);
    const hasTextChanged = useRef(false);
    const isFirstMount = useRef(true);

    // Notify the parent whenever the state changes (but not at mount)
    useEffect( () => {
        if (isFirstMount.current) {
            isFirstMount.current = false;
            return;
        }
        if (isTextEditing)
            return;
        console.log("Hook was raised.");
        props.onChange?.(props.item, text, annotations)
        }     
    , [text, annotations]);


    const startEditing = React.useCallback(() => {
        setIsTextEditing(true);
        hasTextChanged.current = false;
    }, []);

    
    let content = null;
    if (isTextEditing) {
      content = (<TextField
        sx={{ fontSize : "1.5em" }}
        fullWidth
        multiline
        minRows={3}
        value={text}
        color="secondary"
        focused
        onChange={(e) => {setText(e.target.value); hasTextChanged.current = true; }}
        onMouseLeave={() => {
            setIsTextEditing(false);
            if (hasTextChanged.current) 
                setAnnotations(text);
        }}
        />
        )
    } else {
        content = <TextAnnotator
            text={annotations}
            onChange={setAnnotations}
            tag={props.tag} 
            readonly={props.mode != NLPEditorEditMode.NEREdit}
        />
    }
    

    return (
        <ListItem /*ref={el => props.itemsRef.current[props.id] = el} */
            id={props.item.id}
            ref={ref}
            onDoubleClick={ props.mode == NLPEditorEditMode.TextEdit ? startEditing : undefined}
            >
        <ListItemText className="NLPAnnotation">
            {content}
        </ListItemText>
        </ListItem>
        )
}

