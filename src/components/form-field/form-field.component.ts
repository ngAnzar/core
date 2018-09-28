import {
    Component, ContentChild, ContentChildren, QueryList,
    AfterContentInit,
    ChangeDetectionStrategy, ChangeDetectorRef, ElementRef, Inject,
    ViewChild
} from "@angular/core"
import { merge } from "rxjs"
import { startWith, combineAll } from "rxjs/operators"

import { PrefixDirective, PostfixDirective, LabelDirective, CaptionDirective } from "../../directives.module"
import { InputComponent } from "../input/input.component"


@Component({
    selector: ".nz-form-field",
    templateUrl: "./form-field.template.pug",
    host: {
        "[class.nz-focused]": "_input.focused",
        "[class.nz-has-value]": "_input.value != null",
        "[class.ng-untouched]": "_input.untouched",
        "[class.ng-touched]": "_input.touched",
        "[class.ng-pristine]": "_input.pristine",
        "[class.ng-dirty]": "_input.dirty",
        "[class.ng-valid]": "_input.valid",
        "[class.ng-invalid]": "_input.invalid",
        "[class.ng-pending]": "_input.pending",
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

    @ViewChild("underline") protected _underline: ElementRef<HTMLElement>


    public constructor(
        @Inject(ElementRef) public readonly el: ElementRef<HTMLElement>,
        @Inject(ChangeDetectorRef) private _changeDetector: ChangeDetectorRef) {
    }

    public ngAfterContentInit(): void {
        if (!this._input) {
            throw new Error("Missing input component")
        }
        (this as any).showUnderline = this._input.type === "text" || this._input.type === "select"

        if (this._labelDirective) {
            this._labelDirective.input = this._input
        }

        const stChange = this._input.statusChanges.pipe(startWith())
        const valChange = this._input.valueChanges.pipe(startWith(this._input.value))

        merge(stChange, valChange).subscribe(reason => {
            if (this._underline) {
                if (this._input.focused) {
                    this._underline.nativeElement.setAttribute("highlighted", "")
                } else {
                    this._underline.nativeElement.removeAttribute("highlighted")
                }
            }
            this._changeDetector.markForCheck()
        })
    }
}
