import { AnimationMetadata, AnimationBuilder } from "@angular/animations"
import { RectMutationService } from "../../layout.module"
import { Rect, Destruct, IDisposable } from "../../util"
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


export abstract class MaskRef extends LayerContainerRef {
    public get firstElement(): HTMLElement { return this._elements[0] }

    public set rect(val: Rect) {
        if (!this._rect || !val || !this._rect.isEq(val)) {
            this._rect = val
            this._rect && this._update()
        }
    }
    public get rect(): Rect { return this._rect }
    protected _rect: Rect

    public isVisible: boolean = false

    protected _elements: HTMLElement[]

    public constructor(
        protected readonly rectMutation: RectMutationService,
        protected readonly animationBuilder: AnimationBuilder,
        target: HTMLElement | Window,
        public readonly style: Readonly<MaskStyle>) {
        super()

        this._init()
        for (const el of this._elements) {
            this.applyStyle(el)
            this.destruct.element(el)
        }
        this.setStyle({
            display: "none",
            position: "absolute"
        })

        if (target === window) {
            this.destruct.subscription(rectMutation.watchViewport()).subscribe(rect => this.rect = rect)
        } else if (target instanceof HTMLElement) {
            this.destruct.subscription(rectMutation.watch(target)).subscribe(rect => this.rect = rect)
        } else {
            throw new Error(`Invalid target element: ${target}`)
        }
    }

    public show(animation?: AnimationMetadata[]): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.isVisible) {
                resolve()
            }
            this.isVisible = true
            this.beforeShow()
            if (animation) {
                this.animate(animation).then(() => {
                    this.afterShow()
                    resolve()
                }, reject)
            } else {
                this.afterShow()
            }
        })
    }

    protected beforeShow() {
        this.setStyle({
            pointerEvents: "auto",
            touchAction: "auto",
            opacity: "0",
            display: "block"
        })
    }

    protected afterShow() {
        this.setStyle({
            opacity: "1"
        })
    }

    public hide(animation?: AnimationMetadata[]): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.isVisible) {
                resolve()
            }
            this.isVisible = false
            this.beforeHide()
            if (animation) {
                this.animate(animation).then(() => {
                    this.afterHide()
                    resolve()
                }, reject)
            }
        })
    }

    protected beforeHide() {
        this.setStyle({
            pointerEvents: "none",
            touchAction: "none",
        })
    }

    protected afterHide() {
        this.setStyle({
            display: "none"
        })
    }

    public append(container: HTMLElement): void {
        for (const el of this._elements) {
            container.appendChild(el)
        }
    }

    public insertBefore(target: HTMLElement): void {
        for (const el of this._elements) {
            target.parentNode.insertBefore(el, target)
        }
    }

    protected applyZIndex(index: number): void {
        this.setStyle({
            zIndex: `${index}`
        })
    }

    protected addEventListener(eventName: string, handler: (event: Event) => void): () => void {
        const els = this._elements.slice()
        for (const el of els) {
            el.addEventListener(eventName, handler)
        }
        return () => {
            for (const el of els) {
                el.removeEventListener(eventName, handler)
            }
        }
    }

    protected applyStyle(el: HTMLElement) {
        if (this.style.pointerEvents) {
            el.style.pointerEvents = this.style.pointerEvents
        }

        if ("backgroundColor" in this.style) {
            el.style.backgroundColor = this.style.backgroundColor
        }
    }

    protected setStyle(style: { [key: string]: any }) {
        for (const el of this._elements) {
            setStyle(el, style)
        }
    }

    protected animate(animation: AnimationMetadata[]): Promise<void> {
        const promises = this._elements.map(el => {
            return this.animateEl(el, animation)
        })
        return Promise.all(promises) as any
    }

    protected animateEl(el: HTMLElement, animation: AnimationMetadata[]): Promise<void> {
        return new Promise((resolve, reject) => {
            const player = this.animationBuilder.build(animation).create(el)
            player.onDone(() => {
                player.destroy()
                resolve()
            })
            player.play()
        })
    }

    protected abstract _init(): void

    protected abstract _update(): void
}


