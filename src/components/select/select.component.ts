import {
    Component, ContentChild, TemplateRef, Inject, Optional, ElementRef, Renderer2, Input,
    ViewChild, AfterContentInit, AfterViewInit, ViewContainerRef,
    ChangeDetectionStrategy, ChangeDetectorRef, Attribute, HostListener
} from "@angular/core"
import { NgControl, NgModel } from "@angular/forms"
import { coerceBooleanProperty } from "@angular/cdk/coercion"
import { FocusMonitor, FocusOrigin } from "@angular/cdk/a11y"
import { ESCAPE, UP_ARROW, DOWN_ARROW, ENTER, BACKSPACE } from "@angular/cdk/keycodes"
import { Observable, Subject, Subscription, Observer, forkJoin } from "rxjs"
import { debounceTime, distinctUntilChanged, filter } from "rxjs/operators"

import { SelectionModel, SingleSelection } from "../../selection.module"
import { DataSource, DataStorage, Range, Model, ID, Field } from "../../data"
import { InputComponent, INPUT_VALUE_ACCESSOR } from "../input/input.component"
import { LayerService, DropdownLayer, DropdownLayerOptions, LevitateOptions, ComponentLayerRef } from "../../layer.module"
import { FormFieldComponent } from "../form-field/form-field.component"
import { DropdownComponent, DROPDOWN_ITEM_TPL } from "./dropdown.component"
import { Subscriptions } from "../../util/subscriptions"



export class SelectTplContext<T> {
    $implicit: T
}

export type SelectTemplateRef<T> = TemplateRef<SelectTplContext<T>>


export class Match extends Model {
    @Field() public offset: number
    @Field() public length: number

    public get range(): Range {
        return new Range(this.offset, this.offset + this.length)
    }
}


export interface IAutocompleteModel {
    label: string
    matches: Match[]
}


export type InputState = "typing" | "querying"
export type SelectValue<T> = T | ID | T[] | ID[]

@Component({
    selector: ".nz-select",
    templateUrl: "./select.template.pug",
    host: {
        "[attr.id]": "id",
        "[attr.tabindex]": "editable ? -1 : tabIndex",
        "[attr.opened]": "opened ? '' : null",
        "[attr.disabled]": "disabled ? '' : null",
        "[attr.editable]": "editable ? '' : null"
    },
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        LayerService,
        { provide: InputComponent, useExisting: SelectComponent },
        INPUT_VALUE_ACCESSOR
    ]
})
export class SelectComponent<T extends Model> extends InputComponent<SelectValue<T>> implements AfterContentInit, AfterViewInit {
    public get type(): string { return "select" }

    @ContentChild("selected", { read: TemplateRef }) public readonly selectedTpl: SelectTemplateRef<T>
    @ContentChild("item", { read: TemplateRef }) public readonly itemTpl: SelectTemplateRef<T>

    @ViewChild("hidden", { read: ElementRef }) protected readonly hidden: ElementRef<HTMLElement>
    @ViewChild("input", { read: ElementRef }) protected readonly input: ElementRef<HTMLInputElement>
    @ViewChild("default_selected_single", { read: TemplateRef }) protected readonly defaultSelectedSingleTpl: SelectTemplateRef<T>
    @ViewChild("default_selected_multi", { read: TemplateRef }) protected readonly defaultSelectedMultiTpl: SelectTemplateRef<T>
    @ViewChild("default_item", { read: TemplateRef }) protected readonly defaultItemTpl: SelectTemplateRef<T>
    @ViewChild("dropdown", { read: TemplateRef }) protected readonly dropdownTpl: SelectTemplateRef<T>

    @Input("data-source") //public readonly dataSource: DataSource<T>
    public set dataSource(val: DataSource<T>) {
        if (this._dataSource !== val) {
            this._dataSource = val
            this.storage = val ? new DataStorage(val) : null
            this._watchInputStream(this.editable)
            this.cdr.markForCheck()
        }
    }
    public get dataSource(): DataSource<T> { return this._dataSource }
    protected _dataSource: DataSource<T>

    public set storage(val: DataStorage<T>) {
        if (this._storage !== val) {
            this._storage = val
            this.cdr.markForCheck()
        }
    }
    public get storage(): DataStorage<T> { return this._storage }
    protected _storage: DataStorage<T>

    public readonly displayField: string

    @Input()
    public set opened(val: boolean) {
        val = coerceBooleanProperty(val)
        if (this._opened !== val) {
            this._opened = val
            this._updateDropDown()
            this.cdr.markForCheck()
        }
    }
    public get opened(): boolean { return !this.disabled && this._opened }
    protected _opened: boolean = false

    @Input()
    public set editable(val: boolean) {
        val = coerceBooleanProperty(val)
        if (this._editable !== val) {
            this._editable = val
            this._watchInputStream(val)
            this.cdr.markForCheck()
        }
    }
    public get editable(): boolean { return this._editable }
    protected _editable: boolean = false
    protected _iss: Subscription

