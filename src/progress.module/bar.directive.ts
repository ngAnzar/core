import { Component, Input } from "@angular/core"
import { coerceBooleanProperty } from "@angular/cdk/coercion"
import { Observable } from "rxjs"

import { AbstractProgressComponent, ProgressEvent } from "./progress-base"


@Component({
    selector: "nz-progress[type='bar']",
    template: `BAR`
})
export class CircleProgressComponent extends AbstractProgressComponent {
}