export class SimpleMaskRef extends MaskRef {


    protected _init(): void {
        this._elements = [document.createElement("div")]
    }

    protected _update(): void {
        setStyle(this.firstElement, {
            left: `${this._rect.left}px`,
            top: `${this._rect.top}px`,
            width: `${this._rect.width}px`,
            height: `${this._rect.height}px`,
        })
    }
}


export class CropMaskRef extends MaskRef {
    public set crop(val: Rect) {
        if (!this._crop || !val || !this._crop.isEq(val)) {
            this._crop = val
            this._rect && this._update()
        }
    }
    public get crop(): Rect { return this._crop }
    protected _crop: Rect

    public constructor(
        rectMutation: RectMutationService,
        animationBuilder: AnimationBuilder,
        target: HTMLElement | Window,
        style: Readonly<MaskStyle>,
        crop?: HTMLElement | Rect) {
        super(rectMutation, animationBuilder, target, style)

        if (crop instanceof HTMLElement) {
            this.destruct.subscription(rectMutation.watch(crop)).subscribe(rect => this.crop = rect)
        } else if (crop instanceof Rect) {
            this.crop = crop
        } else if (crop) {
            throw new Error(`Invalid crop: ${crop}`)
        }
    }

    protected _init() {
        this._elements = [
            document.createElement("div"),
            document.createElement("div"),
            document.createElement("div"),
            document.createElement("div"),
        ]
    }

    protected _update(): void {
        if (!this._crop) {
            return
        }

        // top
        setStyle(this._elements[0], {
            top: `${this._rect.top}px`,
            left: `${this._rect.left}px`,
            width: `${this._rect.width}px`,
            height: `${this._crop.top - this._rect.top}px`,
        })

        // right
        setStyle(this._elements[1], {
            top: `${this._crop.top}px`,
            left: `${this._crop.right}px`,
            width: `${this._rect.right - this._crop.right}px`,
            height: `${this._crop.height}px`,
        })

        // bottom
        setStyle(this._elements[2], {
            top: `${this._crop.bottom}px`,
            left: `${this._rect.left}px`,
            width: `${this._rect.width}px`,
            height: `${this._rect.bottom - this._crop.bottom}px`,
        })

        // left
        setStyle(this._elements[3], {
            top: `${this._crop.top}px`,
            left: `${this._rect.left}px`,
            width: `${this._crop.left - this._rect.left}px`,
            height: `${this._crop.height}px`,
        })
    }
}


// export class _MaskRef implements IDisposable {
//     public set crop(val: Rect) {
//         if (!this._crop || !val || !this._crop.isEq(val)) {
//             this._crop = val
//             this._update()
//         }
//     }
//     public get crop(): Rect { return this._crop }
//     protected _crop: Rect

//     public set rect(val: Rect) {
//         if (!this._rect || !val || !this._rect.isEq(val)) {
//             this._rect = val
//             this._update()
//         }
//     }
//     public get rect(): Rect { return this._rect }
//     protected _rect: Rect

//     public readonly destruct = new Destruct(() => {
//         this.destroyCropMasks()
//     })
//     protected cropMaskEls: { [key: string]: HTMLElement }

//     public constructor(
//         rectMutation: RectMutationService,
//         public readonly container: LayerContainerRef,
//         target: HTMLElement | Window,
//         public readonly style: Readonly<MaskStyle>,
//         crop?: HTMLElement | Rect) {

//         if (target === window) {
//             this.destruct.subscription(rectMutation.watchViewport()).subscribe(rect => this.rect = rect)
//         } else if (target instanceof HTMLElement) {
//             this.destruct.subscription(rectMutation.watch(target)).subscribe(rect => this.rect = rect)
//         } else {
//             throw new Error(`Invalid target element: ${target}`)
//         }

