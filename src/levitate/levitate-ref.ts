import { Levitating, Anchor, Constraint, LevitatingPosition, MagicCarpet } from "./levitate-compute"
import { Observable, Observer, of, merge, Subscription } from "rxjs"
import { map } from "rxjs/operators"

import { RectMutationService, Rect } from "../rect-mutation.service"
import { Subscriptions } from "../util"
import { Rects } from "./levitate-compute"


export class LevitateRef {

    public readonly position: Readonly<LevitatingPosition>
    protected mc: MagicCarpet = new MagicCarpet(this)
    protected suspended: number = 0

    protected rects: Subscription

    public constructor(
        protected readonly rectMutation: RectMutationService,
        public readonly levitate: Levitating,
        public readonly anchor?: Anchor,
        public readonly constraint: Constraint = { ref: "viewport" }) {

        // this.s.add(merge(
        //     this.getRectObserver(levitate),
        //     this.getRectObserver(connect),
        //     this.getRectObserver(constraint)
        // ))
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
        this.resume()
    }

    protected update = (rects: Rects) => {
        let pos = this.mc.levitate(rects);
        // TODO: CHECK EQ
        (this as any).position = pos

        let levitateEl = this.levitate.ref
        for (let k in pos) {
            if ((pos as any)[k] != null) {
                (levitateEl.style as any)[k] = `${(pos as any)[k]}px`
            }
        }
    }


    // public compute(): LevitatingPosition {
    //     this.mc.updateRects()
    //     return this.mc.levitate()
    // }

    // public apply(pos: Readonly<LevitatingPosition>) {
    //     (this as any).position = pos
    //     // TODO: renderer vagy valami
    //     let levitate = this.levitate.ref

    //     for (let k in pos) {
    //         if ((pos as any)[k] != null) {
    //             (levitate.style as any)[k] = `${(pos as any)[k]}px`
    //         }
    //     }

    //     // this.levitate.ref.style.right = `${pos.right}px`
    //     // this.levitate.ref.style.bottom = `${pos.bottom}px`
    // }

    // public update(): Readonly<LevitatingPosition> {
    //     if (this.suspended !== 0) {
    //         if (!this.position) {
    //             return this.compute()
    //         }
    //         return this.position
    //     }

    //     let pos = this.compute()
    //     if (!this.position
    //         || this.position.left !== pos.left
    //         || this.position.top !== pos.top
    //         || this.position.maxWidth !== pos.maxWidth
    //         || this.position.maxHeight !== pos.maxHeight) {
    //         this.apply(pos)
    //     }
    //     return this.position
    // }

    public dispose(): void {
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

        return observable
    }

    protected start(): Observable<Rects> {
        return Observable.create((observer: Observer<Rects>) => {
            let rects: Rects = {} as any

            function emit() {
                if (rects.levitate && rects.constraint && rects.anchor) {
                    observer.next(rects)
                }
            }

            let s1 = this.getRectObserver(this.levitate).subscribe((val) => {
                rects.levitate = val
                emit()
            })

            let s2 = this.getRectObserver(this.constraint).subscribe((val) => {
                rects.constraint = val
                emit()
            })

            let s3 = this.getRectObserver(this.anchor || this.constraint).subscribe((val) => {
                rects.anchor = val
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
