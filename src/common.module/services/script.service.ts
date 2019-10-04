import { Injectable, Inject } from "@angular/core"
import { DOCUMENT } from "@angular/common"
import { Observable, Observer } from "rxjs"


export interface ScriptModel {
    name: string,
    src: string,
    loaded: boolean
}

@Injectable()
export class ScriptService {
    private scripts: ScriptModel[] = []

    public constructor(@Inject(DOCUMENT) protected doc: Document) {
    }

    public load(src: string): Observable<ScriptModel> {
        let script = { src } as ScriptModel
        return new Observable<ScriptModel>((observer: Observer<ScriptModel>) => {
            let existingScript = this.scripts.find(s => s.src == script.src)

            if (existingScript && existingScript.loaded) {
                observer.next(existingScript)
                observer.complete()
            } else {
                this.scripts.push(script)

                // Load the script
                let scriptElement = this.doc.createElement("script")
                scriptElement.type = "text/javascript"
                scriptElement.src = script.src

                scriptElement.onload = () => {
                    script.loaded = true
                    observer.next(script)
                    observer.complete()
                }

                scriptElement.onerror = (error: any) => {
                    observer.error("Couldn't load script " + script.src)
                }

                this.doc.body.appendChild(scriptElement)
            }
        })
    }
}


