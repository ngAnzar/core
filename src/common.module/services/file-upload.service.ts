import { Inject } from "@angular/core"
import { Observable, Observer, EMPTY } from "rxjs"
import { share, catchError } from "rxjs/operators"

import { HttpClient, HttpRequest, HttpEventType } from "@angular/common/http"

import { ProgressEvent } from "../../animation.module"


export interface FileUploadEvent extends ProgressEvent {
    state: "starting" | "progress" | "done"
    name: string
    url?: string
}


export class FileUploadService {
    public constructor(@Inject(HttpClient) private readonly http: HttpClient) {

    }

    public upload(url: string, name: string, file: File, data?: { [key: string]: any }): Observable<FileUploadEvent> {
        return Observable.create((observer: Observer<FileUploadEvent>) => {
            const formData = new FormData()

            formData.append(name, file, file.name)

            if (data) {
                for (const k in data) {
                    formData.append(k, data[k])
                }
            }

            const request = new HttpRequest("POST", url, formData, {
                reportProgress: true,
                withCredentials: true
            })

            let total: number = 0
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
                            observer.next({
                                state: "progress",
                                name: name,
                                current: event.loaded,
                                total: total = event.total,
                                percent: event.total ? event.loaded / event.total : null,
                                url: url
                            })
                            break

                        case HttpEventType.Response:
                            observer.next({
                                state: "done",
                                name: name,
                                current: total,
                                total: total,
                                percent: 1,
                                url: url
                            })
                            observer.complete()
                            break
                    }
                })

            return () => {
                subscription.unsubscribe()
            }

        }).pipe(share())
    }
}