//         if (crop instanceof HTMLElement) {
//             this.destruct.subscription(rectMutation.watch(crop)).subscribe(rect => this.crop = rect)
//         } else if (crop instanceof Rect) {
//             this.crop = crop
//         } else if (crop) {
//             throw new Error(`Invalid crop: ${crop}`)
//         }

//         container.destruct.disposable(this)
//         this.destruct.disposable(container)
//     }

//     protected _update() {
//         if (!this._rect) {
//             return
//         }

//         const container = this.container.nativeElement
//         this.setStyle(container, {
//             left: `${this._rect.left}px`,
//             top: `${this._rect.top}px`,
//             width: `${this._rect.width}px`,
//             height: `${this._rect.height}px`,
//             position: "absolute" // TODO: maybe fixed
//         })

//         if (this._crop) {
//             this.clearStyle(container)

//             container.style.pointerEvents = "none"
//             container.style.touchAction = "none"
//             // container.style.background = "rgba(0, 0, 0, 0)"

//             if (!this.cropMaskEls) {
//                 this.cropMaskEls = {}
//                 container.appendChild(this.cropMaskEls.top = this.createCropMaskEl())
//                 container.appendChild(this.cropMaskEls.right = this.createCropMaskEl())
//                 container.appendChild(this.cropMaskEls.bottom = this.createCropMaskEl())
//                 container.appendChild(this.cropMaskEls.left = this.createCropMaskEl())

//                 this.applyStyle(this.cropMaskEls.top)
//                 this.applyStyle(this.cropMaskEls.right)
//                 this.applyStyle(this.cropMaskEls.bottom)
//                 this.applyStyle(this.cropMaskEls.left)
//             }

//             this.setStyle(this.cropMaskEls.top, {
//                 top: 0,
//                 right: 0,
//                 left: 0,
//                 height: `${this._crop.top}px`,
//                 pointerEvents: "auto"
//             })

//             this.setStyle(this.cropMaskEls.right, {
//                 top: `${this._crop.top}px`,
//                 right: 0,
//                 left: `${this._crop.right}px`,
//                 height: `${this._crop.height}px`,
//                 pointerEvents: "auto"
//             })

//             this.setStyle(this.cropMaskEls.bottom, {
//                 top: `${this._crop.bottom}px`,
//                 right: 0,
//                 left: 0,
//                 height: `${this._rect.bottom - this._crop.bottom}px`,
//                 pointerEvents: "auto"
//             })

//             this.setStyle(this.cropMaskEls.left, {
//                 top: `${this._crop.top}px`,
//                 width: `${this._crop.left - this._rect.left}px`,
//                 left: 0,
//                 height: `${this._crop.height}px`,
//                 pointerEvents: "auto"
//             })
//         } else {
//             this.destroyCropMasks()
//             this.applyStyle(container)
//         }
//     }

//     public dispose() {
//         this.destruct.run()
//     }

//     protected destroyCropMasks() {
//         if (this.cropMaskEls) {
//             for (const k in this.cropMaskEls) {
//                 const cme = this.cropMaskEls[k]
//                 if (cme.parentNode) {
//                     cme.parentNode.removeChild(cme)
//                 }
//             }
//             delete this.cropMaskEls
//         }
//     }

//     protected applyStyle(el: HTMLElement, rect?: Rect) {
//         if (this.style.pointerEvents) {
//             el.style.pointerEvents = this.style.pointerEvents
//         }

//         if ("backgroundColor" in this.style) {
//             el.style.backgroundColor = this.style.backgroundColor
//         }
//     }

//     protected clearStyle(el: HTMLElement) {
//         if (this.style.pointerEvents) {
//             el.style.pointerEvents = ""
//         }

//         if ("backgroundColor" in this.style) {
//             el.style.backgroundColor = ""
//         }
//     }

//     protected createCropMaskEl(): HTMLElement {
//         const el = document.createElement("div")
//         el.style.position = "absolute"
//         return el
//     }


// }


function setStyle(el: HTMLElement, style: { [key: string]: any }) {
    for (const k in style) {
        (el.style as any)[k] = style[k]
    }
}
