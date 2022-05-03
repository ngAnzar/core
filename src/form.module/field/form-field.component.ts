import {
    Component, ContentChild, ContentChildren, QueryList, AfterContentInit, NgZone,
    ChangeDetectionStrategy, ChangeDetectorRef, ElementRef, Inject, OnDestroy
} from "@angular/core"
import { merge } from "rxjs"
import { startWith, debounceTime } from "rxjs/operators"

import { Destruct, Destructible } from "../../util"
import { InputModel } from "../input/abstract"
import { ErrorMessageDirective } from "../error/error-message.directive"
import { FocusGroup } from "../../common.module"


@Component({
    selector: ".nz-form-field",
    templateUrl: "./form-field.template.pug",
    host: {
        "[class.nz-focused]": "!!focusGroup.currentOrigin",
        "[class.ng-invalid]": "_inputModel.invalid",
        "[attr.disabled]": "_inputModel.disabled ? '' : null"
    },
    providers: [FocusGroup],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormFieldComponent extends Destructible implements AfterContentInit, OnDestroy {
    public readonly showUnderline: boolean

    @ContentChild(InputModel, { static: true }) public _inputModel: InputModel<any>
    @ContentChildren(ErrorMessageDirective) public messages: QueryList<ErrorMessageDirective>

    public constructor(
        @Inject(ElementRef) public readonly el: ElementRef<HTMLElement>,
        @Inject(ChangeDetectorRef) private readonly cdr: ChangeDetectorRef,
        @Inject(FocusGroup) public readonly focusGroup: FocusGroup) {
        super()
    }

    public ngAfterContentInit(): void {
        const q1 = this._inputModel.statusChanges.pipe(debounceTime(100))

        this.destruct.subscription(merge(q1, this.focusGroup.changes))
            .subscribe(this.cdr.detectChanges.bind(this.cdr))
    }
}
