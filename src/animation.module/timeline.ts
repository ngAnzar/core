import { NgZone } from "@angular/core"

import { IDisposable } from "../util"

export type KeyframeCb = (kfPercent: number, totalPercent: number) => void


export class Timeline implements IDisposable {
    protected rafId: number
    protected startTime: number
    protected stopped: boolean = false
    protected keyframes: Array<{ cb: KeyframeCb, enabled: () => boolean }> = []
    protected iteration: number = 0

    public set totalTime(val: number) {
        if (this._totalTime !== val) {
            this._totalTime = val
            delete this.startTime
        }
    }
    public get totalTime(): number { return this._totalTime }

    public constructor(protected zone: NgZone, protected _totalTime: number) {

    }

    public keyframe(cb: KeyframeCb, enabled: () => boolean) {
        this.keyframes.push({ cb, enabled })
    }

    public play() {
        if (!this.rafId) {
            this.stopped = false
            this.zone.runOutsideAngular(() => {
                this.rafId = requestAnimationFrame(this.tick)
            })
        }
    }

    public stop() {
        this.stopped = true
        this.iteration = 0
        delete this.startTime
        if (this.rafId) {
            const id = this.rafId
            delete this.rafId
            cancelAnimationFrame(id)
        }
    }

    public tick = (t: number) => {
        if (!this.startTime) {
            this.startTime = t
        }

        delete this.rafId

        const elapsed = t - this.startTime
        const kfs = this.keyframes.filter(v => v.enabled())
        const kl = kfs.length
        // const iteration = Math.floor(elapsed / this.totalTime)
        const animT = elapsed - this.totalTime * this.iteration

        for (let i = kl - 1; i >= 0; i--) {
            const kf = kfs[i]
            const begin = this.totalTime / kl * i
            const end = i + 1 >= kl ? this.totalTime : this.totalTime / kl * (i + 1)

            if (begin <= animT) {
                const percent = Math.min((animT - begin) / (end - begin), 1.0)
                if (percent < 1.0) {
                    kf.cb(percent, animT / this.totalTime)
                } else {
                    kf.cb(1.0, animT / this.totalTime)
                    if (i + 1 >= kl) {
                        this.iteration++
                    }
                }
                break
            }
        }

        if (!this.stopped) {
            this.play()
        }
    }

    public dispose() {
        this.stop()
    }
}
