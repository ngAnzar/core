import { Component, Inject, ContentChild, ChangeDetectionStrategy, OnDestroy, Input, ElementRef } from "@angular/core"
import { merge, Subscription } from "rxjs"
import { startWith, tap } from "rxjs/operators"

import { FastDOM, rawSetTimeout } from "../../util"
import { InputModel } from "../input/abstract"


@Component({
    selector: ".nz-placeholder",
    template: "<ng-content></ng-content>",
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaceholderComponent implements OnDestroy {
    @ContentChild(InputModel, { static: true })
    public set contentModel(val: InputModel<any>) {
        if (this._inputModel !== val) {
            this._inputModel = val
            this.onInputModelChange()
        }
    }

    @Input()
    public set inputModel(val: InputModel<any>) {
        if (this._inputModel !== val) {
            this._inputModel = val
            this.onInputModelChange()
        }
    }

    private _inputModel: InputModel<any>

    public set hideLabel(val: boolean) {
        if (this._hideLabel !== val) {
            this._hideLabel = val
            FastDOM.mutate(() => {
                if (this._animate) {
                    this.el.nativeElement.setAttribute("animate", "")
                }

                if (val) {
                    this.el.nativeElement.setAttribute("ishidden", "")
                    this._animate = true
                } else {
                    this.el.nativeElement.removeAttribute("ishidden")
                }
            })
        }
    }
    public get hideLabel(): boolean { return this._hideLabel }
    private _hideLabel: boolean

    private _subscription: Subscription
    private _animate: boolean = false

    public constructor(@Inject(ElementRef) private readonly el: ElementRef<HTMLElement>) {

    }

    private onInputModelChange() {
        if (this._subscription) {
            this._subscription.unsubscribe()
            delete this._subscription
        }

        if (this._inputModel) {
            if (!this._inputModel.control) {
                rawSetTimeout(this.onInputModelChange.bind(this), 20)
                return
            }

            const q1 = merge(this._inputModel.statusChanges, this._inputModel.valueChanges, this._inputModel.inputChanges)
            const q2 = this._inputModel.focusChanges.pipe(tap(v => {
                if (!this._animate && v.current) {
                    this._animate = true
                }
            }))

            this._subscription = merge(q1, q2)
                .pipe(startWith(null))
                .subscribe(() => {
                    this.hideLabel = !this._inputModel.isEmpty || this._inputModel.focused !== null
                })
        }
    }

    public ngOnDestroy() {
        if (this._subscription) {
            this._subscription.unsubscribe()
            delete this._subscription
        }
    }
}
