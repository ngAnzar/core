import { Component, Input } from "@angular/core"
import { coerceBooleanProperty } from "@angular/cdk/coercion"
import { Observable } from "rxjs"

import { AbstractProgressComponent, ProgressEvent } from "./progress-base"


@Component({
    selector: "nz-progress[type='bar']",
    template: `BAR`
})
export class CircleProgressComponent extends AbstractProgressComponent {
    public set percent(val: number) {
        if (this._percent !== val) {
            this._percent = val
        }
    }
    public get percent(): number { return this._percent }
    protected _percent: number
}