    @Input()
    public set disabled(val: boolean) {
        val = coerceBooleanProperty(val)
        if (this._disabled !== val) {
            this._disabled = val
            this._updateDropDown()
            this._watchInputStream(!val && this.editable)
            this.cdr.markForCheck()
        }
    }
    public get disabled(): boolean { return !this.dataSource || this._disabled }
    protected _disabled: boolean = false

    public set inputState(val: InputState) {
        if (this._inputState !== val) {
            this._inputState = val
            this.cdr.markForCheck()
        }
    }
    public get inputState() { return this._inputState }
    protected _inputState: InputState

    @Input("min-length") public minLength: number = 2

    // public get submitValue(): string {
    //     return
    // }

    public get selected(): T[] {
        return this.selection.items
    }

    protected ddLayer: ComponentLayerRef<DropdownComponent<T>>
    protected s = new Subscriptions()
    protected focusOrigin: FocusOrigin
    protected inputStream: Observable<string> = new Subject()
    protected lastKeyup: number

    public constructor(
        @Inject(NgControl) @Optional() ngControl: NgControl,
        @Inject(NgModel) @Optional() ngModel: NgModel,
        @Inject(Renderer2) _renderer: Renderer2,
        @Inject(ElementRef) el: ElementRef,
        @Inject(SelectionModel) @Optional() protected readonly selection: SelectionModel<T>,
        @Inject(LayerService) protected readonly layer: LayerService,
        @Inject(FormFieldComponent) @Optional() protected readonly ffc: FormFieldComponent,
        @Inject(ChangeDetectorRef) protected cdr: ChangeDetectorRef,
        @Inject(FocusMonitor) protected _focusMonitor: FocusMonitor,
        @Attribute("display-field") displayField: string,
        @Attribute("value-field") protected readonly valueField: string) {
        super(ngControl, ngModel, _renderer, el)

        if (!selection) {
            this.selection = new SingleSelection()
        }

        this.selection.maintainSelection = true
        this.s.add(this.selection.changes).subscribe(selected => {
            let value = valueField
                ? selected.map(item => (item as any)[valueField])
                : selected.slice(0)

            if (this.selection.type !== "multi") {
                this.opened = false
                this.value = value[0]
            } else {
                this.value = value
            }

            if (this.selection.type === "single" && selected[0]) {
                this._resetTextInput((selected[0] as any)[this.displayField])
            } else {
                this._resetTextInput()
            }

            this.cdr.markForCheck()
        })

        this.displayField = displayField || "label"

        this._focusMonitor.monitor(el.nativeElement, true).subscribe(origin => {
            if (this.focusOrigin !== origin) {
                this.focusOrigin = origin
                this._handleFocus(origin !== null)
            }
        })
    }

    public toggle() {
        this.opened = !this.opened
        this.cdr.markForCheck()
    }

    public writeValue(obj: SelectValue<T>): void {
        const { ids, request, models } = this.coerceValue(obj)

        if (request.length) {
            this.getModels(request).subscribe(result => {
                this.selection.items = models.concat(result)
            })
        } else {
            this.selection.items = models
        }

        if (this.hidden) {
            this._renderer.setAttribute(this.hidden.nativeElement, "value", ids.join(","))
        }
    }

    protected coerceValue(value: SelectValue<T>): { ids: ID[], request: ID[], models: T[] } {
        if (typeof value === "string") {
            value = value.split(/\s*,\s*/)
        }

        if (!Array.isArray(value)) {
            value = [value] as any
        }

        let ids = []
        let models = []
        let request = []
        let idField = this.valueField || "id"

        for (let item of value as Array<T | ID>) {
            if (typeof item === "string" || typeof item === "number") {
                let existing = this.selection.items.find(selected => (selected as any)[idField] === item)
                if (existing) {
                    models.push(existing)
                } else {
                    request.push(item)
                }
                ids.push(item)
            } else if (item instanceof Model) {
                models.push(item)
                ids.push(item.id)
            }
        }

        return { ids, request, models }
    }

    protected getModels(ids: ID[]): Observable<T[]> {
        return Observable.create((observer: Observer<T[]>) => {
            let s = []
            for (let i = 0, l = ids.length; i < l; i++) {
                s.push(this.dataSource.get(ids[i]))
            }

            const merged = forkJoin(...s).subscribe(observer)
            return () => {
                merged.unsubscribe()
            }
        })
    }

    public ngAfterContentInit() {
        // (this as any).storage = new DataStorage(this.dataSource)
    }

    public ngAfterViewInit() {
        if (!this.selectedTpl) {
            if (this.selection.type === "multi") {
                (this as any).selectedTpl = this.defaultSelectedMultiTpl
            } else {
                (this as any).selectedTpl = this.defaultSelectedSingleTpl
            }
        }

        if (!this.itemTpl) {
            (this as any).itemTpl = this.defaultItemTpl
        }
    }

