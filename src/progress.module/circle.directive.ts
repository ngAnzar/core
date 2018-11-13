import { Component, Input, HostBinding } from "@angular/core"
import { coerceBooleanProperty } from "@angular/cdk/coercion"
import { Observable } from "rxjs"

import { AbstractProgressComponent, ProgressEvent } from "./progress-base"


function strokeWidthCalc(r: number) {
    let x = Math.round(r * 2 / 7)
    return x + (x % 2)
}


@Component({
    selector: "nz-progress[type='circle']",
    templateUrl: "./circle.template.pug"
})
export class CircleProgressComponent extends AbstractProgressComponent {
    @Input()
    public set radius(val: number) {
        this._radius = Number(val)
        if (!this.strokeWidth) {
            this.strokeWidth = strokeWidthCalc(this._radius)
        }
    }
    public get radius(): number { return this._radius }
    public _radius: number

    @HostBinding("style.width") public get width(): string { return `${this.radius * 2}px` }
    @HostBinding("style.height") public get height(): string { return `${this.radius * 2}px` }

    // @Input() public strokeWidth: number = Math.round(this.radius / 6) + (Math.round(this.radius / 6) % 2)
    @Input() public strokeWidth: number
    @Input() public strokeColor: string = "#CC3300"

    // @Input() public progress: Observable<ProgressEvent>

}
