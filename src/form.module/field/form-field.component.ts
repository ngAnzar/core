import {
    Component, ContentChild, AfterContentInit, NgZone, ChangeDetectionStrategy, ChangeDetectorRef, ElementRef, Inject
} from "@angular/core"
import { merge } from "rxjs"
import { startWith, debounceTime } from "rxjs/operators"

import { Destruct } from "../../util"
import { InputModel } from "../input/abstract"


@Component({
    selector: ".nz-form-field",
    templateUrl: "./form-field.template.pug",
    host: {
        "[class.nz-focused]": "_inputModel.focused",
        // "[class.ng-untouched]": "_input.untouched",
        // "[class.ng-touched]": "_input.touched",
        // "[class.ng-pristine]": "_input.pristine",
        // "[class.ng-dirty]": "_input.dirty",
        // "[class.ng-valid]": "_input.valid",
        "[class.ng-invalid]": "_inputModel.invalid",
        // "[class.ng-pending]": "_input.pending"
        "[attr.disabled]": "_inputModel.disabled ? '' : null"
    },
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormFieldComponent implements AfterContentInit {
    public readonly destruct = new Destruct()
    public readonly showUnderline: boolean

    // @ContentChild(LabelDirective) protected _labelDirective: LabelDirective
    @ContentChild(InputModel) protected _inputModel: InputModel<any>

    public constructor(
        @Inject(ElementRef) public readonly el: ElementRef<HTMLElement>,
        @Inject(ChangeDetectorRef) private readonly cdr: ChangeDetectorRef) {
    }

    public ngAfterContentInit(): void {
        if (!this._inputModel) {
            console.log(this.el.nativeElement)
            throw new Error("Missing input model")
        }

        this.destruct.subscription(
            merge(this._inputModel.statusChanges,
                this._inputModel.valueChanges,
                this._inputModel.focusChanges))
            .pipe(startWith(), debounceTime(100))
            .subscribe(this.cdr.markForCheck.bind(this.cdr))
    }
}
