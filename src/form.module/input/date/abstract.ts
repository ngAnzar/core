import { Inject, StaticProvider, Injector, Injectable } from "@angular/core"
import { Observable, Observer, Subscription } from "rxjs"
import { share } from "rxjs/operators"

import { Destructible } from "../../../util"
import { LayerService, LevitateOptions, LayerBehavior, LayerOptions, ModalLayer, DropdownLayer, ComponentLayerRef, LayerRef } from "../../../layer.module"


export interface DayData {
    // this data displayed under the day number
    data?: string | number

    // button color attribute, only apply, when the date is not selected, and not disabled
    color?: string

    // button variant attribute, only apply, when the date is not selected, and not disabled
    variant?: string

    // disabled button
    disabled?: boolean

    // is today
    today?: boolean
}


export type ExternalDayData = { [key: number]: DayData }


export abstract class DatePickerDayDataProvider extends Destructible {
    public abstract extraData(begin: Date, end: Date): Observable<ExternalDayData>
}


export interface PickerPopup<VALUE> {
    readonly value: VALUE
    readonly valueChange: Observable<VALUE>
    showButtons: boolean
    writeValue(value: VALUE): void
}


export type DatePickerEvent<CMP extends PickerPopup<VALUE>, VALUE> = { type: "create", service: AbstractPickerService<CMP, VALUE>, layerRef: ComponentLayerRef<CMP> }
    | { type: "show", instance: CMP, service: AbstractPickerService<CMP, VALUE>, layerRef: ComponentLayerRef<CMP> }
    | { type: "value", value: VALUE, layerRef: ComponentLayerRef<CMP> }
    | { type: "hide", layerRef: ComponentLayerRef<CMP> }

/*
export interface DatePickerEvent {
    type: "create" | "show" | "hide"
}
*/


@Injectable()
export abstract class AbstractPickerService<CMP extends PickerPopup<VALUE>, VALUE> {
    protected visibleRef: ComponentLayerRef<CMP>
    protected visibleObservable: Observable<DatePickerEvent<CMP, VALUE>>

    public get isVisible(): boolean {
        return this.visibleObservable && this.visibleRef && this.visibleRef.isVisible
    }

    public get instance(): CMP {
        return this.visibleRef ? this.visibleRef.component.instance : null
    }

    public get isDialogMode(): boolean {
        return __PLATFORM__ !== "browser"
    }

    public constructor(@Inject(LayerService) protected readonly layerSvc: LayerService) {

    }

    public update(props: { [key: string]: any }): void {
        if (this.visibleRef) {
            const instance = this.visibleRef.component.instance

            for (const k in props) {
                if (props.hasOwnProperty(k)) {
                    (instance as any)[k] = props[k]
                }
            }
        }
    }

    public show(position: LevitateOptions, value?: VALUE, provides?: StaticProvider[], injector?: Injector): Observable<DatePickerEvent<CMP, VALUE>> {
        if (this.isVisible) {
            return this.visibleObservable
        }

        return this.visibleObservable = new Observable((observer: Observer<DatePickerEvent<CMP, VALUE>>) => {
            const layer = this.visibleRef = this._create(position, provides, injector)

            observer.next({ type: "create", service: this, layerRef: layer })

            layer.show()
            const instance = layer.component.instance
            instance.showButtons = this.isDialogMode

            observer.next({ type: "show", instance, service: this, layerRef: layer })

            if (value != null) {
                instance.writeValue(value)
            }

            const s = instance.valueChange.subscribe(newValue => {
                observer.next({ type: "value", value: newValue, layerRef: layer })
            })

            layer.subscribe(event => {
                if (event.type === "destroy") {
                    observer.next({ type: "hide", layerRef: layer })
                    observer.complete()
                    delete this.visibleRef
                    delete this.visibleObservable
                }
            })

            return () => {
                s.unsubscribe()
                layer.hide()
            }
        }).pipe(share())
    }

    public hide() {
        if (this.isVisible) {
            this.visibleRef.hide()
            delete this.visibleRef
            delete this.visibleObservable
        }
    }

    public toggle(position: LevitateOptions, value?: VALUE, provides?: StaticProvider[], injector?: Injector): Observable<DatePickerEvent<CMP, VALUE>> {
        return new Observable((observer: Observer<DatePickerEvent<CMP, VALUE>>) => {
            let s: Subscription
            if (this.isVisible) {
                s = this.visibleObservable.subscribe(observer)
                this.hide()
                observer.complete()
            } else {
                s = this.show(position, value, provides, injector).subscribe(observer)
            }

            return () => {
                s && s.unsubscribe()
            }
        })
    }

    protected abstract _create(position: LevitateOptions, provides?: StaticProvider[], injector?: Injector): ComponentLayerRef<CMP>

    protected _createBehavior(position: LevitateOptions): LayerBehavior {
        if (!this.isDialogMode) {
            return new DropdownLayer({
                backdrop: {
                    type: "empty",
                    hideOnClick: true,
                    crop: position.anchor.ref instanceof HTMLElement ? position.anchor.ref : null
                },
                position: position,
                elevation: 10,
                closeable: true,
                rounded: 3,
                trapFocus: true
            })
        } else {
            return new ModalLayer({
                backdrop: { type: "filled", hideOnClick: true },
                position: {
                    align: "center",
                    anchor: {
                        ref: "viewport",
                        align: "center"
                    },
                    constraint: {
                        ref: "viewport",
                        inset: 16
                    }
                },
                elevation: 10,
                closeable: true,
                rounded: 3,
                trapFocus: true
            })
        }
    }
}
