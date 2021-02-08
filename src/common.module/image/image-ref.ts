import { BehaviorSubject, Observable, Observer, of, merge, zip } from "rxjs"
import { switchMap, shareReplay, debounceTime, take, map, distinctUntilChanged } from "rxjs/operators"

import { SCALE_METHODS, ScaleMethods, ScaleMethod } from "../../util"

export interface CropRegion {
    x: number
    y: number
    width: number
    height: number
}


export interface ScaleInfo {
    srcX: number
    srcY: number
    srcWidth: number
    srcHeight: number

    dstX: number
    dstY: number
    dstWidth: number
    dstHeight: number
}


const NO_SCALE = [null, 0, 0, 0, 0] as [ScaleMethod | null, number, number, number, number]

export type ImageRefSource = string | File | ImageRef | HTMLImageElement | null


export class ImageRef {
    public readonly scale$ = new BehaviorSubject(NO_SCALE)
    public readonly crop$ = new BehaviorSubject<CropRegion>(null)

    private readonly src$ = new BehaviorSubject<ImageRefSource>(null)

    public readonly image$: Observable<HTMLImageElement> = this.src$.pipe(
        distinctUntilChanged((a, b) => a === b),
        switchMap(src => {
            if (src instanceof File) {
                return ImageRef.loadFromFile(src)
            } else if (typeof src === "string") {
                return ImageRef.loadFromUrl(src)
            } else if (src instanceof ImageRef) {
                return ImageRef.loadFromRef(src)
            } else if (src instanceof HTMLImageElement) {
                return ImageRef.loadFromImageEl(src)
            } else if (src == null) {
                return of(null)
            } else {
                throw new Error("Invalid source")
            }
        }),
        shareReplay(1)
    )

    public readonly scaled$: Observable<{ el: HTMLImageElement, info: ScaleInfo }> = merge(this.image$, this.scale$, this.crop$).pipe(
        debounceTime(10),
        switchMap(v => zip(this.image$, this.scale$, this.crop$).pipe(take(1))),
        map(([image, scale, crop]) => {
            if (image) {
                let srcX = 0
                let srcY = 0
                let srcWidth = image.naturalWidth
                let srcHeight = image.naturalHeight
                let dstX = 0
                let dstY = 0
                let dstWidth = image.naturalWidth
                let dstHeight = image.naturalHeight

                if (crop) {
                    srcX = crop.x
                    srcY = crop.y
                    srcWidth = dstWidth = crop.width
                    srcHeight = dstHeight = crop.height
                }

                if (scale && scale[0] && scale[1] && scale[2]) {
                    const scaled = scale[0](dstWidth, dstHeight, scale[1], scale[2], scale[3], scale[4])
                    dstX = scaled.x
                    dstY = scaled.y
                    dstWidth = scaled.width
                    dstHeight = scaled.height
                }

                return {
                    el: image, info: { srcX, srcY, srcWidth, srcHeight, dstX, dstY, dstWidth, dstHeight }
                }
            } else {
                return null
            }
        }),
        shareReplay(1)
    )

    public load(src: ImageRefSource) {
        this.src$.next(src)
    }

    public scale(method: ScaleMethods, dstW: number, dstH: number, minScale?: number, maxScale?: number) {
        const currentValue = this.scale$.value as typeof NO_SCALE
        const newValue = [SCALE_METHODS[method], dstW, dstH, minScale, maxScale] as typeof NO_SCALE

        if (currentValue
            && newValue
            && currentValue[0] === newValue[0]
            && currentValue[1] === newValue[1]
            && currentValue[2] === newValue[2]
            && currentValue[3] === newValue[3]
            && currentValue[4] === newValue[4]) {
            return
        }

        this.scale$.next(newValue)
    }

    public crop(crop: CropRegion) {
        const currentValue = this.crop$.value
        if (currentValue && crop
            && currentValue.x === crop.x
            && currentValue.y === crop.y
            && currentValue.width === crop.width
            && currentValue.height === crop.height) {
            return
        }
        this.crop$.next(crop)
    }

    public static loadFromUrl(url: string): Observable<HTMLImageElement> {
        return Observable.create((observer: Observer<HTMLImageElement>) => {
            const img = document.createElement("img")
            const handleOk = () => {
                observer.next(img)
                observer.complete()
            }

            const handleError = () => {
                observer.next(null)
                observer.complete()
            }
            img.onload = handleOk
            img.onabort = handleError
            img.onerror = handleError

            img.src = url
            return () => {
                if (!img.complete || img.naturalWidth === 0) {
                    img.src = null
                }
                img.onload = img.onabort = img.onerror = null
            }
        })
    }

    public static loadFromFile(file: File): Observable<HTMLImageElement> {
        return Observable.create((observer: Observer<HTMLImageElement>) => {
            const img = document.createElement("img")
            const handleOk = () => {
                observer.next(img)
                observer.complete()
            }

            const handleError = (err: any) => {
                observer.next(null)
                observer.complete()
            }

            img.onload = handleOk
            img.onabort = handleError
            img.onerror = handleError

            const reader = new FileReader()
            reader.onload = () => {
                img.src = reader.result as any
            }
            reader.onabort = handleError
            reader.onerror = handleError
            reader.readAsDataURL(file)

            return () => {
                if (reader.readyState !== FileReader.DONE) {
                    reader.abort()
                }
                img.onload = img.onabort = img.onerror = reader.onload = reader.onabort = reader.onerror = null
            }
        })
    }

    public static loadFromRef(ref: ImageRef): Observable<HTMLImageElement> {
        return ref.image$
    }

    public static loadFromImageEl(el: HTMLImageElement): Observable<HTMLImageElement> {
        return Observable.create((observer: Observer<HTMLImageElement>) => {
            const handleOk = () => {
                observer.next(el)
            }

            const handleError = () => {
                observer.next(null)
            }

            el.onload = handleOk
            el.onabort = handleError
            el.onerror = handleError

            if (el.complete && el.naturalWidth !== 0) {
                observer.next(el)
            }
        })
    }
}
