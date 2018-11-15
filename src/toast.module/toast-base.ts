import { HostListener } from "@angular/core"

import { LayerRef } from "../layer.module"


export abstract class ToastBase {
    protected abstract readonly layerRef: LayerRef

    protected set autohide(val: number) {
        if (this._autohide !== val) {
            if (this._autohideTimer) {
                clearInterval(this._autohideTimer)
            }

            if (!this._autohide) {
                this._autohideElapsed = 0
            }

            if (this._autohide = val) {
                this._autohideTimer = setInterval(this.autoHideTick, 20)
            }
        }
    }
    private _autohide: number = 0
    private _autohideTimer: any
    private _autohideElapsed: number

    protected _suspendAutohide: number = 0

    @HostListener("mouseenter")
    protected onMouseEnter() {
        this._suspendAutohide++
        console.log("onMouseEnter")
    }

    @HostListener("mouseleave")
    protected onMouseLeave() {
        this._suspendAutohide = Math.max(0, this._suspendAutohide - 1)
        console.log("onMouseLeave")
    }

    protected autoHideTick = () => {
        if (this._suspendAutohide !== 0) {
            return
        }

        this._autohideElapsed += 20
        if (this._autohideElapsed >= this._autohide) {
            this.onAutoHideProgress(1)
        } else {
            this.onAutoHideProgress(this._autohideElapsed / this._autohide)
        }
    }

    protected onAutoHideProgress(progress: number) {
        if (progress === 1) {
            this.autohide = 0
            this.layerRef.hide()
        }
    }
}
