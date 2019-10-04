import {
    Component, Input, HostBinding, ChangeDetectionStrategy, ChangeDetectorRef,
    ViewChild, AfterViewInit, ElementRef, NgZone, Inject
} from "@angular/core"

import { Timeline } from "../timeline"
import { ProgressComponent } from "./abstract"


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
    }
    public get radius(): number { return this._radius }
    protected _radius: number
    protected _radiusMinusStroke: number

    @HostBinding("style.width") public get width(): string { return `${this.radius * 2}px` }
    @HostBinding("style.height") public get height(): string { return `${this.radius * 2}px` }

    @Input() public strokeWidth: number

    protected dashArray: number

    @ViewChild("circle", { static: true }) protected readonly circle: ElementRef<SVGCircleElement>

    protected animation: Timeline

    public constructor(
        @Inject(ChangeDetectorRef) cdr: ChangeDetectorRef,
        @Inject(NgZone) zone: NgZone) {
        super(cdr)

        this.animation = new Timeline(zone, 700)
        this.destruct.disposable(this.animation)
    }

    public ngAfterViewInit() {
        this._initAnimation()
        this.animation.play()
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


function strokeWidthCalc(r: number) {
    let x = Math.round(r / 7) * 2
    return x + (x % 2)
}
