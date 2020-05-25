import { Observable, of, Observer } from "rxjs"

import { __zone_symbol__ } from "./zone"


const ADD_EVENT_LISTENER = __zone_symbol__("addEventListener")
const REMOVE_EVENT_LISTENER = __zone_symbol__("removeEventListener")


export function isDeviceReady(): Observable<boolean> {
    if (typeof (window as any).cordova !== "undefined") {
        return Observable.create((observer: Observer<boolean>) => {
            console.log("AAAAAAAAAAAAAAAAAAAA")
            const handler = () => {
                console.log("deviceready handlere")
                observer.next(true)
                observer.complete()
            }

            // document[ADD_EVENT_LISTENER]("deviceready", handler, false)
            document.addEventListener("deviceready", handler, false)
            return () => {
                document.removeEventListener("deviceready", handler, false)
            }
        })
    } else {
        return of(true)
    }
}
