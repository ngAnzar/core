import { Component, Input, ChangeDetectionStrategy, Inject, ChangeDetectorRef, NgZone, AfterViewInit, ViewChild, ElementRef, HostBinding } from "@angular/core"

import { ProgressComponent } from "./abstract"
import { Animation, easeLineral } from "../animation"


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

    private _begin: number = 0
    private _end: number = 0
    protected animation = this.destruct.disposable(new BarAnimation((begin, end) => {
        this._begin = begin
        this._end = end
        const line = this.line.nativeElement
        line.setAttribute("x1", 100 * begin + "%")
        line.setAttribute("x2", 100 * end + "%")
    }))

    @ViewChild("line", { static: true }) protected readonly line: ElementRef<SVGLineElement>

    public constructor(
        @Inject(ChangeDetectorRef) cdr: ChangeDetectorRef,
        @Inject(NgZone) private readonly zone: NgZone,
        @Inject(ElementRef) private readonly el: ElementRef<HTMLElement>) {
        super(cdr)
    }

    public ngAfterViewInit() {
        this._updateAnimation()
    }

    private _updateAnimation() {
        if (this.indeterminate) {
            this.animation.update({
                fromBegin: 0,
                toBegin: 1.0,
                fromEnd: 0,
                toEnd: 1.0,
                indeterminate: true
            })
        } else {
            this.animation.update({
                fromBegin: this._begin,
                toBegin: 0,
                fromEnd: this._end,
                toEnd: this.percent,
                indeterminate: false
            })
        }
    }

    protected onIndeterminateChange() {
        this._updateAnimation()
    }

    protected onPercentChange() {
        this._updateAnimation()
    }
}


interface AnimProps {
    fromBegin: number
    toBegin: number
    fromEnd: number
    toEnd: number
    indeterminate: boolean
}


class BarAnimation extends Animation<AnimProps> implements AnimProps {
    public readonly fromBegin: number
    public readonly toBegin: number
    public readonly fromEnd: number
    public readonly toEnd: number
    public readonly indeterminate: boolean

    private _trans = this.transition(easeLineral, diff => 300)
    private _iDuration: number = 2000

    public constructor(private readonly onTick: (start: number, end: number) => void) {
        super()
    }

    protected tick(timestamp: number): boolean {
        if (this.indeterminate) {
            const time = timestamp - this.beginTime
            let progress = time / this._iDuration


            if (progress >= 1.0) {
                this.restart()
            }

            let begin = progress - 0.2
            let end = 1.2 / 1.0 * progress

            if (progress >= 0.5) {
                begin = progress - 0.2 + (0.2 / 0.5 * (progress - 0.5))
            }

            this.onTick(Math.max(0, begin), Math.min(1.0, end))
            return true
        } else {
            const begin = this._trans(timestamp, this.fromBegin, this.toBegin)
            const end = this._trans(timestamp, this.fromEnd, this.toEnd)
            this.onTick(begin.value, end.value)
            return !(begin.progress === 1.0 && end.progress === 1.0)
        }
    }
}
