import { Component, Input } from "@angular/core"
import { coerceBooleanProperty } from "@angular/cdk/coercion"
import { Observable } from "rxjs"

import { ProgressComponent, ProgressEvent } from "./abstract"


@Component({
    selector: "nz-progress[type='bar']",
    template: `BAR`,
    providers: [
        { provide: ProgressComponent, useExisting: ProgressBarComponent }
    ]
})
export class ProgressBarComponent extends ProgressComponent {
    public set percent(val: number) {
        if (this._percent !== val) {
            this._percent = val
        }
    }
    public get percent(): number { return this._percent }
    protected _percent: number
}
