import {
    Component, ContentChild, ContentChildren, TemplateRef, Inject, Optional, ElementRef, Renderer2, Input,
    ViewChild, HostBinding, AfterContentInit, AfterViewInit, ViewContainerRef, QueryList,
    ChangeDetectionStrategy, ChangeDetectorRef, Attribute, HostListener, Host, OnDestroy, Output, EventEmitter
} from "@angular/core"

import { coerceBooleanProperty } from "@angular/cdk/coercion"
import { FocusMonitor } from "@angular/cdk/a11y"
import { ESCAPE, UP_ARROW, DOWN_ARROW, ENTER, BACKSPACE } from "@angular/cdk/keycodes"
import { Observable, Subject, Subscription, Observer, forkJoin } from "rxjs"
import { debounceTime, distinctUntilChanged, filter, take, tap, map } from "rxjs/operators"

import { NzRange } from "../../../util"
import { DataSourceDirective, Model, PrimaryKey, Field, SelectionModel, SingleSelection } from "../../../data.module"
import { InputComponent, InputModel, INPUT_MODEL, FocusChangeEvent } from "../abstract"
import { LayerService, DropdownLayer, LayerFactoryDirective } from "../../../layer.module"
import { FormFieldComponent } from "../../field/form-field.component"
import { ListActionComponent, ListActionModel } from "../../../list.module"
import { AutocompleteComponent, AUTOCOMPLETE_ACTIONS, AUTOCOMPLETE_ITEM_TPL } from "../../../list.module"
import { Shortcuts, ShortcutService } from "../../../common.module"

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


export class ProvisionalModel extends Model {

}


export type InputState = "typing" | "querying";
export type SelectValue<T> = T | PrimaryKey | T[] | PrimaryKey[];
export type AutoTrigger = "all" | "query" | null;

@Component({
    selector: ".nz-select",
    templateUrl: "./select.template.pug",
    host: {
        "[attr.opened]": "opened ? '' : null",
        "[attr.disabled]": "disabled ? '' : null",
        "[attr.editable]": "editable ? '' : null"
    },
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: INPUT_MODEL
})
export class SelectComponent<T extends Model> extends InputComponent<SelectValue<T>> implements AfterContentInit, AfterViewInit, OnDestroy {
    @ContentChild("selected", { read: TemplateRef }) @Input() public readonly selectedTpl: SelectTemplateRef<T>
    @ContentChild("item", { read: TemplateRef }) @Input() public readonly itemTpl: SelectTemplateRef<T>
    @ContentChildren(ListActionComponent) @Input() public readonly actions: QueryList<ListActionComponent>

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

    public displayField: string
    public queryField: string

    @Input()
    public set opened(val: boolean) {
        val = coerceBooleanProperty(val)
        if (this._opened !== val) {
            this._opened = val
            this._closeShortcuts.enabled = val
            if (val && this.input && this.input.nativeElement) {
                this.model.focusMonitor.focusVia(this.input.nativeElement, this.model.focused)
            }
            this._updateDropDown()
            this._detectChanges();
            (this.openedChanges as EventEmitter<boolean>).emit(val)
        }
    }
    public get opened(): boolean { return !this.disabled && this._opened }
    protected _opened: boolean = false

    @Output("opened") public readonly openedChanges: Observable<boolean> = new EventEmitter<boolean>()

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

    @Input("freeSelect")
    public set freeSelect(val: boolean) {
        val = coerceBooleanProperty(val)
        if (this._freeSelect !== val) {
            this._freeSelect = val
            this._detectChanges()
        }
    }
    public get freeSelect(): boolean { return !this.disabled && this._freeSelect }
    protected _freeSelect: boolean = false

    @Input("disableInput")
    public set disabled(val: boolean) {
        val = coerceBooleanProperty(val)
        if (this.model.disabled !== val) {
            this.model.disabled = val
            this._updateDropDown()
            this._watchInputStream(!val && this.editable)
            this._detectChanges()
        }
    }
    public get disabled(): boolean { return !this.source.storage || this.model.disabled }

    @Input()
    @HostBinding("attr.tabindex")
    public set tabIndex(val: number) {
        if (this._tabIndex !== val) {
            this._tabIndex = val
        }
    }
    public get tabIndex(): number { return this.editable ? -1 : this._tabIndex }
    protected _tabIndex: number

    @Input()
    public set hideTrigger(val: boolean) {
        val = coerceBooleanProperty(val)
        if (this._hideTrigger !== val) {
            this._hideTrigger = val
            this._detectChanges()
        }
    }
    public get hideTrigger(): boolean { return this._hideTrigger }
    private _hideTrigger: boolean = false

