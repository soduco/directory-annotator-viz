import { Box, Button, TextField, Select, MenuItem, InputLabel, SelectChangeEvent, FormControl, OutlinedInput, Checkbox, FormControlLabel, IconButton, ButtonGroup} from "@mui/material";
import { useContext, useEffect, useState, useCallback, useRef} from "react";
import { Annotation, AppContext, isTextAnnotation, TextualAnnotation } from "./ApplicationContext"
import { TextAnnotator } from "./NLPTextAnnotator"
import SendIcon from "@mui/icons-material/Send"
import ArrowLeft from "@mui/icons-material/ArrowLeft"
import ArrowRight from "@mui/icons-material/ArrowRight"
import { Container, minHeight } from "@mui/system";
import { NLPEditorEditMode } from "./NLPListItem";
import {computeNER, computeOCR} from "../API"
import RestartAltIcon from '@mui/icons-material/RestartAlt';

interface NLPListItemProps
{
    item: Annotation
    editionMode: NLPEditorEditMode
    activeNERTag: string
    gotoCallback: (action: string) => void
}

const TAGS = [ "TAG A", "TAG B", "TAG C"];

// Controler for tags selection
function TagSelector(props : { value: string[], onChange?: (value: string[]) => void})
{
    const handleChange = (event: SelectChangeEvent<string[]>) => {
      const v = event.target.value;
      const tags = (typeof v === 'string' ? v.split(',') : v);
      props.onChange?.(tags);
    };


    const ITEM_HEIGHT = 48;
    const ITEM_PADDING_TOP = 8;
    const MenuProps = {
      PaperProps: {
        style: {
          maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
          width: 250,
        },
      },
    };

    return (
        <div>
          <FormControl sx={{ my: 1 }} fullWidth>
            <InputLabel>Tags</InputLabel>
            <Select
              multiple
              value={props.value}
              onChange={handleChange}
              input={<OutlinedInput label="Tag" />}
              MenuProps={MenuProps}
            >
              {TAGS.map((name) => (
                <MenuItem key={name} value={name}>{name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
      );  
} 


export function NLPListItemDetails(props: NLPListItemProps)
{
    const app_ctx = useContext(AppContext);

    const [isValid, setIsValid] = useState<boolean>(false);
    const [text, setText] = useState<string>("");
    const [comment, setComment] = useState<string>("")
    const [annotations, setAnnotations] = useState<string>("");
    const [tags, setTags] = useState<string[]>([]);
    const [checked, setChecked] = useState<boolean>(false);

    //const [activeNERTag, setActiveNERTag] = useState<string>(Object.keys(TAG_COLORS)[0]);
    //const [editionMode, setEditionMode] = useState<NLPEditorEditMode>(NLPEditorEditMode.TextEdit);

    const reload = () => {
      let item = props.item;
      if (item && isTextAnnotation(item))
      {
        setText(item.text_ocr);
        setComment(item.comment ?? "")
        setAnnotations(item.ner_xml);
        setTags(item.tags ?? []);
        setChecked(item.checked ?? false);
        setIsValid(true);
      }
      else
        setIsValid(false);
    };

    const reOCR = function () {
      if (!app_ctx)
          return;
      let promise = computeOCR(app_ctx.directory, app_ctx.view, [props.item.box]);
      promise.then(texts => { 
          setText(texts[0]);
          setAnnotations(texts[0]);
      });
    };

  const reNER = useCallback(() => {
      if (!app_ctx)
          return;

      let promise = computeNER(text);
      promise.then(text => {
          setAnnotations(text);
      });
    }, [text]);

    useEffect(() => reload(), [props.item]);

    // States text edition
    const [isTextEditing, setIsTextEditing] = useState(false);
    const hasTextChanged = useRef(false);
    const isFirstMount = useRef(true);
    /*
    // Notify the parent whenever the state changes (but not at mount)
    useEffect( () => {
        if (isFirstMount.current) {
            isFirstMount.current = false;
            return;
        }
        if (isTextEditing)
            return;
        console.log("Hook was raised.");
        props.onChange?.(props.id, text, JSONToXML(text, annotations))
        }     
    , [text, annotations]);

    */

    const startEditing = useCallback(() => {
        setIsTextEditing(true);
        hasTextChanged.current = false;
    }, []);

    const save = () => {
      let item = props.item as TextualAnnotation;
      item.text_ocr = text;
      item.comment = comment;
      item.ner_xml = annotations;
      item.tags = tags;
      item.checked = checked;
    }

   
    let content = null;

    if (!isValid)
      return <></>;

    if (props.editionMode == NLPEditorEditMode.TextEdit && isTextEditing) {
        content = (<TextField
          sx={{ fontSize : "1.5em" }}
          fullWidth
          multiline
          minRows={3}
          value={text}
          color="secondary"
          focused
          onChange={(e) => {setText(e.target.value); hasTextChanged.current = true; }}
          onBlur={() => {
              setIsTextEditing(false);
              if (hasTextChanged.current) 
                  setAnnotations(text);
          }}
          />
          )
    } else if (props.editionMode == NLPEditorEditMode.NEREdit) {
      content = <TextAnnotator text={annotations} tag={props.activeNERTag} onChange={setAnnotations} readonly={false}/>
    } else {
      content = <TextAnnotator text={annotations} tag="" onChange={setAnnotations} readonly/>
    }    

    return (
        <Box sx={{ textAlign: "left", p: 2, display: "flex", flexDirection: "column"}}>
            <Box textAlign="center">
            <Button variant="outlined" startIcon={<RestartAltIcon />} onClick={reOCR} sx={{width: 200}}>OCR</Button>
            <Button variant="outlined" startIcon={<RestartAltIcon />} onClick={reNER} sx={{width: 200}}>NER</Button>
            </Box>
            <Box className="NLPAnnotation" onDoubleClick={startEditing} sx={{minHeight: "300px"}}>
            {content}
            </Box>
            <TextField value={comment} onChange={e => setComment(e.target.value)} multiline label="Comment" minRows={4}/>
            <TagSelector value={tags} onChange={setTags} />
            <FormControlLabel control={<Checkbox checked={checked} onChange={(e) => setChecked(e.target.checked)} />} label="Checked" />


            <Container sx={{width: "100%", textAlign: "center"}}>
            <IconButton color="primary" onClick={() => props.gotoCallback("prev")}>
              <ArrowLeft />
            </IconButton>
            <Button variant="contained" endIcon={<SendIcon />} onClick={(e) => save()}>
              Save
            </Button>
            <IconButton color="primary" onClick={() => props.gotoCallback("next")}>
              <ArrowRight />
            </IconButton>
            </Container>
        </Box>
        )
}