import { Directive, Inject, ElementRef, Input, OnChanges, SimpleChanges } from "@angular/core"
import { Subject, Observable, Observer } from "rxjs"

import { __zone_symbol__, Destructible, ScaleMethods, ScaleResult, SCALE_METHODS } from "../../util"
import { ImageRef, CropRegion } from "./image-ref"


// const INTERSECTION_OBSERVER = __zone_symbol__("IntersectionObserver")
// const RESIZE_OBSERVER = __zone_symbol__("ResizeObserver")
// const _IntersectionObserver = window[INTERSECTION_OBSERVER]
// const _ResizeObserver = (window as any)[RESIZE_OBSERVER]


// const IObserver: {
//     instance: IntersectionObserver,
//     resize: any,
//     refcnt: number,
//     subject: Subject<{ el: HTMLElement, width: number, height: number }>
// } = {
//     instance: null,
//     resize: null,
//     refcnt: 0,
//     subject: new Subject<{ el: HTMLElement, width: number, height: number }>()
// }


// function observe(el: HTMLElement) {
//     if (!IObserver.instance) {
//         IObserver.instance = new _IntersectionObserver(entries => {
//             for (const entry of entries) {
//                 const rect = entry.boundingClientRect
//                 IObserver.subject.next({ el: entry.target as any, width: rect.width, height: rect.height })
//             }
//         }, { threshold: 0 })

//         IObserver.resize = new _ResizeObserver((entries: any[]) => {
//             for (const entry of entries) {
//                 IObserver.subject.next({ el: entry.target, width: entry.contentRect.width, height: entry.contentRect.height })
//             }
//         })

//         IObserver.refcnt = 0
//     }

//     IObserver.refcnt += 1

//     return Observable.create((observer: Observer<any>) => {
//         const s = IObserver.subject.subscribe(event => {
//             if (event.el === el) {
//                 observer.next(event)
//             }
//         })
//         IObserver.instance.observe(el)
//         IObserver.resize.observe(el)
//         return s.unsubscribe.bind(s)
//     }) as Observable<{ el: HTMLElement, width: number, height: number }>
// }

// function unobserve(el: HTMLElement) {
//     IObserver.refcnt -= 1
//     IObserver.instance.unobserve(el)
//     IObserver.resize.unobserve(el)

//     if (IObserver.refcnt <= 0) {
//         IObserver.instance.disconnect()
//         IObserver.resize.disconnect()
//         delete IObserver.instance
//         delete IObserver.resize
//     }
// }


@Directive({
    selector: "canvas.nz-image",
    host: {
        "[attr.width]": "_width",
        "[attr.height]": "_height",
        "[style.width.px]": "_width",
        "[style.height.px]": "_height",
    }
})
export class ImageComponent extends Destructible implements OnChanges {
    @Input() public src: string
    @Input() public scale: ScaleMethods = "fitcrop"
    @Input() public crop: CropRegion

    @Input()
    public set width(val: number) { this._width = Number(val) }
    public get width(): number { return this._width }
    public _width: number

    @Input()
    public set height(val: number) { this._height = Number(val) }
    public get height(): number { return this._height }
    public _height: number



    public readonly imageRef = new ImageRef()

    public constructor(
        @Inject(ElementRef) private readonly el: ElementRef<HTMLCanvasElement>) {
        super()

        const canvas = el.nativeElement
        const ctx = canvas.getContext("2d")

        this.destruct.subscription(this.imageRef.scaled$).subscribe(value => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            if (value) {
                const s = value.info
                ctx.drawImage(
                    value.el,
                    s.srcX, s.srcY, s.srcWidth, s.srcHeight,
                    s.dstX, s.dstY, s.dstWidth, s.dstHeight)
            } else {

                // drawNoImage(ctx, 0, 0, canvas.width, canvas.height)
            }
        })
    }

    public ngOnChanges(changes: SimpleChanges) {
        if ("src" in changes) {
            this.imageRef.load(changes.src.currentValue)
        }

        if ("scale" in changes || "width" in changes || "height" in changes) {
            this.imageRef.scale(this.scale, this._width, this._height)
        }

        if ("crop" in changes) {
            this.imageRef.crop(changes.crop.currentValue)
        }
    }

    public ngOnDestroy() {
        super.ngOnDestroy()
        // unobserve(this.el.nativeElement)
    }
}


function drawNoImage(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    let margin = 40

    ctx.strokeStyle = "#b0bec5"
    ctx.lineWidth = 3
    ctx.lineCap = "round"
    ctx.beginPath()

    ctx.moveTo(x + margin, y + margin)
    ctx.lineTo(w - x - margin, h - y - margin)
    ctx.stroke()

    ctx.moveTo(w - x - margin, y + margin)
    ctx.lineTo(x + margin, h - y - margin)
    ctx.stroke()
}