    @Input()
    public set autoTrigger(val: AutoTrigger) {
        if (!val || val.length === 0) {
            val = "query"
        }
        if (this._autoTrigger !== val) {
            this._autoTrigger = val
            this._detectChanges()
        }
    }
    public get autoTrigger(): AutoTrigger { return this._autoTrigger }
    private _autoTrigger: AutoTrigger = null

    public set inputState(val: InputState) {
        if (this._inputState !== val) {
            this._inputState = val
            this._detectChanges()
        }
    }
    public get inputState() { return this._inputState }
    protected _inputState: InputState

    @Input()
    public set clearable(val: boolean) {
        val = coerceBooleanProperty(val)
        if (this._clearable !== val) {
            this._clearable = val
            this.cdr.markForCheck()
        }
    }
    public get clearable(): boolean { return this._clearable }
    private _clearable: boolean = false

    @Input("min-length") public minLength: number = 2

    public get selected(): T[] {
        return this.selection.items
    }

    protected inputStream: Observable<string> = new Subject()
    protected lastKeyup: number
    protected pendingValue: any
    // protected readonly chipSelection: SelectionModel = new SingleSelection()
    protected selectedBeforeOpen: T[]

    private _provisionalModel: T
    private _closeShortcuts: Shortcuts

    public constructor(
        @Inject(InputModel) model: InputModel<SelectValue<T>>,
        @Inject(ElementRef) public readonly el: ElementRef<HTMLElement>,
        @Inject(DataSourceDirective) @Host() public readonly source: DataSourceDirective<T>,
        @Inject(SelectionModel) @Optional() public readonly selection: SelectionModel<T>,
        @Inject(LayerService) protected readonly layer: LayerService,
        @Inject(FormFieldComponent) @Optional() protected readonly ffc: FormFieldComponent,
        @Inject(ChangeDetectorRef) protected cdr: ChangeDetectorRef,
        @Inject(ViewContainerRef) protected vcr: ViewContainerRef,
        @Inject(LayerFactoryDirective) @Optional() @Host() public readonly layerFactory: LayerFactoryDirective,
        @Inject(ShortcutService) protected readonly shortcutService: ShortcutService,
        @Attribute("displayField") displayField: string,
        @Attribute("valueField") public valueField: string,
        @Attribute("queryField") queryField: string,
        @Attribute("triggerIcon") public readonly triggerIcon: string) {
        super(model)

        this.monitorFocus(el.nativeElement, true)
        this.destruct.any(() => {
            this.cdr.detach()
            delete (this as any).source
            delete (this as any).selection
            delete (this as any).layer
            delete (this as any).ffc
            delete (this as any).cdr
            delete (this as any).vcr
            delete (this as any)._layerFactory
        })

        if (!selection) {
            this.selection = new SingleSelection()
        }

        this.selection.keyboard.alwaysAppend = this.selection.type === "multi"

        this.destruct.subscription(this.selection.changes).subscribe(selected => {
            if (this.selection.type === "single" &&
                selected[0] &&
                this.selection.getSelectOrigin(selected[0].pk) === "mouse") {
                this.opened = false
            }

            let vals = this.valueField
                ? selected.map(s => (s as any)[this.valueField])
                : selected

            if (this.selection.type === "single") {
                model.emitValue(vals[0])
            } else {
                model.emitValue(vals)
            }

            this._resetTextInput()
            if (!this.input && this.cdr) {
                this.cdr.detectChanges()
            }
        })

        this.destruct.subscription(this.model.focusChanges)
            .pipe(debounceTime(100))
            .subscribe(this._handleFocus.bind(this))

        this.displayField = displayField || "label"
        this.queryField = queryField || this.displayField

        if (!layerFactory) {
            this.layerFactory = layerFactory
                || LayerFactoryDirective.create("left top", "left bottom", this.layer, this.vcr, el)
            this.layerFactory.nzLayerFactory = AutocompleteComponent
        }

        this.selection.keyboard.connect(el.nativeElement)

        this._closeShortcuts = this.destruct.disposable(this.shortcutService.create(this.el.nativeElement, {
            "select.close": {
                shortcut: "escape, back", handler: () => {
                    this.opened = false
                }
            }
        }))
        this._closeShortcuts.enabled = false

        // this._backButton = this.destruct.disposable(this.keyEvent.newWatcher(SpecialKey.BackButton, () => {
        //     if (this.selectedBeforeOpen) {
        //         let bso = this.selectedBeforeOpen
        //         delete this.selectedBeforeOpen
        //         this.selection.items = bso
        //     }
        //     this.opened = false
        //     return true
        // }))
    }

