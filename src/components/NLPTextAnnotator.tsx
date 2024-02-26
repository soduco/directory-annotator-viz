import React, { useEffect } from "react";
import { TextAnnotator as TA} from "react-text-annotate"
import _ from "underscore"

export interface Tag {
    start: number;
    end: number;
    tag: string;
    color: string;
}

export const TAG_COLORS: {[key: string]: string} = {
    "PER"  : "#f6bd60ff",
    "ACT"  : "#f7ede2ff",
    "LOC"  : "#f5cac3ff",
    "CARDINAL" : "#84a59dff",
    "TITRE"  : "#f28482ff",
};

interface TextAnnotatorProps
{
    text: string  // Annotation as an xml string
    tag: string          // Active tag
    readonly: boolean
    onChange: (v: string) => void   // New annotions as xml string
};

function escapeHtml(unsafe: string)
{
    return unsafe
         .replace(/&/g, "&amp;")
         //.replace(/</g, "&lt;")
         //.replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
 }

function encodeHtmlEntities(str: string) {
    return str.replace(/[\u00A0-\u9999<>\&]/gim, function(i) {
      return '&#' + i.charCodeAt(0) + ';';
    }   );     
}

function XML2Json(ner_xml: string) : { text: string, annotations: Tag[] } {
    if (ner_xml == "")
        return { text : "", annotations : []};


    ner_xml = "<root>" + escapeHtml(ner_xml)  + "</root>";
    let parser = new DOMParser();
    let xmlDoc = parser.parseFromString(ner_xml,"text/xml");
    let pos = 0;
    let text = "";
    let annot : Array<Tag> = [];
    const errorNode = xmlDoc.querySelector("parsererror");
    if (errorNode) {
      console.log("error while parsing");
    }
    Array.from(xmlDoc.documentElement.childNodes).forEach( (e) => {
      if (e.nodeType == 3) {
        let content = e.nodeValue
      	text += content
        pos += content!.length
      } else {
        let content = e.textContent;
        text += content
        let end = pos + content!.length
      	annot.push({
              start: pos,
              end: end,
              color: TAG_COLORS[e.nodeName],
              tag: e.nodeName
        });
        pos = end;
      }
    });
    return { "text" : text,  "annotations" : annot }
};

function JSONToXML(text: string, annotations: Tag[])
{
    let A = _.sortBy(annotations, e => e.end);
    A.reverse().forEach(e => {
        text = text.slice(0, e.end) + '</' + e.tag + '>' + text.slice(e.end);
        text = text.slice(0, e.start) + '<' + e.tag + '>' + text.slice(e.start);
    });

    return text;
}

function has_overlap(annotations: Tag[]) : boolean 
{
    // Sort by end
    let A = _.sortBy(annotations, e => e.end);
    for (let i = 0; i < A.length - 1; i++) {
        if (A[i].end > A[i+1].start)
            return true;
    }
    return false;
}
   


export function TextAnnotator(props: TextAnnotatorProps)
{
    //const [text, setText] = React.useState("");
    const [annotations, setAnnotations] = React.useState<Tag[] | undefined>(undefined);
    
    //useEffect(() => {
    //    let {text, annotations} = XML2Json(props.text);
    //    setText(text);
    //    setAnnotations(annotations);
    //}, [props.text]);


    let data = XML2Json(props.text);

    useEffect(() => {
        setAnnotations(data.annotations);
    }, [props.text]);

    useEffect(() => {
        if (annotations === undefined)
            return;

        // Trigger onChange only if the annotations have changed and there is no overlap
        if (annotations != data.annotations && !has_overlap(annotations)) {
            let new_text = JSONToXML(data.text, annotations);
            if (new_text != props.text)
                props.onChange(new_text);
        }
    }, [annotations]);

    const getSpanCallback = (span: any) : Tag => ({
            start: span.start,
            end: span.end,
            tag: props.tag,
            color: TAG_COLORS[props.tag],
        });
    const setAnnotationsWrapper = (value: any) => {
        if (!props.readonly) {
            setAnnotations(value);
        }
    };

    return (
    <TA
        content={data.text}
        value={annotations!}
        onChange={setAnnotationsWrapper}
        getSpan={props.readonly ? undefined : getSpanCallback}
        />
    );
}