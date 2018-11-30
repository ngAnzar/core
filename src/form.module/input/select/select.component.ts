import {
    Component, ContentChild, ContentChildren, TemplateRef, Inject, Optional, ElementRef, Renderer2, Input,
    ViewChild, ViewChildren, AfterContentInit, AfterViewInit, ViewContainerRef, QueryList,
    ChangeDetectionStrategy, ChangeDetectorRef, Attribute, HostListener, Host, OnDestroy
} from "@angular/core"
import { NgControl, NgModel } from "@angular/forms"
import { coerceBooleanProperty } from "@angular/cdk/coercion"
import { FocusMonitor, FocusOrigin } from "@angular/cdk/a11y"
import { ESCAPE, UP_ARROW, DOWN_ARROW, ENTER, BACKSPACE } from "@angular/cdk/keycodes"
import { Observable, Subject, Subscription, Observer, forkJoin } from "rxjs"
import { debounceTime, distinctUntilChanged, filter } from "rxjs/operators"

import { NzRange, Destruct } from "../../../util"
import { DataSourceDirective, Model, ID, Field, SelectionModel, SingleSelection } from "../../../data.module"
import { InputComponent, INPUT_VALUE_ACCESSOR } from "../abstract"
import { LayerService, DropdownLayer, LayerFactoryDirective } from "../../../layer.module"
import { FormFieldComponent } from "../../field/form-field.component"
import { ListActionComponent, ListActionModel } from "../../../list.module"
import { AutocompleteComponent, AUTOCOMPLETE_ACTIONS, AUTOCOMPLETE_ITEM_TPL } from "../../../list.module"

// import { ChipComponent } from "./chip.component"


export class SelectTplContext<T> {
    $implicit: T
}

export type SelectTemplateRef<T> = TemplateRef<SelectTplContext<T>>


export class Match extends Model {
    @Field() public offset: number
    @Field() public length: number

    public get range(): NzRange {
        return new NzRange(this.offset, this.offset + this.length)
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
        // LayerService,
        { provide: InputComponent, useExisting: SelectComponent },
        INPUT_VALUE_ACCESSOR
    ]
})
export class SelectComponent<T extends Model> extends InputComponent<SelectValue<T>> implements AfterContentInit, AfterViewInit, OnDestroy {
    public get type(): string { return "select" }

    @ContentChild("selected", { read: TemplateRef }) public readonly selectedTpl: SelectTemplateRef<T>
    @ContentChild("item", { read: TemplateRef }) public readonly itemTpl: SelectTemplateRef<T>
    @ContentChildren(ListActionComponent) public readonly actions: QueryList<ListActionComponent>

    @ViewChild("hidden", { read: ElementRef }) protected readonly hidden: ElementRef<HTMLInputElement>
    // @ViewChild("input", { read: ElementRef }) protected readonly input: ElementRef<HTMLInputElement>
    @ViewChild("input", { read: ElementRef })
    protected set input(val: ElementRef<HTMLInputElement>) {
        if (!this._input || !val || val.nativeElement !== this._input.nativeElement) {
            this._input = val
            if (val) {
                this._resetTextInput()
            }
        }
    }
    protected get input(): ElementRef<HTMLInputElement> {
        return this._input
    }
    protected _input: ElementRef<HTMLInputElement>

    @ViewChild("default_selected_single", { read: TemplateRef }) protected readonly defaultSelectedSingleTpl: SelectTemplateRef<T>
    @ViewChild("default_selected_multi", { read: TemplateRef }) protected readonly defaultSelectedMultiTpl: SelectTemplateRef<T>
    @ViewChild("default_item", { read: TemplateRef }) protected readonly defaultItemTpl: SelectTemplateRef<T>
    @ViewChild("dropdown", { read: TemplateRef }) protected readonly dropdownTpl: SelectTemplateRef<T>
    // @ViewChild("chipSelection", { read: SelectionModel }) protected readonly chipSelection: SelectionModel

    // @Input("data-source") //public readonly dataSource: DataSource<T>
    // public set dataSource(val: DataSource<T>) {
    //     if (this._dataSource !== val) {
    //         this._dataSource = val
    //         this.storage = val ? new DataStorage(val) : null
    //         this._watchInputStream(this.editable)
    //         this._detectChanges()
    //     }
    // }
    // public get dataSource(): DataSource<T> { return this._dataSource }
    // protected _dataSource: DataSource<T>

