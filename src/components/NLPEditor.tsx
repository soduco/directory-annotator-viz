
import "./NLPEditor.css"
// @ts-ignore
import { MouseEvent, useCallback, useContext, useEffect, useRef, useState } from "react"
import { List, Box, AppBar, Toolbar, Divider, Button } from '@mui/material';
import { Annotation, AppContext, AppContextInterface, TextualAnnotation, VisualizationContext } from "./ApplicationContext";
import React from "react"
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import EditIcon from "@mui/icons-material/Edit";
import BorderColorIcon from "@mui/icons-material/BorderColor";

import { AnnotationRenderer, NLPEditorEditMode } from "./NLPListItem"
import { TAG_COLORS } from "./NLPTextAnnotator";
import { NLPListItemDetails } from "./NLPListItemDetails";
import _, { filter } from "underscore"


const AnnotationRendererM = React.memo(React.forwardRef(AnnotationRenderer),
    (prev, next) => (prev.mode == next.mode && prev.tag == next.tag)
);


function MyToolbar(props: {
    mode: NLPEditorEditMode,
    tag: string,
    viewInline: boolean,
    onModeChange: (mode: NLPEditorEditMode) => void,
    onTagChange: (tag: string) => void
    onViewInlineChange: (v: boolean) => void
  })
  {
    let NERButtons = (<ToggleButtonGroup
        color="primary"
        value={props.tag}
        exclusive
        onChange={(e, value) => (value && props.onTagChange(value))}
        aria-label="Edition mode"
        >
        {
          Object.keys(TAG_COLORS).map( (v) => (<ToggleButton value={v}>{v}</ToggleButton>))
        }
        </ToggleButtonGroup>);
  
    return (<AppBar position="sticky" sx={{height: 60, width: "100%", top: 0, display: 'flex', alignItems: 'left', '& hr': {     mx: 2,   }}} color="inherit">
        <Toolbar >
        <ToggleButtonGroup
          value={props.mode}
          exclusive
          onChange={(e, value) => (value && props.onModeChange(value))}
          aria-label="Edition mode"
          >
          <ToggleButton value={NLPEditorEditMode.TextEdit} aria-label="Text edition">
            <EditIcon />
          </ToggleButton>
          <ToggleButton value={NLPEditorEditMode.NEREdit} aria-label="Labelize">
            <BorderColorIcon />
          </ToggleButton>
        </ToggleButtonGroup>
        <Divider orientation="vertical" flexItem />
        { (props.mode == NLPEditorEditMode.NEREdit) && NERButtons }
        <Divider orientation="vertical" flexItem />
        <FormGroup sx={{hm: 3}}>
            <FormControlLabel control={<Switch checked={props.viewInline} onChange={(e) => props.onViewInlineChange(e.target.checked)} />} label="Edit inline" />
        </FormGroup>
        </Toolbar>
        </AppBar>);
  }

export function NLPEditor() {
    const [editionMode, setEditionMode] = useState(NLPEditorEditMode.ReadOnly);

    // States for labelization
    const [activeNERTag, setActiveNERTag] = useState<string>(Object.keys(TAG_COLORS)[0]);
    const [viewInlineMode, setViewInlineMode] = useState<boolean>(false);
     
    const app_ctx = useContext(AppContext);
    const app_ctx_ref = useRef<AppContextInterface | null>(null);
    let itemsRef = useRef<Record<string, HTMLLIElement | null>>({});
    let viz_ctx = useContext(VisualizationContext);



    useEffect(() => { app_ctx_ref.current = app_ctx; }, [app_ctx]);



    // Automatic scrolling when a focus is set on an item in the image view
    //
    //

    useEffect(() => {
        if (viz_ctx.focusItem) 
            itemsRef.current[viz_ctx.focusItem.id]?.scrollIntoView( { behavior: "smooth", block: "center"})
    }, [viz_ctx.focusItem]);

    
    const handleItemChange = useCallback((x: TextualAnnotation, text: string, xml: string) => {
        console.log("Item " + x.id + " changed.")
        x.text_ocr = text;
        x.ner_xml = xml;
    }, []);

    const setRef = useCallback((x: HTMLLIElement | null) => (x && (itemsRef.current[x.id] = x)), []);

    
    function goto(action: string) {
        let annotations = app_ctx!.annotations;
        let e = viz_ctx.selectedItem;
        if (e) {
            let data = Array.from(annotations);
            let filtered = data.filter(x => (x.type === e!.type));
            let idx = filtered.indexOf(e);
            let n = filtered.length;
            if (idx != -1) {
                if (action == "prev")
                    viz_ctx.setSelectedItem!(filtered[(idx + n - 1) % n]);
                else
                    viz_ctx.setSelectedItem!(filtered[(idx + 1) % n]);
            }
        }
    };


    let content = null;

    if (viewInlineMode) {
        content = <List>
            { 
                app_ctx && Array.from(app_ctx.annotations)
                .filter(e => e.type == "ENTRY")
                .map(e => e as TextualAnnotation)
                .map(e => 
                    <AnnotationRendererM
                        item={e}
                        key={app_ctx.directory + "-" + app_ctx.view + "-" + e.id}
                        ref={setRef}
                        mode={editionMode ?? NLPEditorEditMode.ReadOnly}
                        tag={activeNERTag}
                        onChange={handleItemChange}
                        /> )
            }
            </List>;
    } else if (viz_ctx?.selectedItem) {
        content = <NLPListItemDetails item={viz_ctx.selectedItem} editionMode={editionMode} activeNERTag={activeNERTag}  gotoCallback={goto}/>;
    }

    
    return (
        <Box sx={{width: "100%", height: "100%", display: "block", overflowY: "hidden" }} component="div">
            <MyToolbar 
                mode={editionMode}
                tag={activeNERTag}
                onModeChange={setEditionMode}
                onTagChange={setActiveNERTag}
                viewInline={viewInlineMode}
                onViewInlineChange={setViewInlineMode}  
            />
            <Box sx={{width: "100%", height: "calc(100% - 60px)", display: "block", overflowY: "scroll" }}>
            { content }
            </Box>
        </Box>
    );
}
