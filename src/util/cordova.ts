import { Observable, of, Observer } from "rxjs"
import { shareReplay } from "rxjs/operators"


function initDeviceReady() {
    return new Observable((observer: Observer<boolean>) => {
        console.log("AAAAAAAAAA")
        const handler = () => {
            console.log("initDeviceReady.handler")
            observer.next(true)
            observer.complete()
        }

        document.addEventListener("deviceready", handler, false)
        return () => {
            document.removeEventListener("deviceready", handler, false)
        }
    })
}


const DEVICE_READY = typeof (window as any).cordova !== "undefined"
    ? initDeviceReady().pipe(shareReplay(1))
    : of(true)



export function isDeviceReady(): Observable<boolean> {
    return DEVICE_READY
}
