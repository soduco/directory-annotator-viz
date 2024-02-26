import axios from "axios";
import _ from "underscore";
import { Annotation } from "./components/ApplicationContext";
import { error } from "console";


const storage = axios.create({
    baseURL: process.env.REACT_APP_STORAGE_URI ?? window._env_.REACT_APP_STORAGE_URI,
    //baseURL: "http://127.0.0.1:3000",
    //baseURL: "https://apps.lrde.epita.fr:443/soduco/directory-annotator/storage",
  });


const compute = axios.create({
    baseURL: process.env.REACT_APP_COMPUTE_URI ?? window._env_.REACT_APP_COMPUTE_URI,
    //baseURL: "http://127.0.0.1:5000",
    //baseURL: "https://apps.lrde.epita.fr:443/soduco/directory-annotator/backend",
});


compute.defaults.headers.common["Authorization"] = process.env.REACT_APP_COMPUTE_AUTH_TOKEN ?? window._env_.REACT_APP_COMPUTE_AUTH_TOKEN;
storage.defaults.headers.common["Authorization"] = process.env.REACT_APP_STORAGE_AUTH_TOKEN ?? window._env_.REACT_APP_STORAGE_AUTH_TOKEN;
storage.defaults.headers.common["Content-Type"] = "application/json"


export function getAnnotations(directory: string, view: number) {
    let callback = (res: any) => {
        let content = res.data.content as Object[];
        let annotations = content.map(x => new Annotation(x));
        //let annotations : Record<string, any> = {};
        //_.each(content, (e) => { annotations[e.id] = e });
        return new Set(annotations);
    };

    let uri = "/directories/" + directory + '/' + view + '/annotation';
    
    // Promise from the Storage
    return storage.get(uri, {responseType: "json" })
    .then(callback)
    .catch(() => {
        // Promise from the Compute
        let compute_promise = compute.get(uri, {responseType: "json"}).then(callback);
        console.log("The annotations are missing, asking for computation.");
        return compute_promise;
    })
    ;
}

export function getDirectoryList() {
    return storage.get("/directories/").then((res) : string[] => 
        Object.keys(res.data["directories"]))
}

export function getPagesCount(directory: string) {
    return storage.get("/directories/" + directory).then((res) : number => res.data["num_pages"])
}

export function getImage(directory: string, view: number) {
    return  compute.get("/directories/" + directory + '/' + view + '/image_deskew', { responseType: "arraybuffer"})
    .then((buffer) => Buffer.from(buffer.data));
}

export function computeNER(text: string) {
    return compute.post("/ner/", {
        texts : [text],
        model : "bert"
    }).then(response => {
        console.log(response.data);
        return response.data[0]["ner_xml"] as string;
    });
}

export function setAnnotations(directory: string, view: number, data : Set<Annotation>)
{
    let content = Array.from(data);
    return storage.put("/directories/" + directory + '/' + view + '/annotation', {
        "content" : content
    });
}



/**
 * 
 * @param directory The pdf id
 * @param view The pdf view
 * @param regions List of [x y width height]
 * @returns 
 */
export function computeOCR(directory: string, view: number, regions: Array<number[]>)
{
    const mode = "regions";
    const r = regions.map((e, index) => {
        let [x,y,w,h] = e;
        return {"id" : index, "bbox" : [x,y,x+w,y+h]}
    }); 

    return compute.post("/ocr/pero/" + mode, {
        document: directory,
        view: view,
        regions: r
    }).then((response : any) => {
        console.log(response.data);
        let content = response.data["content"] as Array<any>;
        let texts = content.map(
            (e : any) => (e["lines"] as Array<any>).reduce((text, x) => text + x["transcription"] + "\n", "")
        );    
        return texts;
    });
}
