import React from "react"

export class Annotation {
    static uid : number = 0;

    id!: string;
    type!: string;
    box!: number[];

    constructor(args : any)
    {
        Object.assign(this, args);
        this.box = Array.from(args.box) // Copy the list
        Annotation.uid = Math.max(Annotation.uid, parseInt(this.id));
    }

    /** Clone the current annotation at offset +10, +10 with a new id
     * 
     * @returns 
     */
    clone() {
        let x = new Annotation({...this, id : ++Annotation.uid});
        x.box[0] += 10
        x.box[1] += 10
        return x;
    }
}

export interface TextualAnnotation extends Annotation {
    text_ocr: string
    ner_xml: string
    tags?: string[]
    comment?: string
    checked?: boolean
    text?: string
}

export function isTextAnnotation(x: Annotation) : x is TextualAnnotation {
    return ("text_ocr" in x && "ner_xml" in x)
}


export interface AppContextInterface {
    directory: string,
    view: number,
    annotations: Set<Annotation>
}

export const AppContext = React.createContext<AppContextInterface|null>(null);

export interface VizContextInterface {
    focusItem: Annotation | null
    setFocusItem?: React.Dispatch<React.SetStateAction<Annotation | null>>
    selectedItem: Annotation | null
    setSelectedItem?: React.Dispatch<React.SetStateAction<Annotation | null>>
}

export const VisualizationContext = React.createContext<VizContextInterface>({
    // The key of the element which has currently the user focus
    // in the left panel or the right
    focusItem: null,
    selectedItem: null
})