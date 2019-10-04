import { Component, Inject, ContentChild, AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, HostBinding, Input, ElementRef } from "@angular/core"
import { merge, Subject } from "rxjs"
import { startWith, debounceTime, takeUntil } from "rxjs/operators"

import { Destruct } from "../../util"
import { InputModel } from "../input/abstract"


@Component({
    selector: ".nz-placeholder",
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: "./placeholder.template.pug"
})
export class PlaceholderComponent implements AfterContentInit, OnDestroy {
    public readonly destruct = new Destruct();

    @ContentChild(InputModel, { static: true }) protected _inputModel: InputModel<any>

    @Input()
    public set hideLabel(val: boolean) {
        if (this._hideLabel !== val) {
            this._hideLabel = val
            this._hideLabel$.next(val)
        }
    }
    public get hideLabel(): boolean { return this._hideLabel }
    private _hideLabel: boolean = false
    private _hideLabel$ = this.destruct.subject(new Subject<boolean>())

    public constructor(
        @Inject(ChangeDetectorRef) protected readonly cdr: ChangeDetectorRef,
        @Inject(ElementRef) el: ElementRef<HTMLElement>) {

        this._hideLabel$.pipe(debounceTime(50), takeUntil(this.destruct.on)).subscribe(val => {
            el.nativeElement.classList[val ? "add" : "remove"]("hide-label")
        })
    }

    public ngAfterContentInit() {
        if (this._inputModel) {
            merge(this._inputModel.statusChanges, this._inputModel.valueChanges, this._inputModel.focusChanges, this._inputModel.inputChanges)
                .pipe(startWith(null), takeUntil(this.destruct.on))
                .subscribe(event => {
                    this.hideLabel = !this._inputModel.isEmpty || this._inputModel.focused !== null
                })
        }
    }

    public ngOnDestroy() {
        this.destruct.run()
    }
}
