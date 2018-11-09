import { Injectable, Inject } from "@angular/core"
import { DOCUMENT } from "@angular/platform-browser"
import { Observable, Observer, fromEvent } from "rxjs"
import { share } from "rxjs/operators"



export interface FileDownloadEvent {
    state: "starting" | "progress"

}


@Injectable()
export class FileDownloadService {
    public constructor(@Inject(DOCUMENT) protected readonly doc: Document) {

    }

    public download(url: string, progress?: boolean): Observable<FileDownloadEvent> {
        url = this._qualifyUrl(url)

        return Observable.create((observer: Observer<FileDownloadEvent>) => {
            const iframe = this._iframe()
            this.doc.body.appendChild(iframe)

            const loadS = fromEvent(iframe, "load").subscribe(event => {
                observer.next({ state: "progress" })
            })
            const messageS = fromEvent(window, "message").subscribe((event: any) => {
                let data = event.data as any
                if (data && data.type === "url-load-error" && data.url === url) {
                    observer.error(data)
                    observer.complete()
                }
            })

            observer.next({ state: "starting" })
            iframe.src = url

            return () => {
                loadS.unsubscribe()
                messageS.unsubscribe()
                if (iframe.parentNode) {
                    iframe.parentNode.removeChild(iframe)
                }
            }
        }).pipe(share())
    }

    protected _iframe(): HTMLIFrameElement {
        const iframe = this.doc.createElement("iframe")
        iframe.style.display = "none"
        return iframe
    }

    protected _qualifyUrl(url: string): string {
        const img = this.doc.createElement("img")
        img.src = url
        url = img.src
        img.src = null
        return url
    }
}
