import { Component, Inject, ContentChild, ChangeDetectionStrategy, OnDestroy, Input, ElementRef, Output } from "@angular/core"
import { defer, merge, Observable, Subscription, of, BehaviorSubject, interval, concat, withLatestFrom } from "rxjs"
import { startWith, switchMap, tap, map, distinctUntilChanged, shareReplay, takeWhile, mapTo, ignoreElements } from "rxjs/operators"

import { FastDOM, rawSetTimeout, Destructible } from "../../util"
import { InputModel } from "../input/abstract"
import { RectMutationService } from "../../layout.module"


@Component({
    selector: ".nz-placeholder",
    template: `
        <ng-container nzLayout="column" nzLayoutAlign="start stretch">
            <ng-content></ng-content>
        </ng-container>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    exportAs: "nzPlaceholder"
})
export class PlaceholderComponent extends Destructible implements OnDestroy {
    private readonly _inputModel = new BehaviorSubject<InputModel<any>>(null)

    @ContentChild(InputModel, { static: true })
    public set contentModel(val: InputModel<any>) {
        if (this._inputModel.value !== val) {
            this._inputModel.next(val)
        }
    }

    @Input()
    public set inputModel(val: InputModel<any>) {
        if (this._inputModel.value !== val) {
            this._inputModel.next(val)
        }
    }

    public readonly inputModel$ = this._inputModel.pipe(
        switchMap(model => {
            return concat(
                interval(20).pipe(
                    takeWhile(() => !model || !model.control),
                    ignoreElements(),
                ),
                of(model)
            )
        }),
        distinctUntilChanged(),
        shareReplay(1)
    )

    public readonly hideLabel$ = this.inputModel$.pipe(
        switchMap(model => {
            const q1 = merge(model.statusChanges, model.valueChanges, model.inputChanges)
            const q2 = model.focusChanges.pipe(tap(v => {
                if (!this._animate && v.curr) {
                    this._animate = true
                }
            }))

            return merge(q1, q2)
                .pipe(
                    startWith(null),
                    map(() => !model.isEmpty || model.focused !== null)
                )
        }),
        distinctUntilChanged(),
        shareReplay(1)
    )

    private readonly labelEl = new Observable<HTMLLabelElement>(observer => {
        const emit = () => {
            const label: HTMLLabelElement = this.el.nativeElement.querySelector("label")
            observer.next(label)
        }

        emit()

        const mutation = new MutationObserver(emit)
        mutation.observe(this.el.nativeElement, {
            subtree: true,
            childList: true,
        })

        return () => {
            mutation.disconnect()
        }
    }).pipe(
        distinctUntilChanged(),
        shareReplay(1)
    )

    public readonly labelWidth$ = this.labelEl.pipe(
        switchMap(label => {
            if (label) {
                return this.rectMutation.watchDimension(label).pipe(map(dim => dim.width))
            } else {
                return of(0)
            }
        }),
        distinctUntilChanged(),
        shareReplay(1)
    )

    public readonly labelNotchWidth$ = this.hideLabel$.pipe(
        switchMap(hideLabel => {
            if (hideLabel) {
                return this.labelWidth$.pipe(map(lw => lw * 0.8))
            } else {
                return of(0)
            }
        }),
        distinctUntilChanged(),
        shareReplay(1)
    )

    private _animate: boolean = false

    public constructor(
        @Inject(ElementRef) private readonly el: ElementRef<HTMLElement>,
        @Inject(RectMutationService) private readonly rectMutation: RectMutationService) {
        super()

        this.destruct.subscription(this.hideLabel$).subscribe(hideLabel => {
            FastDOM.mutate(() => {
                if (this._animate) {
                    this.el.nativeElement.setAttribute("animate", "")
                }

                if (hideLabel) {
                    this.el.nativeElement.setAttribute("ishidden", "")
                    this._animate = true
                } else {
                    this.el.nativeElement.removeAttribute("ishidden")
                }
            })
        })
    }
}
