import {
    Component, ContentChildren, QueryList, AfterContentInit, OnDestroy, Inject, Optional, Self, Input,
    ChangeDetectionStrategy, ChangeDetectorRef, InjectionToken
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
    template: "<ng-content></ng-content>{{ message }}",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ErrorComponent implements AfterContentInit, OnDestroy {
    public readonly destruct = new Destruct()

    @ContentChildren("[nzErrorMessage]") public messages: QueryList<ErrorMessageDirective>

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

    public set message(val: string) {
        if (this._message !== val) {
            this._message = val
            this.cdr.detectChanges()
        }
    }
    public get message(): string { return this._message }
    private _message: string

    public isEmpty: boolean = true

    public constructor(
        @Inject(NgControl) @Optional() @Self() private readonly ngControl: NgControl,
        @Inject(ChangeDetectorRef) private readonly cdr: ChangeDetectorRef,
        @Inject(DEFAULT_ERROR_MESSAGES) private readonly defaultErrors: ErrorMessages) {
        if (ngControl) {
            this.inputModel = new InputModel(ngControl, null, null)
        }
    }

    public ngAfterContentInit() {
        this.destruct.subscription(this.messages.changes).subscribe(changes => {
            this.message = this._computeErrorMessage()
        })
    }

    public ngOnDestroy() {
        if (this._inputModelS) {
            this._inputModelS.unsubscribe()
            delete this._inputModelS
        }
        this.destruct.run()
    }

    private _onStatusChanges = (status: any) => {
        if (status === "INVALID") {
            this.message = this._computeErrorMessage()
        } else {
            this.message = null
        }

        console.log("_onStatusChanges", status, this.inputModel.errors)
    }

    private _computeErrorMessage(): string {
        const errors = this.inputModel.errors
        const messages = this.messages

        console.log({ messages, defaultErrors: this.defaultErrors })

        if (errors) {
            if (messages.length) {
                for (const m of messages.toArray()) {
                    console.log(m)
                }
            }

            if (this.defaultErrors) {
                for (const k in this.defaultErrors) {
                    if (errors[k]) {
                        return this.defaultErrors[k]
                    }
                }
            }

            for (const k in errors) {
                if (errors.hasOwnProperty(k) && typeof errors[k] === "string") {
                    return errors[k]
                }
            }
        }

        return null
    }
}