    // public set storage(val: DataStorage<T>) {
    //     if (this._storage !== val) {
    //         this._storage = val
    //         this.applyPendingValue()
    //         this._detectChanges()
    //     }
    // }
    // public get storage(): DataStorage<T> { return this._storage }
    // protected _storage: DataStorage<T>

    // @Input()
    // public set filter(val: any) { this.storage.filter.set(val) }
    // public get filter(): any { return this.storage.filter.get() }

    // @Input()
    // public set sorter(val: any) { this.storage.sorter.set(val) }
    // public get sorter(): any { return this.storage.sorter.get() }

    public readonly displayField: string
    public readonly queryField: string

    @Input()
    public set opened(val: boolean) {
        val = coerceBooleanProperty(val)
        if (this._opened !== val) {
            this._opened = val
            this._updateDropDown()
            this._detectChanges()
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
            this._detectChanges()
        }
    }
    public get editable(): boolean { return this._editable }
    protected _editable: boolean = false
    protected _iss: Subscription

    @Input("can-create")
    public set canCreate(val: boolean) {
        val = coerceBooleanProperty(val)
        if (this._canCreate !== val) {
            this._canCreate = val
            this._detectChanges()
        }
    }
    public get canCreate(): boolean { return !this.disabled && this._canCreate }
    protected _canCreate: boolean = false

    @Input()
    public set disabled(val: boolean) {
        val = coerceBooleanProperty(val)
        if (this._disabled !== val) {
            this._disabled = val
            this._updateDropDown()
            this._watchInputStream(!val && this.editable)
            this._detectChanges()
        }
    }
    public get disabled(): boolean { return !this.source.storage || this._disabled }
    protected _disabled: boolean = false

    public set inputState(val: InputState) {
        if (this._inputState !== val) {
            this._inputState = val
            this._detectChanges()
        }
    }
    public get inputState() { return this._inputState }
    protected _inputState: InputState

    @Input("min-length") public minLength: number = 2

    public get selected(): T[] {
        return this.selection.items
    }

    // public get value(): any { return super.value as any }
    // public set value(val: any) {
    //     super.value = val
    //     this.writeValue(val)
    // }

    public readonly destruct = new Destruct(() => {
        this.cdr.detach()
        delete (this as any).source
        delete (this as any).selection
        delete (this as any).layer
        delete (this as any).ffc
        delete (this as any).cdr
        delete (this as any).vcr
        delete (this as any)._focusMonitor
        delete (this as any)._layerFactory
    })

    // protected acLayer: ComponentLayerRef<AutocompleteComponent<T>>
    protected focusOrigin: FocusOrigin
    protected inputStream: Observable<string> = new Subject()
    protected lastKeyup: number
    protected pendingValue: any
    protected readonly chipSelection: SelectionModel = new SingleSelection()
    protected selectedBeforeOpen: T[]

    public constructor(
        @Inject(NgControl) @Optional() ngControl: NgControl,
        @Inject(NgModel) @Optional() ngModel: NgModel,
        @Inject(ElementRef) el: ElementRef,
        @Inject(DataSourceDirective) @Host() public readonly source: DataSourceDirective<T>,
        @Inject(SelectionModel) @Optional() public readonly selection: SelectionModel<T>,
        @Inject(LayerService) protected readonly layer: LayerService,
        @Inject(FormFieldComponent) @Optional() protected readonly ffc: FormFieldComponent,
        @Inject(ChangeDetectorRef) protected cdr: ChangeDetectorRef,
        @Inject(ViewContainerRef) protected vcr: ViewContainerRef,
        @Inject(FocusMonitor) protected _focusMonitor: FocusMonitor,
        @Inject(LayerFactoryDirective) @Optional() @Host() protected _layerFactory: LayerFactoryDirective,
        @Attribute("display-field") displayField: string,
        @Attribute("value-field") protected readonly valueField: string,
        @Attribute("query-field") queryField: string,
        @Attribute("trigger-icon") public readonly triggerIcon: string) {
        super(ngControl, ngModel, el)

        if (!selection) {
            this.selection = new SingleSelection()
        }

        this.destruct.subscription(this.selection.changes).subscribe(selected => {
            // console.log(this.selection.type, selected[0] ? this.selection.getSelectOrigin(selected[0].id) : null)
            if (this.selection.type === "single" &&
                selected[0] &&
                this.selection.getSelectOrigin(selected[0].id) === "mouse") {
                this.opened = false
            }

            this._resetTextInput()
        })

        this.displayField = displayField || "label"
        this.queryField = queryField || this.displayField

        this.destruct.subscription(this._focusMonitor.monitor(el.nativeElement, true)).subscribe(origin => {
            if (this.focusOrigin !== origin) {
                this.focusOrigin = origin
                this._handleFocus(origin !== null)
            }
        })

        if (!_layerFactory) {
            this._layerFactory = _layerFactory
                || LayerFactoryDirective.create("left top", "left bottom", this.layer, this.vcr, el)
            this._layerFactory.nzLayerFactory = AutocompleteComponent
        }

        this.selection.keyboard.connect(el.nativeElement)
    }

