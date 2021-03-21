import { Injectable, Inject } from "@angular/core"
import { DOCUMENT } from "@angular/common"
import { HttpClient, HttpRequest, HttpEventType } from "@angular/common/http"
import { Observable, Observer, fromEvent, EMPTY } from "rxjs"
import { share, catchError } from "rxjs/operators"
const contentDisposition = require("content-disposition")

// import { __zone_symbol__ } from "../../util/zone"
import { ProgressEvent } from "../../animation.module"


// const SET_TIMEOUT: "setTimeout" = __zone_symbol__("setTimeout")


export interface FileDownloadEvent extends ProgressEvent {
    state: "starting" | "progress" | "done"
    filename: string
    url?: string
}


export class FileDownloadError extends Error {
    public constructor(
        public readonly message: string,
        public readonly response: any,
        public readonly original: any) {
        super()
    }
}


@Injectable()
export class FileDownloadService {
    public constructor(
        @Inject(DOCUMENT) protected readonly doc: Document,
        @Inject(HttpClient) private readonly http: HttpClient) {

    }

    public download(url: string, filename?: string): Observable<FileDownloadEvent> {
        return new Observable((observer: Observer<FileDownloadEvent>) => {
            url = this._qualifyUrl(url)

            const request = new HttpRequest("GET", url, {
                reportProgress: true,
                responseType: "blob",
                withCredentials: true
            })

            let total: number
            let downloadUrl: string

            const subscription = this.http.request(request)
                .pipe(
                    catchError((err: any) => {
                        console.log(err)
                        if (err.headers.get("Content-Type") === "application/json"
                            && err.error
                            && err.error.type === "application/json") {
                            const reader = new FileReader()
                            reader.onload = (event) => {
                                const content = JSON.parse(event.target.result as string)
                                observer.error(new FileDownloadError(content.message, content, err))
                            }
                            reader.readAsText(err.error)
                        } else {
                            observer.error(err)
                        }
                        return EMPTY
                    })
                )
                .subscribe(event => {
                    let cd: string

                    switch (event.type) {
                        case HttpEventType.Sent:
                            break

                        case HttpEventType.ResponseHeader:
                            if (event.status >= 200 && event.status <= 299) {
                                try {
                                    if (!filename) {
                                        cd = event.headers.get("Content-Disposition")
                                        if (cd) {
                                            filename = contentDisposition.parse(cd).parameters.filename
                                        }

                                        if (!filename) {
                                            filename = "file"
                                        }
                                    }
                                } catch (e) {
                                    observer.error(new FileDownloadError(`Invalid Content-Disposition header: ${cd}`, null, e))
                                }
                                observer.next({ state: "starting", filename: filename, total: Number(event.headers.get("Content-Length")) || null })
                            } else {
                                observer.error(new FileDownloadError(event.statusText, null, event))
                            }
                            break

                        case HttpEventType.DownloadProgress:
                            observer.next({
                                state: "progress",
                                filename: filename,
                                current: event.loaded,
                                total: total = event.total,
                                percent: event.total ? event.loaded / event.total : null
                            })
                            break

                        case HttpEventType.Response:
                            downloadUrl = URL.createObjectURL(event.body)
                            this._save(downloadUrl, filename || "")

                            observer.next({
                                state: "done",
                                filename: filename,
                                current: total,
                                total: total,
                                percent: 1,
                                url: downloadUrl
                            })
                            observer.complete()
                            break
                    }
                })

            return () => {
                subscription.unsubscribe()
                if (downloadUrl) {
                    URL.revokeObjectURL(downloadUrl)
                }
            }
        }).pipe(share())
    }

    // public __download(url: string, progress?: boolean): Observable<FileDownloadEvent> {
    //     url = this._qualifyUrl(url)

    //     return Observable.create((observer: Observer<FileDownloadEvent>) => {
    //         const iframe = this._iframe()
    //         this.doc.body.appendChild(iframe)

    //         const loadS = fromEvent(iframe, "load").subscribe(event => {
    //             observer.next({ state: "progress" })
    //         })
    //         const messageS = fromEvent(window, "message").subscribe((event: any) => {
    //             let data = event.data as any
    //             if (data && data.type === "url-load-error" && data.url === url) {
    //                 observer.error(data)
    //                 observer.complete()
    //             }
    //         })

    //         observer.next({ state: "starting" })
    //         iframe.src = url

    //         return () => {
    //             loadS.unsubscribe()
    //             messageS.unsubscribe()
    //             if (iframe.parentNode) {
    //                 iframe.parentNode.removeChild(iframe)
    //             }
    //         }
    //     }).pipe(share())
    // }

    protected _save(objectUrl: string, filename: string) {
        const a = this.doc.createElement("a")
        a.href = objectUrl
        a.download = filename
        a.style.visibility = "hidden"
        a.style.position = "absolute"

        this.doc.body.appendChild(a)

        a.click()
        a.parentNode.removeChild(a)
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
