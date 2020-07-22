import { __zone_symbol__ } from "../util"


const RAF: "requestAnimationFrame" = __zone_symbol__("requestAnimationFrame")


export type Transition = (t: number, from: number, to: number) => { progress: number, value: number }


export abstract class Animation<T> {
    public readonly isRunning: boolean = false

    protected beginTime: number
    protected rafId: any
    protected lastFrameTime: number
    protected doneListeners: Array<() => void> = []

    private _tick: (timestamp: number) => void
    private _pending: Partial<T>

    public constructor() {
        this._tick = (timestamp: number) => {
            if (this._update() || !this.beginTime) {
                this.beginTime = this.lastFrameTime || timestamp
            }

            if (this.tick(timestamp)) {
                this.lastFrameTime = timestamp
                this.rafId = window[RAF](this._tick)
            } else {
                this.stop()
            }
        }
    }

    public didDone(cb: () => void) {
        this.doneListeners.push(cb)
    }

    public update(props: Partial<T>) {
        this._pending = props
        this.play()
    }

    private _update(): boolean {
        if (this._pending) {
            const pending = this._pending
            delete this._pending
            let changed = false
            for (const k in pending) {
                if (pending.hasOwnProperty(k)) {
                    const value = (pending as any)[k]
                    const selfValue = (this as any)[k]
                    if (value !== selfValue) {
                        (this as any)[k] = value
                        changed = true
                    }
                }
            }
            return changed
        }
        return false
    }

    protected abstract tick(timestamp: number): boolean

    public restart() {
        delete this.beginTime
        delete this.lastFrameTime
        this.play()
    }

    public play() {
        (this as { isRunning: boolean }).isRunning = true
        if (!this.rafId) {
            this.rafId = window[RAF](this._tick)
        }
    }

    public stop() {
        (this as { isRunning: boolean }).isRunning = true
        if (this.rafId) {
            cancelAnimationFrame(this.rafId)
            delete this.rafId
            delete this.beginTime
            delete this.lastFrameTime

            for (const cb of this.doneListeners) {
                cb()
            }

            this.doneListeners.length = 0
        }
    }

    public dispose() {
        this.stop()
        delete this._tick
        this.doneListeners.length = 0
    }

    protected transition(ease: (t: number) => number, speed?: (diff: number) => number): Transition {
        return (t: number, from: number, to: number) => {
            const diff = to - from
            if (diff !== 0) {
                const s = speed ? speed(diff) : 1
                const progress = Math.min(1.0, (t - this.beginTime) / s)
                const value = from + diff * ease(progress)
                return { progress, value }
            } else {
                return { progress: 1.0, value: to }
            }
        }
    }
}


export function easeLineral(t: number) {
    return t
}


export function easeOutQuart(t: number) {
    return 1 - (--t) * t * t * t
}

export function easeOutCubic(t: number) {
    return (--t) * t * t + 1
}
