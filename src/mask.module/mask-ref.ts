import { Rect, RectMutationService } from "../rect-mutation.service"
import { Destruct, IDisposable } from "../util"
import { LayerContainerRef } from "../layer/layer-container"


export interface _BasicStyle {
    pointerEvents?: "auto" | "none" | "stroke" | "fill"
}

export interface _BackgroundColor extends _BasicStyle {
    backgroundColor?: string
}

export interface _BackgroundImage extends _BasicStyle {
    backgroundImage?: string
    backgroundOpacity?: number
}


export type MaskStyle = _BackgroundColor | _BackgroundImage


export class MaskRef implements IDisposable {
    public set crop(val: Rect) {
        if (!this._crop || !val || !this._crop.isEq(val)) {
            this._crop = val
            this._update()
        }
    }
    public get crop(): Rect { return this._crop }
    protected _crop: Rect

    public set rect(val: Rect) {
        if (!this._rect || !val || !this._rect.isEq(val)) {
            this._rect = val
            this._update()
        }
    }
    public get rect(): Rect { return this._rect }
    protected _rect: Rect

    public readonly destruct = new Destruct(() => {
        this.destroyCropMasks()
    })
    protected cropMaskEls: { [key: string]: HTMLElement }

    public constructor(
        rectMutation: RectMutationService,
        public readonly container: LayerContainerRef,
        target: HTMLElement | Window,
        public readonly style: Readonly<MaskStyle>,
        crop?: HTMLElement | Rect) {

        if (target === window) {
            this.destruct.subscription(rectMutation.watchViewport()).subscribe(rect => this.rect = rect)
        } else if (target instanceof HTMLElement) {
            this.destruct.subscription(rectMutation.watch(target)).subscribe(rect => this.rect = rect)
        } else {
            throw new Error(`Invalid target element: ${target}`)
        }

        if (crop instanceof HTMLElement) {
            this.destruct.subscription(rectMutation.watch(crop)).subscribe(rect => this.crop = rect)
        } else if (crop instanceof Rect) {
            this.crop = crop
        } else if (crop) {
            throw new Error(`Invalid crop: ${crop}`)
        }

        container.destruct.disposable(this)
        this.destruct.disposable(container)
    }

    protected _update() {
        if (!this._rect) {
            return
        }

        const container = this.container.nativeElement
        this.setStyle(container, {
            left: `${this._rect.left}px`,
            top: `${this._rect.top}px`,
            width: `${this._rect.width}px`,
            height: `${this._rect.height}px`,
            position: "absolute" // TODO: maybe fixed
        })

        if (this._crop) {
            this.clearStyle(container)

            container.style.pointerEvents = "none"

            if (!this.cropMaskEls) {
                this.cropMaskEls = {}
                container.appendChild(this.cropMaskEls.top = this.createCropMaskEl())
                container.appendChild(this.cropMaskEls.right = this.createCropMaskEl())
                container.appendChild(this.cropMaskEls.bottom = this.createCropMaskEl())
                container.appendChild(this.cropMaskEls.left = this.createCropMaskEl())

                this.applyStyle(this.cropMaskEls.top)
                this.applyStyle(this.cropMaskEls.right)
                this.applyStyle(this.cropMaskEls.bottom)
                this.applyStyle(this.cropMaskEls.left)
            }

            this.setStyle(this.cropMaskEls.top, {
                top: 0,
                right: 0,
                left: 0,
                height: `${this._crop.top}px`,
                pointerEvents: "auto"
            })

            this.setStyle(this.cropMaskEls.right, {
                top: `${this._crop.top}px`,
                right: 0,
                left: `${this._crop.right}px`,
                height: `${this._crop.height}px`,
                pointerEvents: "auto"
            })

            this.setStyle(this.cropMaskEls.bottom, {
                top: `${this._crop.bottom}px`,
                right: 0,
                left: 0,
                height: `${this._rect.bottom - this._crop.bottom}px`,
                pointerEvents: "auto"
            })

            this.setStyle(this.cropMaskEls.left, {
                top: `${this._crop.top}px`,
                width: `${this._crop.left - this._rect.left}px`,
                left: 0,
                height: `${this._crop.height}px`,
                pointerEvents: "auto"
            })
        } else {
            this.destroyCropMasks()
            this.applyStyle(container)
        }
    }

    public dispose() {
        this.destruct.run()
    }

    protected destroyCropMasks() {
        if (this.cropMaskEls) {
            for (const k in this.cropMaskEls) {
                const cme = this.cropMaskEls[k]
                if (cme.parentNode) {
                    cme.parentNode.removeChild(cme)
                }
            }
            delete this.cropMaskEls
        }
    }

    protected applyStyle(el: HTMLElement, rect?: Rect) {
        if (this.style.pointerEvents) {
            el.style.pointerEvents = this.style.pointerEvents
        }

        if ("backgroundColor" in this.style) {
            el.style.backgroundColor = this.style.backgroundColor
        }
    }

    protected clearStyle(el: HTMLElement) {
        if (this.style.pointerEvents) {
            el.style.pointerEvents = ""
        }

        if ("backgroundColor" in this.style) {
            el.style.backgroundColor = ""
        }
    }

    protected createCropMaskEl(): HTMLElement {
        const el = document.createElement("div")
        el.style.position = "absolute"
        return el
    }

    protected setStyle(el: HTMLElement, style: { [key: string]: any }) {
        for (const k in style) {
            (el.style as any)[k] = style[k]
        }
    }
}
