import { Inject, Injectable, OnDestroy } from "@angular/core"
import { LocationStrategy, Location } from "@angular/common"
import { SubscriptionLike } from "rxjs"

import { ShortcutService, CordovaService } from "../common.module"
import { ToastService } from "../layer.module"
import { rawClearTimeout, rawSetTimeout } from "../util"


@Injectable({ providedIn: "root" })
export class DoubleBackExitService implements OnDestroy {

    private readonly sc = this.shortcut.create({
        "double-tap-exit": {
            shortcut: "back", handler: () => {
                const base = this.locationStrategy.getBaseHref()
                const curr = window.location.pathname

                if (base === curr) {
                    if (this.isExitAfterBack) {
                        this.stopCountdown()
                        this.exit()
                    } else {
                        this.startCountdown()
                    }
                } else {
                    this.locationStrategy.back()
                }
            }
        }
    })

    private isExitAfterBack: boolean = false
    private s: SubscriptionLike

    public constructor(
        @Inject(ShortcutService) private readonly shortcut: ShortcutService,
        @Inject(LocationStrategy) private readonly locationStrategy: LocationStrategy,
        @Inject(Location) location: Location,
        @Inject(CordovaService) private readonly cordova: CordovaService,
        @Inject(ToastService) private readonly toast: ToastService) {

        this.s = location.subscribe(() => {
            this.stopCountdown()
        })
    }

    public install() {
        this.sc.watch(document.body)
    }

    public uninstall() {
        this.sc.unwatch(document.body)
    }

    public ngOnDestroy() {
        this.s?.unsubscribe()
        this.uninstall()
    }

    private get rootUri(): string {
        const loc = window.location
        let base = this.locationStrategy.getBaseHref()
        if (base[0] !== "/") {
            base = `/${base}`
        }
        return `${loc.protocol}//${loc.hostname}${base}`
    }

    private exit() {
        this.cordova.exit()
    }

    private _destroyToast: () => void

    private startCountdown() {
        this._destroyToast && this._destroyToast()

        this.isExitAfterBack = true
        const toast = this.toast.info("A bezáráshoz nyomd meg mégegyszer a vissza gombot", { align: "bottom center", autohide: 0 })
        const t = rawSetTimeout(() => { this._destroyToast() }, 5000)

        this._destroyToast = () => {
            this._destroyToast = null
            rawClearTimeout(t)
            toast.hide()
            this.isExitAfterBack = false
        }
    }

    private stopCountdown() {
        this._destroyToast && this._destroyToast()
    }
}
