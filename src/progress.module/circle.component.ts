import {
    Component, Input, HostBinding, HostListener, ChangeDetectionStrategy, ChangeDetectorRef,
    OnChanges, ViewChild, AfterViewInit, OnDestroy, ElementRef, NgZone, Inject
} from "@angular/core"
import { trigger, state, animate, keyframes, style, transition, query } from "@angular/animations"
import { coerceBooleanProperty } from "@angular/cdk/coercion"
import { Observable } from "rxjs"

import { AbstractProgressComponent, ProgressEvent } from "./progress-base"


function strokeWidthCalc(r: number) {
    let x = Math.round(r / 7) * 2
    return x + (x % 2)
}


@Component({
    selector: "nz-progress[type='circle']",
    templateUrl: "./circle.template.pug",
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        trigger("animation", [
            transition("* => indeterminate0", [
                query("circle", [
                    animate("1s linear", keyframes([
                        style({ "stroke-dashoffset": "{{ dashStart }}", "transform": "rotate(0deg)" }),
                        style({ "stroke-dashoffset": "{{ dashMiddle }}", "transform": "rotate(0deg)" }),

                        style({ "transform": "rotate(180deg)" }),

                        style({ "stroke-dashoffset": "{{ dashStart }}", "transform": "rotate(360deg)" }),
                    ]))
                ])
            ]),
            transition("indeterminate1 => indeterminate0", [])
        ])
    ]
})
export class CircleProgressComponent_ extends AbstractProgressComponent {
    @Input()
    public set radius(val: number) {
        this._radius = Number(val)
        if (!this.strokeWidth) {
            this.strokeWidth = strokeWidthCalc(this._radius)
        }
        this._radiusMinusStroke = this._radius - this.strokeWidth / 2
        this.dashArray = Math.PI * this._radiusMinusStroke * 2
    }
    public get radius(): number { return this._radius }
    protected _radius: number
    protected _radiusMinusStroke: number

    @HostBinding("style.width") public get width(): string { return `${this.radius * 2}px` }
    @HostBinding("style.height") public get height(): string { return `${this.radius * 2}px` }

    // @Input() public strokeWidth: number = Math.round(this.radius / 6) + (Math.round(this.radius / 6) % 2)
    @Input() public strokeWidth: number
    // @Input() public strokeColor: string = "#CC3300"
    @HostBinding("attr.color")
    @Input()
    public color: string

    protected dashArray: number

    @HostBinding("@animation")
    public get animation(): any {
        if (this.indeterminate) {
            return {
                value: `indeterminate${this._animationCounter % 2}`,
                params: {
                    dashStart: this.dashArray,
                    dashMiddle: this.dashArray * 0.5,
                    dashEnd: 0,
                }
            }
        } else {
            return {
                value: "progress",
                params: {
                    dash: (this.dashArray * (1 - this.percent)) || 0
                }
            }
        }

    }

    @HostListener("@animation.done")
    protected onAnimationDone() {
        this._animationCounter += 1
    }
    private _animationCounter = 0

    // @Input() public progress: Observable<ProgressEvent>

}










