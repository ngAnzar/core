import { Component, Input, ChangeDetectionStrategy, Inject, ChangeDetectorRef, NgZone, AfterViewInit, ViewChild, ElementRef, HostBinding } from "@angular/core"
import { coerceBooleanProperty } from "@angular/cdk/coercion"
import { Observable } from "rxjs"

import { Timeline } from "../timeline"
import { ProgressComponent, ProgressEvent } from "./abstract"


@Component({
    selector: "nz-progress[type='bar']",
    templateUrl: "./bar.template.pug",
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        { provide: ProgressComponent, useExisting: ProgressBarComponent }
    ]
})
export class ProgressBarComponent extends ProgressComponent implements AfterViewInit {
    @Input()
    @HostBinding("style.height.px")
    public height: number = 8

    public set barStart(val: number) {
        if (this._barStart !== val) {
            this._barStart = val
        }
    }
    public get barStart(): number { return this._barStart }
    private _barStart: number = 0

    public set barEnd(val: number) {
        if (this._barEnd !== val) {
            this._barEnd = val
        }
    }
    public get barEnd(): number { return this._barEnd }
    private _barEnd: number = 0

    protected animation: Timeline
    private indeterminateTime: number

    @ViewChild("line", { static: true }) protected readonly line: ElementRef<SVGLineElement>

    public constructor(
        @Inject(ChangeDetectorRef) cdr: ChangeDetectorRef,
        @Inject(NgZone) private readonly zone: NgZone,
        @Inject(ElementRef) private readonly el: ElementRef<HTMLElement>) {
        super(cdr)
    }

    public ngAfterViewInit() {
        this.indeterminateTime = this.el.nativeElement.offsetWidth * 2.5
        this.animation = new Timeline(this.zone, this.indeterminateTime)
        this._initAnimation()
        this.animation.play()

        this.destruct.disposable(this.animation)
    }

    private _initAnimation() {
        const line = this.line.nativeElement
        const indeterminateSize = 0.2
        let determinateEnd = 0
        let endBase = 0
        let lastPercent = 0

        this.animation.keyframe(progress => {
            let begin = 0
            let end = 0

            if (progress <= indeterminateSize) {
                begin = 0
                end = progress
            } else {
                let x = indeterminateSize + 0.1
                begin = progress - indeterminateSize + (indeterminateSize / 1.0) * (progress - indeterminateSize)
                end = begin + indeterminateSize + (x / 1.0) * (progress - indeterminateSize)
            }

            line.setAttribute("x1", 100 * begin + '%')
            line.setAttribute("x2", 100 * end + '%')
        }, () => this.indeterminate)

        this.animation.keyframe(progress => {
            if (lastPercent !== this.percent) {
                endBase = determinateEnd
                lastPercent = this.percent
            }

            let newEnd = this.percent
            determinateEnd = endBase + (newEnd - endBase) * progress

            line.setAttribute("x1", '0%')
            line.setAttribute("x2", 100 * determinateEnd + '%')

            if (progress >= 1.0) {
                this.animation.stop()
            }
        }, () => !this.indeterminate)
    }

    protected onIndeterminateChange() {
        this.animation.stop()
        this.animation.totalTime = this.indeterminate ? this.indeterminateTime : 200
        this.animation.play()
    }

    protected onPercentChange() {
        this.animation.play()
    }
}