    protected _updateDropDown() {
        if (this.opened) {
            // Promise.resolve(this.ddLayer ? this.ddLayer.hide() :)
            if (!this.ddLayer) {
                let targetEl = (this.ffc ? this.ffc.el : this.el).nativeElement
                let position: LevitateOptions = this.editable
                    ? {
                        align: "left",
                        valign: "top",
                        connect: {
                            ref: targetEl,
                            align: "left",
                            valign: "bottom",
                            margin: { bottom: this.ffc ? 19 : 0 },
                        }
                    }
                    : {
                        align: "left",
                        valign: "top",
                        connect: {
                            ref: targetEl,
                            align: "left",
                            valign: "top",
                            margin: { left: -16, right: -16 },
                        }
                    }

                let options: DropdownLayerOptions = {
                    position: position,
                    backdrop: {
                        type: "empty",
                        hideOnClick: true
                    },
                    minWidth: targetEl.offsetWidth + (this.editable ? 0 : 32),
                    minHeight: this.editable ? 0 : targetEl.offsetHeight,
                    initialWidth: targetEl.offsetWidth + (this.editable ? 0 : 32),
                    initialHeight: this.editable ? 0 : targetEl.offsetHeight,
                    elevation: 10
                }
                this.ddLayer = this.layer.createFromComponent(
                    DropdownComponent,
                    new DropdownLayer(options),
                    null,
                    [
                        { provide: SelectionModel, useValue: this.selection },
                        { provide: DataStorage, useValue: this.storage },
                        { provide: DROPDOWN_ITEM_TPL, useValue: this.itemTpl }
                    ]) as any

                let s = this.ddLayer.output.subscribe(event => {
                    if (event.type === "hiding") {
                        this.opened = false
                        s.unsubscribe()
                    }
                })
            }
            this.ddLayer.show()
        } else if (this.ddLayer) {
            this.ddLayer.close()
            this.ddLayer = null
        }
    }

    protected _handleFocus(f: boolean) {
        super._handleFocus(f)

        if (this.input) {
            this.input.nativeElement.focus()
        }

        if (f) {
            if (this.focusOrigin !== "keyboard") {
                this.opened = true
            }
        } else {
            this.opened = false
        }
    }

    protected _onInput(event: Event): void {
        (this.inputStream as Subject<string>).next(this.input.nativeElement.value)
        this.opened = true
        this.inputState = "typing"
    }

    protected _querySuggestions = (text: string): void => {
        this.inputState = "querying"
        this.opened = true
        this.storage.filter.set({
            [this.displayField]: text
        } as any)
    }

    protected _watchInputStream(on: boolean) {
        if (on) {
            if (!this._iss && this.dataSource) {
                let ml = Number(this.minLength)
                this._iss = this.s.add(this.inputStream)
                    .pipe(
                        debounceTime(this.dataSource.async ? 1000 : 100),
                        filter(v => ml === 0 || (v && v.length >= ml))
                    )
                    .subscribe(this._querySuggestions)
            }
        } else if (this._iss) {
            this._iss.unsubscribe()
            delete this._iss
        }
    }

    @HostListener("keypress", ["$event"])
    protected _onKeypress(event: KeyboardEvent) {
        if (this._processKeypress(event.keyCode, event.shiftKey, event.ctrlKey, event.altKey)) {
            event.preventDefault()
            event.stopImmediatePropagation()
        }
    }

    @HostListener("keydown", ["$event"])
    protected _onKeydown(event: KeyboardEvent) {
        if (event.keyCode === ESCAPE) {
            event.preventDefault()
            event.stopImmediatePropagation()
        }
    }

    @HostListener("keyup", ["$event"])
    protected _onKeyup(event: KeyboardEvent) {
        this.lastKeyup = event.keyCode
        if (event.keyCode === ESCAPE) {
            event.preventDefault()
            event.stopImmediatePropagation()
        }
    }

    protected _resetTextInput(val: string = "") {
        if (this.input) {
            this.input.nativeElement.value = val
        }
    }

    protected _processKeypress(code: number, shift: boolean, ctrl: boolean, alt: boolean): boolean {
        switch (code) {
            case ESCAPE:
                this.opened = false
                return true

            case ENTER:
                if (this.ddLayer && this.ddLayer.component.instance.focusedModel) {
                    let fml = this.ddLayer.component.instance.focusedModel
                    this.selection.update({
                        [fml.id]: true
                    })
                }
                return true

            case UP_ARROW:
                this.opened = true
                if (this.ddLayer) {
                    this.ddLayer.component.instance.focusPrev()
                }
                return true

            case DOWN_ARROW:
                this.opened = true
                if (this.ddLayer) {
                    this.ddLayer.component.instance.focusNext()
                }
                return true

            case BACKSPACE:
                if (this.lastKeyup === code
                    && (!this.input
                        || !this.input.nativeElement.value
                        || this.input.nativeElement.value.length === 0)) {
                    if (this.selection.items.length > 0) {
                        this.selection.update({
                            [this.selection.items[this.selection.items.length - 1].id]: false
                        })
                    }
                    return true
                }

        }
        return false
    }

}
