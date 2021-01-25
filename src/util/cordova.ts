import { Observable, of, Observer } from "rxjs"
import { shareReplay, take } from "rxjs/operators"


function initDeviceReady() {
    return new Observable((observer: Observer<boolean>) => {
        const handler = () => {
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



export function onDeviceReady(handler: () => void) {
    DEVICE_READY.pipe(take(1)).subscribe(handler)
}
