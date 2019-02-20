import {
    Component, ContentChild, AfterContentInit, NgZone, ChangeDetectionStrategy, ChangeDetectorRef, ElementRef, Inject
} from "@angular/core"
import { merge } from "rxjs"
import { startWith } from "rxjs/operators"

import { Destruct } from "../../util"
import { LabelDirective } from "../../common.module"
import { InputComponent } from "../input/abstract"


@Component({
    selector: ".nz-form-field",
    templateUrl: "./form-field.template.pug",
    host: {
        "[class.nz-focused]": "_input.focused",
        "[class.ng-untouched]": "_input.untouched",
        "[class.ng-touched]": "_input.touched",
        "[class.ng-pristine]": "_input.pristine",
        "[class.ng-dirty]": "_input.dirty",
        "[class.ng-valid]": "_input.valid",
        "[class.ng-invalid]": "_input.invalid",
        "[class.ng-pending]": "_input.pending"
    },
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormFieldComponent implements AfterContentInit {
    public readonly destruct = new Destruct()
    public readonly showUnderline: boolean

    @ContentChild(LabelDirective) protected _labelDirective: LabelDirective
    @ContentChild(InputComponent) protected _input: InputComponent<any>

    public constructor(
        @Inject(ElementRef) public readonly el: ElementRef<HTMLElement>,
        @Inject(ChangeDetectorRef) private readonly cdr: ChangeDetectorRef) {
    }

    public ngAfterContentInit(): void {
        if (!this._input) {
            throw new Error("Missing input component")
        }
        (this as any).showUnderline = this._input.type === "text" || this._input.type === "select"

        if (this._labelDirective) {
            this._labelDirective.targetId = this._input.id
        }

        this.destruct.subscription(merge(this._input.statusChanges, this._input.valueChanges))
            .pipe(startWith())
            .subscribe(this.cdr.markForCheck.bind(this.cdr))
    }
}