    public toggle() {
        this.opened = !this.opened
        this._detectChanges()
    }

    public writeValue(obj: SelectValue<T>): void {
        if (!this.source.storage) {
            this.pendingValue = obj
            return
        }

        const { ids, request, models } = this.coerceValue(obj)

        if (request.length) {
            this.getModels(request).subscribe(result => {
                this.selection.items = models.concat(result)
            })
        } else {
            this.selection.items = models
        }

        if (this.hidden) {
            this.hidden.nativeElement.value = ids.join(",")
        }
    }

    protected applyPendingValue() {
        if (this.source.storage && this.hidden) {
            if ("pendingValue" in this) {
                this.writeValue(this.pendingValue)
                delete this.pendingValue
            }
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
            } else if (Model.isModel(item)) {
                models.push(item)
                ids.push(item.id)
            }
        }

        return { ids, request, models }
    }

    protected getModels(ids: ID[]): Observable<T[]> {
        return Observable.create((observer: Observer<T[]>) => {
            let s = []

            if (this.source.storage) {
                for (let i = 0, l = ids.length; i < l; i++) {
                    s.push(this.source.get(ids[i]))
                }
            }

            const merged = forkJoin(...s).subscribe(observer)
            return () => {
                merged.unsubscribe()
            }
        })
    }

    public ngAfterContentInit() {
        // (this as any).storage = new DataStorage(this.dataSource)
        this.applyPendingValue()
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

        this.applyPendingValue()
        this._detectChanges()
    }

    protected _updateDropDown() {
        if (this.opened) {
            this.selectedBeforeOpen = this.selected.slice(0)
            let targetEl = (this._layerFactory.targetEl = (this.ffc ? this.ffc.el : this.el)).nativeElement

            if (this.editable) {
                this._layerFactory.targetAnchor.nzTargetAnchor = "left bottom"
                this._layerFactory.targetAnchor.margin = { bottom: this.ffc ? -19 : 0 }
            } else {
                this._layerFactory.targetAnchor.nzTargetAnchor = "left top"
                this._layerFactory.targetAnchor.margin = { left: 16, right: 16 }
            }

            let layerRef = this._layerFactory.show(
                new DropdownLayer({
                    backdrop: {
                        type: "empty",
                        crop: targetEl,
                        hideOnClick: true
                    },
                    minWidth: targetEl.offsetWidth + (this.editable ? 0 : 32),
                    minHeight: this.editable ? 0 : targetEl.offsetHeight,
                    initialWidth: targetEl.offsetWidth + (this.editable ? 0 : 32),
                    initialHeight: this.editable ? 0 : targetEl.offsetHeight,
                    elevation: 10
                }),
                {
                    $implicit: this
                },
                [
                    { provide: SelectionModel, useValue: this.selection },
                    { provide: DataSourceDirective, useValue: this.source },
                    { provide: AUTOCOMPLETE_ITEM_TPL, useValue: this.itemTpl },
                    { provide: AUTOCOMPLETE_ACTIONS, useValue: this.actions },
                ]
            )

            let s = layerRef.subscribe((event) => {
                if (event.type === "hiding") {
                    this.opened = false
                    s.unsubscribe()
                }
            })
        } else {
            delete this.selectedBeforeOpen
            this._layerFactory.hide()
            this._applySelected()
        }
    }

    protected _handleFocus(f: boolean) {
        const skip = this.focused === f
        super._handleFocus(f)

        if (skip) {
            return
        }

        if (this.input && f) {
            this.input.nativeElement.focus()
        }

        if (f) {
            if (this.focusOrigin === "mouse" && (!this.source.async || !this.editable)) {
                this.opened = true
            }
        } else {
            this.opened = false
            this._resetTextInput()
        }
    }

    protected _onInput(event: Event): void {
        (this.inputStream as Subject<string>).next(this.input.nativeElement.value)
        // this.opened = true
        this.inputState = "typing"
    }

    protected _querySuggestions = (text: string): void => {
        // if (!text || text.length === 0) {
        //     console.log("reset dd")
        // }

        this.inputState = "querying"
        this.source.filter = {
            [this.queryField]: this.source.async ? text : { contains: text }
        } as any

        this.opened = true
    }

    protected _watchInputStream(on: boolean) {
        if (on) {
            if (!this._iss && this.source.storage) {
                let ml = this.source.async ? Number(this.minLength) : 0
                this._iss = this.destruct.subscription(this.inputStream)
                    .pipe(
                        debounceTime(this.source.async ? 400 : 50),
                        filter(v => ml === 0 || (v && v.length >= ml))
                    )
                    .subscribe(this._querySuggestions)
            }
        } else if (this._iss) {
            this._iss.unsubscribe()
            delete this._iss
        }
    }

    // @HostListener("keypress", ["$event"])
    // protected _onKeypress(event: KeyboardEvent) {
    //     console.log({ type: event.type, keyCode: event.keyCode, shiftKey: event.shiftKey, ctrlKey: event.ctrlKey, altKey: event.altKey })
    //     if (this._processKeypress(event.keyCode, event.shiftKey, event.ctrlKey, event.altKey)) {
    //         event.preventDefault()
    //         event.stopImmediatePropagation()
    //     }
    // }

    @HostListener("keydown", ["$event"])
    protected _onKeydown(event: KeyboardEvent) {
        // console.log({ type: event.type, keyCode: event.keyCode, shiftKey: event.shiftKey, ctrlKey: event.ctrlKey, altKey: event.altKey })
        if (this._processKeypress(event.keyCode, event.shiftKey, event.ctrlKey, event.altKey)) {
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

    protected _onTriggerClick(event: MouseEvent) {
        this.inputState = "querying"
        this.opened = true
        let filter: any = this.source.filter
        delete filter[this.queryField]
        this.source.filter = filter
    }

    @HostListener("click")
    protected _onClick() {
        this.opened = true
    }

    protected _applySelected() {
        let value = this.valueField
            ? this.selected.map(item => (item as any)[this.valueField])
            : this.selected.slice(0)

        if (this.selection.type === "single") {
            this.value = value[0]
        } else {
            this.value = value
        }

        // this.writeValue(this.value)
        this._resetTextInput()
    }

    protected _resetTextInput() {
        if (!this.input) {
            return
        }

        let value = ""
        const selected = this.selection.items

        if (this.selection.type === "single") {
            if (selected[0]) {
                if (selected[0] instanceof ListActionModel) {
                    value = (selected[0] as any as ListActionModel).action.text || "Missing text options"
                } else {
                    value = (selected[0] as any)[this.displayField] || ""
                }
            } else if (this.canCreate) {
                throw new Error("TODO: implement canCreate")
            }
        } else if (this.canCreate) {
            throw new Error("TODO: implement canCreate")
        }

        this.input.nativeElement.value = value
        this._detectChanges()
    }

    protected _processKeypress(code: number, shift: boolean, ctrl: boolean, alt: boolean): boolean {
        switch (code) {
            case ESCAPE:
                if (this.selectedBeforeOpen) {
                    let bso = this.selectedBeforeOpen
                    delete this.selectedBeforeOpen
                    this.selection.items = bso
                }
                this.opened = false
                return true

            case UP_ARROW:
            case DOWN_ARROW:
                this.opened = true
                return false

            case ENTER:
                this.opened = false
                return true

            case BACKSPACE:
                if (this.lastKeyup === code
                    && (!this.input
                        || !this.input.nativeElement.value
                        || this.input.nativeElement.value.length === 0)) {
                    if (this.selection.items.length > 0) {
                        this.selection.update({
                            [this.selection.items[this.selection.items.length - 1].id]: null
                        })
                    }
                    return true
                }

        }
        return false
    }

    private _x: string = Math.random().toString(36)
    protected _detectChanges() {
        this.cdr && this.cdr.markForCheck()
    }

    public ngOnDestroy() {
        this.destruct.run()
    }
}