    public reset() {
        this.selection.items = []
        if (this.input) {
            this.input.nativeElement.value = ""
            this.opened = false
            this._updateFilter(null)
        }
    }

    public toggle() {
        this.opened = !this.opened
        this._detectChanges()
    }

    public getDisplayValue(model: T): string {
        let parts = (this.displayField || "").split(".")
        let obj = (model as any)

        for (const p of parts) {
            obj = obj ? obj[p] : ""
        }

        return obj || ""
    }

    protected _renderValue(obj: SelectValue<T>): void {
        if (!this.source || !this.source.storage) {
            this.pendingValue = obj
            return
        }

        const { ids, request, models } = this.coerceValue(obj)

        if (request.length) {
            this.getModels(request).pipe(take(1)).subscribe(result => {
                this.selection.items = models.concat(result)
            })
        } else {
            this.selection.items = models
        }
    }

    protected applyPendingValue() {
        if (this.source.storage) {
            if ("pendingValue" in this) {
                this._renderValue(this.pendingValue)
                delete this.pendingValue
            }
        }
    }

    protected coerceValue(value: SelectValue<T>): { ids: PrimaryKey[], request: PrimaryKey[], models: T[] } {
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

        for (let item of value as Array<T | PrimaryKey>) {
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
                ids.push(item.pk)
            }
        }

