import { Injectable } from "@angular/core"
import { Observable, Observer, merge } from "rxjs"
import { shareReplay, map, startWith } from "rxjs/operators"

import { isDeviceReady, __zone_symbol__ } from "../../util"

const SET_TIMEOUT = __zone_symbol__("setTimeout")


declare const Keyboard: { isVisible: boolean }


@Injectable({ providedIn: "root" })
export class CordovaService {
    public readonly keyboardShowing = this._createEventListener(window, "keyboardWillShow")
    public readonly keyboardShow = this._createEventListener(window, "keyboardDidShow")

    public readonly keyboardHiding = this._createEventListener(window, "keyboardWillHide")
    public readonly keyboardHide = this._createEventListener(window, "keyboardDidHide")

    public readonly keyboardIsVisible = merge(this.keyboardShowing, this.keyboardHiding).pipe(
        startWith(null),
        map(v => {
            if (v === null) {
                return typeof Keyboard !== "undefined" ? Keyboard.isVisible : false
            } else {
                return v.type === "keyboardWillShow"
            }
        }),
        shareReplay(1)
    )

    public hideSplashScreen(delay: number) {
        if (typeof (window as any).cordova !== "undefined" && typeof (navigator as any).splashscreen !== "undefined") {
            isDeviceReady().subscribe(ready => {
                window[SET_TIMEOUT](() => {
                    (navigator as any).splashscreen.hide()
                }, delay)
            })
        }
    }

    private _createEventListener(target: any, name: string): Observable<Event> {
        return Observable.create((observer: Observer<Event>) => {
            const handler = (event: Event) => {
                observer.next(event)
            }

            target.addEventListener(name, handler, false)
            return () => {
                target.removeEventListener(name, handler, false)
            }
        }).pipe(shareReplay(1))
    }
}
