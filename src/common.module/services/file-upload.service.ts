import { Inject, Injectable } from "@angular/core"
import { Observable, Observer, EMPTY } from "rxjs"
import { share, catchError } from "rxjs/operators"

import { HttpClient, HttpRequest, HttpEventType } from "@angular/common/http"

import { ProgressEvent } from "../../animation.module"


export interface FileUploadEvent extends ProgressEvent {
    state: "starting" | "progress" | "done"
    name?: string
    url?: string
    response?: { [key: string]: any }
}


export class FileUploadError extends Error {
    public constructor(
        message: string,
        public readonly data: { [key: string]: any }) {
        super(message)
    }
}


@Injectable()
export class FileUploadService {
    public constructor(@Inject(HttpClient) private readonly http: HttpClient) {

    }

    public upload(url: string, name: string, file: File, data?: { [key: string]: any }): Observable<FileUploadEvent> {
        return Observable.create((observer: Observer<FileUploadEvent>) => {
            const formData = new FormData()

            formData.append(name, file, file.name)

            if (data) {
                for (const k in data) {
                    if (data.hasOwnProperty(k)) {
                        formData.append(k, data[k])
                    }
                }
            }

            const request = new HttpRequest("POST", url, formData, {
                reportProgress: true,
                withCredentials: true
            })

            let total: number = 0
            let fileSize: number = file.size
            const subscription = this.http.request(request)
                .pipe(
                    catchError(err => {
                        observer.error(err)
                        return EMPTY
                    })
                )
                .subscribe(event => {
                    switch (event.type) {
                        case HttpEventType.Sent:
                            observer.next({
                                state: "starting",
                                name: name,
                                url: url
                            })
                            break

                        case HttpEventType.UploadProgress:
                            let overhead = Math.max(0, event.total - fileSize)
                            let loaded = Math.max(0, event.loaded - overhead)
                            observer.next({
                                state: "progress",
                                name: name,
                                current: loaded,
                                total: total = Math.max(0, event.total - overhead),
                                percent: total ? loaded / total : null,
                                url: url
                            })
                            break

                        case HttpEventType.Response:
                            const body = event.body as { [key: string]: any }

                            if (body.error) {
                                const error = body.error
                                observer.error(new FileUploadError(error.message, error))
                            } else {
                                observer.next({
                                    state: "done",
                                    name: name,
                                    current: total,
                                    total: total,
                                    percent: 1,
                                    url: url,
                                    response: body.result
                                })
                                observer.complete()
                            }
                            break
                    }
                })

            return () => {
                subscription.unsubscribe()
            }

        }).pipe(share())
    }
}