        return { ids, request, models }
    }

    protected getModels(ids: PrimaryKey[]): Observable<T[]> {
        let s: Array<Observable<T>> = []

        if (this.source.storage) {
            for (let i = 0, l = ids.length; i < l; i++) {
                s.push(this.source.get(ids[i]))
            }
        }

        return forkJoin(...s).pipe(map(result => result.filter((v: T) => !!v)))
    }

    public ngAfterContentInit() {
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
            let targetAnchor = this.layerFactory.targetAnchor

            if (!targetAnchor.targetEl) {
                targetAnchor.targetEl = (this.ffc ? this.ffc.el : this.el)
                if (this.editable) {
                    if (!targetAnchor.nzTargetAnchor) {
                        targetAnchor.nzTargetAnchor = "left bottom"
                    }
                    if (!targetAnchor.margin) {
                        targetAnchor.margin = { bottom: this.ffc ? -19 : 0 }
                    }
                } else {
                    if (!targetAnchor.nzTargetAnchor) {
                        targetAnchor.nzTargetAnchor = "left bottom"
                    }
                    if (!targetAnchor.margin) {
                        targetAnchor.margin = { bottom: this.ffc ? -19 : 0 }
                    }
                }
            }

            const targetEl = targetAnchor.targetEl.nativeElement
            let layerRef = this.layerFactory.show(
                new DropdownLayer({
                    backdrop: {
                        type: "empty",
                        crop: targetEl,
                        hideOnClick: true
                    },
                    minWidth: targetEl.offsetWidth,
                    minHeight: this.editable ? 0 : targetEl.offsetHeight,
                    initialWidth: targetEl.offsetWidth,
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

            const outletEl = layerRef.outlet.nativeElement
            this.monitorFocus(outletEl, true)
            this._closeShortcuts.watch(outletEl)

            let s = layerRef.subscribe((event) => {
                if (event.type === "hiding") {
                    this.model.focusMonitor.stopMonitoring(outletEl)
                    this._closeShortcuts.unwatch(outletEl)
                    this.opened = false
                    s.unsubscribe()
                }
            })
        } else {
            delete this.selectedBeforeOpen
            this.layerFactory.hide()
        }
    }

    protected _handleFocus(event: FocusChangeEvent) {
        const focused = event.current

        if (focused) {
            if (this.input) {
                this.model.focusMonitor.focusVia(this.input.nativeElement, focused)
            } else {
                this.model.focusMonitor.focusVia(this.el.nativeElement, focused)
            }
        } else {
            this._resetTextInput()
            this.opened = false
        }
    }

    protected _onInput(event: Event): void {
        const value = this.input.nativeElement.value;
        (this.inputStream as Subject<string>).next(value)
        this.inputState = "typing"
    }

    protected _querySuggestions = (text: string): void => {
        const emptyQuery = !text || text.length === 0
        this.inputState = "querying"
        this.opened = true
        this._updateFilter(text)
    }

    protected _watchInputStream(on: boolean) {
        if (on) {
            if (!this._iss && this.source.storage) {
                let ml = this.source.async ? Number(this.minLength) : 0
                this._iss = this.destruct.subscription(this.inputStream)
                    .pipe(
                        tap(v => {
                            if (!v || !v.length) {
                                if (this.selection.type === "single") {
                                    this.selection.clear()
                                }
                            }
                        }),
                        debounceTime(this.source.async ? 400 : 50),
                        filter(v => ml === 0 || !v || v.length === 0 || (v && v.length >= ml))
                    )
                    .subscribe(this._querySuggestions)
            }
        } else if (this._iss) {
            this._iss.unsubscribe()
            delete this._iss
        }
    }

    @HostListener("keydown", ["$event"])
    protected _onKeydown(event: KeyboardEvent) {
        if (this._processKeypress(event.keyCode, event.shiftKey, event.ctrlKey, event.altKey)) {
            event.preventDefault()
            event.stopImmediatePropagation()
        }
    }

    @HostListener("keyup", ["$event"])
    protected _onKeyup(event: KeyboardEvent) {
        this.lastKeyup = event.keyCode
    }

    @HostListener("tap", ["$event"])
    protected _onTriggerClick(event: MouseEvent) {
        if (event.defaultPrevented) {
            return
        }
        event.preventDefault()

        if (this.opened) {
            this.opened = false
        } else {
            if (this.input) {
                this.input.nativeElement.focus()
            }

            this.inputState = "querying"
            this.opened = true
            this._updateFilter(null)
        }
    }

    protected _clearValue(event: Event) {
        if (event.defaultPrevented) {
            return
        }
        event.preventDefault()
        this.value = null
    }

    // @HostListener("click")
    // protected _onClick() {
    //     if (!this.source.async || !this.editable) {
    //         this.opened = true
    //     }
    // }

    // protected _applySelected() {
    //     let value = this.valueField
    //         ? this.selected.map(item => (item as any)[this.valueField])
    //         : this.selected.slice(0)

    //     if (this.selection.type === "single") {
    //         this.model.emitValue(value[0])
    //     } else {
    //         this.model.emitValue(value)
    //     }

    //     // this.writeValue(this.value)
    //     this._resetTextInput()
    // }

    protected _resetTextInput() {
        if (!this.input || !this.selection) {
            return
        }

        let value = ""
        const selected = this.selection.items

        if (this.selection.type === "single") {
            if (selected[0]) {
                if (selected[0] instanceof ListActionModel) {
                    value = (selected[0] as any as ListActionModel).action.text || "Missing text options"
                } else {
                    value = this.getDisplayValue(selected[0])
                }
            } else if (this.freeSelect) {
                let inputValue = this.input.nativeElement.value
                if (inputValue && inputValue.length) {
                    if (!this._provisionalModel) {
                        this._provisionalModel = new ProvisionalModel({ id: Math.random().toString(36) }) as T
                    }
                    (this._provisionalModel as any)[this.valueField] = { $new: inputValue };
                    (this._provisionalModel as any)[this.displayField] = inputValue;
                    this.selection.items = [this._provisionalModel]
                    value = inputValue
                } else {
                    // if (this._provisionalModel) {
                    //     delete this._provisionalModel
                    // }

                }

                // throw new Error("TODO: implement canCreate")
            }
        } else if (this.freeSelect) {
            throw new Error("TODO: implement canCreate")
        }

        this.input.nativeElement.value = value
        this._detectChanges()
    }

    protected _processKeypress(code: number, shift: boolean, ctrl: boolean, alt: boolean): boolean {
        switch (code) {
            // case ESCAPE:
            //     if (this.selectedBeforeOpen) {
            //         let bso = this.selectedBeforeOpen
            //         delete this.selectedBeforeOpen
            //         this.selection.items = bso
            //     }
            //     this.opened = false
            //     return true

            case UP_ARROW:
            case DOWN_ARROW:
                this.opened = true
                return false

            case ENTER:
                if (this.selection.type === "single") {
                    this.opened = false
                }
                return false

            case BACKSPACE:
                if (this.lastKeyup === code
                    && (!this.input
                        || !this.input.nativeElement.value
                        || this.input.nativeElement.value.length === 0)) {
                    if (this.selection.items.length > 0) {
                        this.selection.update({
                            [this.selection.items[this.selection.items.length - 1].pk]: null
                        })
                    }
                    return true
                }

        }
        return false
    }

    private _x: string = Math.random().toString(36)
    protected _detectChanges() {
        this.cdr && this.cdr.detectChanges()
    }

    public ngOnDestroy() {
        this.destruct.run()
    }

    private _updateFilter(qv: string | null) {
        let filter = (this.source.filter || {}) as any
        if (!qv || qv.length === 0) {
            delete filter[this.queryField]
        } else {
            filter[this.queryField] = { contains: qv }
        }
        this.source.filter = filter
    }
}
