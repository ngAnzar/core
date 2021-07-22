import {
    Component, ContentChild, ContentChildren, QueryList, AfterContentInit, NgZone,
    ChangeDetectionStrategy, ChangeDetectorRef, ElementRef, Inject, OnDestroy
} from "@angular/core"
import { merge } from "rxjs"
import { startWith, debounceTime } from "rxjs/operators"

import { Destruct } from "../../util"
import { InputModel } from "../input/abstract"
import { ErrorMessageDirective } from "../error/error-message.directive"


@Component({
    selector: ".nz-form-field",
    templateUrl: "./form-field.template.pug",
    host: {
        "[class.nz-focused]": "_inputModel.focused",
        "[class.ng-invalid]": "_inputModel.invalid",
        "[attr.disabled]": "_inputModel.disabled ? '' : null"
    },
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormFieldComponent implements AfterContentInit, OnDestroy {
    public readonly destruct = new Destruct()
    public readonly showUnderline: boolean

    @ContentChild(InputModel, { static: true }) public _inputModel: InputModel<any>
    @ContentChildren(ErrorMessageDirective) public messages: QueryList<ErrorMessageDirective>

    public constructor(
        @Inject(ElementRef) public readonly el: ElementRef<HTMLElement>,
        @Inject(ChangeDetectorRef) private readonly cdr: ChangeDetectorRef) {
    }

    public ngAfterContentInit(): void {
        const q1 = this._inputModel.statusChanges.pipe(debounceTime(100))
        const q2 = this._inputModel.focusChanges.pipe(startWith(null))

        this.destruct.subscription(merge(q1, q2))
            .subscribe(this.cdr.markForCheck.bind(this.cdr))
    }

    public ngOnDestroy() {
        this.destruct.run()
    }
}
