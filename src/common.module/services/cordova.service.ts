import { Injectable } from "@angular/core"
import { Observable, Observer, merge } from "rxjs"
import { shareReplay, map, startWith, filter } from "rxjs/operators"

import { onDeviceReady, rawSetTimeout } from "../../util"


declare const Keyboard: { isVisible: boolean }


function _onReady(handler: () => void) {
    onDeviceReady(() => {
        if (typeof (window as any).cordova !== "undefined") {
            handler()
        }
    })
}


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
        _onReady(() => {
            if (typeof (window as any).cordova !== "undefined" && typeof (navigator as any).splashscreen !== "undefined") {
                const splashscreen: any = (navigator as any).splashscreen
                rawSetTimeout(splashscreen.hide.bind(splashscreen), delay)
            }
        })
    }

    public get isCordova(): boolean { return typeof (window as any).cordova !== "undefined" }

    public hideStatusbar() {
        this._statusbar(sb => sb.hide())
    }

    public showStatusbar() {
        this._statusbar(sb => sb.show())
    }

    public enterFullScreen() {
        _onReady(() => {
            if (typeof (window as any).AndroidFullScreen !== "undefined") {
                (window as any).AndroidFullScreen.immersiveMode()
            }
        })
    }

    public exit() {
        _onReady(() => {
            (navigator as any).app.exitApp()
        })
    }

    private _createEventListener(target: any, name: string): Observable<Event> {
        return new Observable((observer: Observer<Event>) => {
            const handler = (event: Event) => {
                observer.next(event)
            }

            target.addEventListener(name, handler, false)
            return () => {
                target.removeEventListener(name, handler, false)
            }
        }).pipe(shareReplay(1))
    }

    private _statusbar(handler: (statusbar: any) => void): void {
        _onReady(() => {
            if (typeof (window as any).StatusBar !== "undefined") {
                handler((window as any).StatusBar)
            }
        })
    }
}