@Component({
    selector: "nz-progress[type='circle']",
    templateUrl: "./circle.template.pug",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CircleProgressComponent extends AbstractProgressComponent implements OnDestroy, AfterViewInit {
    @Input()
    public set radius(val: number) {
        this._radius = Number(val)
        if (!this.strokeWidth) {
            this.strokeWidth = strokeWidthCalc(this._radius)
        }
        this._radiusMinusStroke = this._radius - this.strokeWidth / 2
        this.dashArray = Math.PI * this._radiusMinusStroke * 2
    }
    public get radius(): number { return this._radius }
    protected _radius: number
    protected _radiusMinusStroke: number

    @HostBinding("style.width") public get width(): string { return `${this.radius * 2}px` }
    @HostBinding("style.height") public get height(): string { return `${this.radius * 2}px` }

    @Input() public strokeWidth: number

    @HostBinding("attr.color")
    @Input()
    public color: string

    protected dashArray: number

    @ViewChild("circle") protected readonly circle: ElementRef<SVGCircleElement>

    protected animation: Timeline

    public constructor(
        @Inject(ChangeDetectorRef) cdr: ChangeDetectorRef,
        @Inject(NgZone) zone: NgZone) {
        super(cdr)

        this.animation = new Timeline(zone, 700)
    }

    public ngAfterViewInit() {
        this._initAnimation()
        this.animation.play()
    }

    public ngOnDestroy() {
        this.animation.stop()
    }

    protected _initAnimation() {
        const circle = this.circle.nativeElement
        let dashOffset = this.dashArray
        let rotation = 0
        let quarter = this.dashArray / 4

        // V1
        /*
        this.animation.keyframe((progress, total) => {
            dashOffset = this.dashArray - quarter * progress
            circle.style.strokeDashoffset = `${dashOffset}`
        }, () => this.indeterminate)

        this.animation.keyframe((progress, total) => {
            rotation = 90 * progress
            circle.style.transform = `rotate(${rotation}deg)`
        }, () => this.indeterminate)

        this.animation.keyframe((progress, total) => {
            dashOffset = this.dashArray - quarter - quarter * progress
            circle.style.strokeDashoffset = `${dashOffset}`
        }, () => this.indeterminate)

        this.animation.keyframe((progress, total) => {
            dashOffset = this.dashArray - quarter - quarter + quarter * progress
            rotation = 90 + 90 * progress

            circle.style.strokeDashoffset = `${dashOffset}`
            circle.style.transform = `rotate(${rotation}deg)`
        }, () => this.indeterminate)

        this.animation.keyframe((progress, total) => {
            dashOffset = this.dashArray - quarter - quarter * progress
            circle.style.strokeDashoffset = `${dashOffset}`
        }, () => this.indeterminate)

        this.animation.keyframe((progress, total) => {
            dashOffset = this.dashArray - quarter - quarter + quarter * progress
            rotation = 180 + 90 * progress

            circle.style.strokeDashoffset = `${dashOffset}`
            circle.style.transform = `rotate(${rotation}deg)`
        }, () => this.indeterminate)

        this.animation.keyframe((progress, total) => {
            dashOffset = this.dashArray - quarter + quarter * progress
            rotation = 270 + 90 * progress

            circle.style.strokeDashoffset = `${dashOffset}`
            circle.style.transform = `rotate(${rotation}deg)`
        }, () => this.indeterminate)
        */


        // V2
        /*
        this.animation.keyframe((progress) => {
            dashOffset = this.dashArray - (quarter * 3) * progress
            rotation = 225 * progress

            circle.style.strokeDashoffset = `${dashOffset}`
            circle.style.transform = `rotate(${rotation}deg)`
        }, () => this.indeterminate)

        this.animation.keyframe((progress) => {
            dashOffset = this.dashArray - (quarter * 3) + (quarter * 3) * progress
            rotation = 225 + 135 * progress

            circle.style.strokeDashoffset = `${dashOffset}`
            circle.style.transform = `rotate(${rotation}deg)`

        }, () => this.indeterminate)
        */

        this.animation.keyframe(progress => {
            dashOffset = this.dashArray - (quarter * 2) * progress
            rotation = 100 * progress

            circle.style.strokeDashoffset = `${dashOffset}`
            circle.style.transform = `rotate(${rotation}deg)`
        }, () => this.indeterminate)

        this.animation.keyframe(progress => {
            dashOffset = this.dashArray - (quarter * 2) + (quarter * 2) * progress
            rotation = 100 + 260 * progress

            circle.style.strokeDashoffset = `${dashOffset}`
            circle.style.transform = `rotate(${rotation}deg)`
        }, () => this.indeterminate)

        this.animation.keyframe((progress, total) => {
            let o = Math.max(dashOffset - dashOffset * progress, this.dashArray * (1 - this.percent))
            let r = rotation - rotation * progress

            circle.style.strokeDashoffset = `${o}`
            circle.style.transform = `rotate(${r}deg)`

            if (Math.floor(o) <= 3) {
                this.animation.stop()
            }
        }, () => !this.indeterminate)
    }

    protected onIndeterminateChange() {
        this.animation.stop()
        this.animation.play()
    }
}


type KeyframeCb = (kfPercent: number, totalPercent: number) => void


class Timeline {
    protected rafId: number
    protected startTime: number
    protected stopped: boolean = false
    protected keyframes: Array<{ cb: KeyframeCb, enabled: () => boolean }> = []

    public set totalTime(val: number) {
        if (this._totalTime !== val) {
            this._totalTime = val
            this.startTime = new Date().getTime()
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
        const iteration = Math.floor(elapsed / this.totalTime)
        const animT = elapsed - this.totalTime * iteration

        for (let i = 0; i < kl; i++) {
            const kf = kfs[i]
            const begin = this.totalTime / kl * i
            const end = i + 1 >= kl ? this.totalTime : this.totalTime / kl * (i + 1)

            if (begin <= animT && end > animT) {
                const percent = (animT - begin) / (end - begin)
                kf.cb(percent, animT / this.totalTime)
                break
            }
        }

        if (!this.stopped) {
            this.play()
        }
    }
}
