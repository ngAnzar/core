import {
    Component, ContentChildren, QueryList, AfterContentInit, OnDestroy, Inject, Optional, Self, Input,
    ChangeDetectionStrategy, ChangeDetectorRef, InjectionToken, TemplateRef
} from "@angular/core"
import { NgControl } from "@angular/forms"
import { Subscription } from "rxjs"


import { Destruct } from "../../util"
import { InputModel } from "../input/abstract"
import { ErrorMessageDirective } from "./error-message.directive"


export type ErrorMessages = { [key: string]: string }


export const DEFAULT_ERROR_MESSAGES = new InjectionToken<ErrorMessages>("DEFAULT_ERROR_MESSAGES")


@Component({
    selector: ".nz-error",
    exportAs: "nzError",
    templateUrl: "./error.component.pug",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ErrorComponent implements OnDestroy {
    public readonly destruct = new Destruct()

    // @ContentChildren(ErrorMessageDirective) public messages: QueryList<ErrorMessageDirective>
    // public messages: ErrorMessageDirective[]
    @Input()
    public set messages(val: ErrorMessageDirective[]) {
        if (this._messages !== val) {
            this._messages = val
            this._computeErrorMessage()
            this.cdr.detectChanges()
        }
    }
    public get messages(): ErrorMessageDirective[] { return this._messages }
    private _messages: ErrorMessageDirective[]

    @Input()
    public set inputModel(val: InputModel<any>) {
        if (this._inputModel !== val) {
            this._inputModel = val
            if (this._inputModelS) {
                this._inputModelS.unsubscribe()
            }

            if (val) {
                this._inputModelS = val.statusChanges.subscribe(this._onStatusChanges)
            }
        }
    }
    public get inputModel(): InputModel<any> { return this._inputModel }
    private _inputModel: InputModel<any>
    private _inputModelS: Subscription

    public errorMessage: string
    public errorTpl: TemplateRef<any>
    public isEmpty: boolean = true

    public constructor(
        @Inject(NgControl) @Optional() @Self() private readonly ngControl: NgControl,
        @Inject(ChangeDetectorRef) private readonly cdr: ChangeDetectorRef,
        @Inject(DEFAULT_ERROR_MESSAGES) private readonly defaultErrors: ErrorMessages) {
        if (ngControl) {
            this.inputModel = new InputModel(ngControl, null, null, (a: any, b: any) => false)
        }
    }

    public ngOnDestroy() {
        if (this._inputModelS) {
            this._inputModelS.unsubscribe()
            delete this._inputModelS
        }
        this.destruct.run()
    }

    private _onStatusChanges = (status: any) => {
        this._computeErrorMessage()
        this.cdr.detectChanges()
    }

    private _computeErrorMessage() {
        if (!this.inputModel) {
            return
        }

        const errors = this.inputModel.errors
        const messages = this.messages

        this.errorMessage = this.errorTpl = null

        if (errors && this.inputModel.touched) {
            if (messages.length) {
                for (const m of messages) {
                    if (errors[m.condition]) {
                        return this.errorTpl = m.tpl
                    }
                }
            }

            if (this.defaultErrors) {
                for (const k in this.defaultErrors) {
                    if (errors[k]) {
                        return this.errorMessage = this.defaultErrors[k]
                    }
                }
            }

            for (const k in errors) {
                if (errors.hasOwnProperty(k) && typeof errors[k] === "string") {
                    return this.errorMessage = errors[k]
                }
            }
        }
    }
}
