import { rawRequestAnimationFrame } from "./zone"


export type FastDomHandler = () => void


export class _FastDOM {
    private _rafId: any
    private _mutate: Array<FastDomHandler> = []
    private _measure: Array<FastDomHandler> = []

    public mutate(handler: FastDomHandler) {
        this._mutate.push(handler)
        this._schedule()
    }

    public mutateNext(handler: FastDomHandler) {
        this._mutate.push(() => {
            this._mutate.push(handler)
        })
        this._schedule()
    }

    public measure(handler: FastDomHandler) {
        this._measure.push(handler)
        this._schedule()
    }

    public setStyle(el: HTMLElement, style: { [key: string]: any }, chain?: FastDomHandler) {
        this.mutate(() => {
            for (const k in style) {
                if (style.hasOwnProperty(k)) {
                    el.style[k as any] = style[k]
                }
            }

            chain && chain()
        })
    }

    private _schedule() {
        if (!this._rafId) {
            this._rafId = rawRequestAnimationFrame(this._apply.bind(this))
        }
    }

    private _apply() {
        delete this._rafId

        const measure = this._measure.slice()
        const mutate = this._mutate.slice()
        this._measure.length = 0
        this._mutate.length = 0

        runQ(measure)
        runQ(mutate)

        if (this._measure.length || this._mutate.length) {
            this._schedule()
        }
    }
}

function runQ(items: FastDomHandler[]) {
    let item: FastDomHandler
    while (item = items.shift()) {
        item()
    }
}


export const FastDOM = new _FastDOM()
