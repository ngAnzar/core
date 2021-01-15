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

    private _schedule() {
        if (!this._rafId) {
            this._rafId = rawRequestAnimationFrame(this._apply.bind(this))
        }
    }

    private _apply() {
        delete this._rafId

        runQ(this._measure)
        runQ(this._mutate)

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
