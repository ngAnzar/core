import {
    Component, ContentChild, ContentChildren, QueryList,
    AfterContentInit, NgZone, ChangeDetectionStrategy, ChangeDetectorRef, ElementRef, Inject
} from "@angular/core"
import { merge } from "rxjs"
import { startWith } from "rxjs/operators"

import { PrefixDirective, PostfixDirective, LabelDirective, CaptionDirective } from "../../common.module"
import { InputComponent } from "../input/abstract"


@Component({
    selector: ".nz-form-field",
    templateUrl: "./form-field.template.pug",
    host: {
        "[class.nz-focused]": "_input.focused",
        "[class.nz-has-value]": "!_inputIsEmpty()",
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
    public readonly showUnderline: boolean

    @ContentChildren(PrefixDirective) protected _prefixDirectives: QueryList<PrefixDirective>
    @ContentChildren(PostfixDirective) protected _postfixDirectives: QueryList<PostfixDirective>
    @ContentChild(LabelDirective) protected _labelDirective: LabelDirective
    @ContentChild(CaptionDirective) protected _captionDirective: CaptionDirective
    @ContentChild(InputComponent) protected _input: InputComponent<any>

    public constructor(
        @Inject(ElementRef) public readonly el: ElementRef<HTMLElement>,
        @Inject(ChangeDetectorRef) private _changeDetector: ChangeDetectorRef,
        @Inject(NgZone) protected readonly zone: NgZone) {
    }

    public ngAfterContentInit(): void {
        if (!this._input) {
            throw new Error("Missing input component")
        }
        (this as any).showUnderline = this._input.type === "text" || this._input.type === "select"

        if (this._labelDirective) {
            this._labelDirective.targetId = this._input.id
        }

        const stChange = this._input.statusChanges
        const valChange = this._input.valueChanges

        merge(stChange, valChange)
            .pipe(startWith())
            .subscribe(reason => {
                this._changeDetector.markForCheck()
                // force update host bindings
                this.zone.run(_ => { })
            })

        this._changeDetector.markForCheck()
    }

    // public ngAfterViewChecked() {
    //     if (this._underline) {
    //         if (this._input.focused) {
    //             this._underline.nativeElement.setAttribute("highlighted", "")
    //         } else {
    //             this._underline.nativeElement.removeAttribute("highlighted")
    //         }
    //     }
    // }

    public _inputIsEmpty() {
        let val: any = this._input.value
        if (typeof val === "string") {
            return val.length === 0
        } else if (typeof val === "number" || typeof val === "boolean") {
            return false
        } else if (Array.isArray(val)) {
            return val.length === 0
        }
        return !val
    }
}
