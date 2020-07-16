
import { Observable, Observer, of, Subscription } from "rxjs"
import { map } from "rxjs/operators"

import { Rect, parseAlign } from "../../util"
import { RectMutationService } from "../../layout.module"

import { MagicCarpet, Rects } from "./levitate-compute"
import { LevitatePosition } from "./levitate-position"
import { Levitating, Anchor, Constraint, ConcretePosition } from "./levitate-options"


export class LevitateRef {
    public readonly position: Readonly<LevitatePosition>
    public concrete: ConcretePosition = { x: false, y: false }

    protected mc: MagicCarpet = new MagicCarpet(this)
    protected suspended: number = 0

    protected rects: Subscription

    public constructor(
        protected readonly rectMutation: RectMutationService,
        public readonly levitate: Levitating,
        public readonly anchor?: Anchor,
        public readonly constraint: Constraint = { ref: "viewport" }) {
    }

    public updateAnchor(anchor: Anchor) {
        (this as { anchor: Anchor }).anchor = anchor
        this.reset()
    }

    public suspend(): void {
        this.suspended += 1

        if (this.rects) {
            this.rects.unsubscribe()
            delete this.rects
        }
    }

    public resume() {
        this.suspended = Math.max(0, this.suspended - 1)

        if (this.suspended === 0 && !this.rects) {
            this.rects = this.start().subscribe(this.update)
        }
    }

    public begin() {
        if (this.rects) {
            this.rects.unsubscribe()
            delete this.rects
        }
        this.suspended = 0
        this.resume()
    }

    public reset() {
        this.suspend()

        const style = this.levitate.ref.style
        style.maxWidth = "none"
        style.maxHeight = "none"

        this.resume()
    }

    protected update = (rects: Rects) => {
        let pos = this.mc.levitate(rects);
        // TODO: CHECK EQ
        (this as any).position = pos

        if (this.levitate.maxWidth) {
            (pos as { maxWidth: number }).maxWidth = Math.min(pos.maxWidth, this.levitate.maxWidth)
        }
        if (this.levitate.maxHeight) {
            (pos as { maxHeight: number }).maxHeight = Math.min(pos.maxHeight, this.levitate.maxHeight)
        }

        // console.log(JSON.parse(JSON.stringify(pos)))
        pos.applyToElement(this.levitate.ref, this.concrete)
    }

    public dispose(): void {
        this.suspend()
        if (this.mc) {
            this.mc.dispose()
            delete this.mc
        }
    }

    protected getRectObserver(opts: Anchor | Levitating | Constraint): Observable<Rect> {
        let observable: Observable<Rect>

        if (opts.ref === "viewport") {
            observable = this.rectMutation.watchViewport()
        } else if (opts.ref instanceof HTMLElement) {
            observable = this.rectMutation.watch(opts.ref)
        } else if (opts.ref instanceof Rect) {
            observable = of(opts.ref)
        }

        if ("margin" in opts) {
            let margin = opts.margin
            if (margin) {
                observable = observable.pipe(map(value => value.applyMargin(margin)))
            }
        }

        if ("inset" in opts) {
            let inset = opts.inset
            if (inset) {
                observable = observable.pipe(map(value => value.applyInset(inset)))
            }
        }

        return observable
    }

    protected start(): Observable<Rects> {
        return Observable.create((observer: Observer<Rects>) => {
            let rects: Rects = {} as any
            let levitateOrigin = parseAlign(this.levitate.align || "center")
            let anchorOrigin = this.anchor ? parseAlign(this.anchor.align || "center") : null

            function emit() {
                if (rects.levitate && rects.constraint && rects.anchor) {
                    observer.next(rects)
                }
            }

            let s1 = this.getRectObserver(this.levitate).subscribe((val) => {
                rects.levitate = val
                if (this.levitate.maxWidth) {
                    val.width = Math.min(val.width, this.levitate.maxWidth)
                }
                if (this.levitate.maxHeight) {
                    val.height = Math.min(val.height, this.levitate.maxHeight)
                }
                if (levitateOrigin) {
                    val.setOrigin(levitateOrigin)
                }
                emit()
            })

            let s2 = this.getRectObserver(this.constraint).subscribe((val) => {
                rects.constraint = val
                emit()
            })

            let s3 = this.getRectObserver(this.anchor || this.constraint).subscribe((val) => {
                rects.anchor = val
                if (anchorOrigin) {
                    val.setOrigin(anchorOrigin)
                }
                emit()
            })

            return () => {
                s1.unsubscribe()
                s2.unsubscribe()
                s3.unsubscribe()
            }
        })
    }
}
