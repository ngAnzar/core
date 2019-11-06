import {
    Component, Input, HostBinding, ChangeDetectionStrategy, ChangeDetectorRef,
    ViewChild, AfterViewInit, ElementRef, NgZone, Inject
} from "@angular/core"

import { ProgressComponent } from "./abstract"
import { Animation, easeLineral } from "../animation"


@Component({
    selector: "nz-progress[type='circle']",
    templateUrl: "./circle.template.pug",
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        { provide: ProgressComponent, useExisting: ProgressCircleComponent }
    ]
})
export class ProgressCircleComponent extends ProgressComponent implements AfterViewInit {
    @Input()
    public set radius(val: number) {
        this._radius = Number(val)
        if (!this.strokeWidth) {
            this.strokeWidth = strokeWidthCalc(this._radius)
        }
        this._radiusMinusStroke = this._radius - this.strokeWidth / 2
        this.dashArray = Math.PI * this._radiusMinusStroke * 2
        this._currentOffset = this.dashArray
    }
    public get radius(): number { return this._radius }
    protected _radius: number
    protected _radiusMinusStroke: number

    @HostBinding("style.width") public get width(): string { return `${this.radius * 2}px` }
    @HostBinding("style.height") public get height(): string { return `${this.radius * 2}px` }

    @Input() public strokeWidth: number

    protected dashArray: number

    @ViewChild("circle", { static: true }) protected readonly circle: ElementRef<SVGCircleElement>

    private _currentOffset: number = 0
    private _currentRotation: number = 0
    protected animation = this.destruct.disposable(new CircleAnimation((offset, rotation) => {
        this._currentOffset = offset
        this._currentRotation = rotation
        const circle = this.circle.nativeElement
        circle.style.strokeDashoffset = `${offset}`
        circle.style.transform = `rotate(${rotation}deg)`
    }))

    public constructor(
        @Inject(ChangeDetectorRef) cdr: ChangeDetectorRef,
        @Inject(NgZone) zone: NgZone) {
        super(cdr)
    }

    public ngAfterViewInit() {
        this._updateAnimation()
    }

    protected onIndeterminateChange() {
        this._updateAnimation()
    }

    protected onPercentChange() {
        this._updateAnimation()
    }

    private _updateAnimation() {
        const indeterminate = this.indeterminate
        if (indeterminate) {
            this.animation.update({
                indeterminate,
                totalOffset: this.dashArray
            })
        } else {
            this.animation.update({
                indeterminate,
                fromOffset: this._currentOffset,
                toOffset: this.dashArray - this.dashArray * this.percent,
                fromRotation: this._currentRotation,
                toRotation: 0
            })
        }
    }
}


function strokeWidthCalc(r: number) {
    let x = Math.round(r / 7) * 2
    return x + (x % 2)
}


interface AnimProps {
    fromRotation: number
    toRotation: number
    fromOffset: number
    toOffset: number
    totalOffset: number
    indeterminate: boolean
}


class CircleAnimation extends Animation<AnimProps> implements AnimProps {
    public readonly fromRotation: number
    public readonly toRotation: number
    public readonly fromOffset: number
    public readonly toOffset: number
    public readonly totalOffset: number
    public readonly indeterminate: boolean

    private _trans = this.transition(easeLineral, diff => 300)
    private _iDuration: number = 700

    public constructor(private readonly onTick: (strokeDashoffset: number, rotation: number) => void) {
        super()
    }

    protected tick(timestamp: number): boolean {
        if (this.indeterminate) {
            const time = timestamp - this.beginTime
            const quarter = this.totalOffset / 4
            let progress = time / this._iDuration
            let offset: number
            let rotation: number

            if (progress <= 0.5) {
                progress /= 0.5
                offset = this.totalOffset - (quarter * 2) * progress
                rotation = 100 * progress
            } else {
                if (progress >= 1.0) {
                    this.restart()
                }
                progress = (progress - 0.5) / 0.5
                offset = this.totalOffset - (quarter * 2) + (quarter * 2) * progress
                rotation = 100 + 260 * progress
            }

            this.onTick(offset, rotation)
            return true
        } else {
            const rotation = this._trans(timestamp, this.fromRotation, this.toRotation)
            const offset = this._trans(timestamp, this.fromOffset, this.toOffset)

            this.onTick(offset.value, rotation.value)
            return !(offset.progress === 1.0 && rotation.progress === 1.0)
        }
    }
}


/**
 * ANIMATION TEST STREAM
    const x = merge(
        of<FileDownloadEvent>({ state: "starting", filename: "Almafa" }),
        of(null).pipe(delay(5000), switchMap(_ => {
            return interval(200).pipe(
                map(v => {
                    v += 1
                    v *= 10
                    return { state: "progress", filename: "Almafa", current: v, total: 100, percent: v / 100 } as FileDownloadEvent
                }),
                take(10)
            )
        }))

    ).pipe(share())

    x.pipe(toast.handleFileDownload({ align: "center" })).subscribe(console.log)
 */
