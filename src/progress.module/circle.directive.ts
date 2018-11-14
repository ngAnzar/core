import { Component, Input, HostBinding, HostListener } from "@angular/core"
import { trigger, state, animate, keyframes, style, transition, query } from "@angular/animations"
import { coerceBooleanProperty } from "@angular/cdk/coercion"
import { Observable } from "rxjs"

import { AbstractProgressComponent, ProgressEvent } from "./progress-base"


function strokeWidthCalc(r: number) {
    let x = Math.round(r * 2 / 7)
    return x + (x % 2)
}


@Component({
    selector: "nz-progress[type='circle']",
    styles: [`
        nz-progress[type='circle'] { display: block; }
        nz-progress[type='circle'] svg { transform-origin: center; }
        nz-progress[type='circle'] circle { transform-origin: center; transition: stroke-dashoffset 225ms linear; }
    `],
    templateUrl: "./circle.template.pug",
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
export class CircleProgressComponent extends AbstractProgressComponent {
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
    @Input() public strokeColor: string = "#CC3300"

    protected dashArray: number
    protected dashOffset: number

    public set percent(val: number) {
        if (this._percent !== val) {
            this._percent = val
        }
    }
    public get percent(): number { return this._percent }
    protected _percent: number

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
