import { FocusOrigin } from "@angular/cdk/a11y"
import { coerceBooleanProperty } from "@angular/cdk/coercion"
import { BACKSPACE, DOWN_ARROW, UP_ARROW } from "@angular/cdk/keycodes"
import {
    AfterContentInit,
    AfterViewInit,
    Attribute,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ContentChild,
    ContentChildren,
    ElementRef,
    EventEmitter,
    Host,
    HostBinding,
    HostListener,
    Inject,
    Input,
    OnDestroy,
    OnInit,
    Optional,
    Output,
    QueryList,
    Self,
    TemplateRef,
    ViewChild,
    ViewContainerRef
} from "@angular/core"

import { forkJoin, merge, Observable, Observer, of, Subject, Subscription, timer } from "rxjs"
import {
    catchError,
    debounce,
    debounceTime,
    distinctUntilChanged,
    filter,
    map,
    shareReplay,
    startWith,
    switchMap,
    take,
    tap
} from "rxjs/operators"

import { Shortcuts, ShortcutService } from "../../../common.module"
import {
    DataSourceDirective,
    Field,
    Model,
    PrimaryKey,
    SelectionModel,
    SingleSelection,
    StaticSource
} from "../../../data.module"
import { ComponentLayerRef, DropdownLayer, LayerFactoryDirective, LayerService } from "../../../layer.module"
import { ListActionComponent, ListActionModel } from "../../../list.module"
import {
    AUTOCOMPLETE_ACTIONS,
    AUTOCOMPLETE_ITEM_FACTORY,
    AUTOCOMPLETE_ITEM_FACTORY_ALWAYS_VISIBLE,
    AUTOCOMPLETE_ITEM_TPL,
    AutocompleteComponent
} from "../../../list.module"
import { __zone_symbol__, getPath, NzRange, setPath } from "../../../util"
import { parseMargin } from "../../../util"
import { FormFieldComponent } from "../../field/form-field.component"
import { INPUT_MODEL, INPUT_MODEL_VALUE_CMP, InputComponent, InputModel } from "../abstract"
import { AutosizePropertiesDirective } from "../text/autosize.directive"

const CLEAR_TIMEOUT: "clearTimeout" = __zone_symbol__("clearTimeout")
const SET_TIMEOUT: "setTimeout" = __zone_symbol__("setTimeout")

export type ShowNewItemOption = "always" | "not-found"

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
    @Field({ primary: true }) public _id: string
}

export type InputState = "typing" | "querying"
export type SelectValue<T> = T | PrimaryKey | T[] | PrimaryKey[]
export type AutoTrigger = "all" | "query" | null

function cmpValue(a: any, b: any) {
    if (Array.isArray(a) || Array.isArray(b)) {
        if (Array.isArray(a) && Array.isArray(b)) {
            const diff1 = a.filter(v => !b.includes(v))
            const diff2 = b.filter(v => !a.includes(v))
            return diff1.length === 0 && diff2.length === 0
        } else {
            return false
        }
    } else {
        return a === b
    }
}

@Component({
    selector: ".nz-select",
    templateUrl: "./select.template.pug",
    host: {
        "[attr.opened]": "opened ? '' : null",
        "[attr.disabled]": "disabled ? '' : null",
        "[attr.editable]": "editable ? '' : null"
    },
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [...INPUT_MODEL, { provide: INPUT_MODEL_VALUE_CMP, useValue: cmpValue }]
})
export class SelectComponent<T extends Model>
    extends InputComponent<SelectValue<T>>
    implements AfterContentInit, AfterViewInit, OnDestroy, OnInit
{
    @ContentChild("selected", { read: TemplateRef, static: true }) public _selectedTpl: SelectTemplateRef<T>
    @ContentChild("item", { read: TemplateRef, static: true }) public _itemTpl: SelectTemplateRef<T>
    @ContentChildren(ListActionComponent) public _actions: QueryList<ListActionComponent>

    @ViewChild("default_selected_single", { read: TemplateRef, static: true })
    protected readonly defaultSelectedSingleTpl: SelectTemplateRef<T>
    @ViewChild("default_selected_multi", { read: TemplateRef, static: true })
    protected readonly defaultSelectedMultiTpl: SelectTemplateRef<T>
    @ViewChild("default_item", { read: TemplateRef, static: true })
    protected readonly defaultItemTpl: SelectTemplateRef<T>
    @ViewChild("dropdown", { read: TemplateRef, static: true }) protected readonly dropdownTpl: SelectTemplateRef<T>

    @Input() public displayField: string = "label"
    @Input() public valueField: string
    @Input() public queryField: string

    @Input()
    public set selectedTpl(val: SelectTemplateRef<T>) {
        this._selectedTpl = val
    }
    public get selectedTpl() {
        if (this._selectedTpl) {
            return this._selectedTpl
        } else if (this.selection.type === "multi") {
            return this.defaultSelectedMultiTpl
        } else {
            return this.defaultSelectedSingleTpl
        }
    }

    @Input()
    public set itemTpl(val: SelectTemplateRef<T>) {
        this._itemTpl = val
    }
    public get itemTpl() {
        return this._itemTpl || this.defaultItemTpl
    }

    @Input() public actions: QueryList<ListActionComponent>

    // @ViewChild("input", { read: ElementRef }) protected readonly input: ElementRef<HTMLInputElement>
    @ViewChild("input", { read: ElementRef, static: false })
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

    @Input()
    public set opened(val: boolean) {
        val = coerceBooleanProperty(val)
        if (this._opened !== val) {
            this._opened = val
            this._closeShortcuts.enabled = val
            if (val && this.input && this.input.nativeElement) {
                this.model.focusGroup.focusVia(this.input.nativeElement, this.model.focused)
            }
            this.cdr.markForCheck()
            ;(this.openedChanges as EventEmitter<boolean>).emit(val)
        }
    }
    public get opened(): boolean {
        return !this.disabled && this._opened
    }
    protected _opened: boolean = false

    @Output("opened") public readonly openedChanges: Observable<boolean> = new EventEmitter<boolean>()
    @Output("selectionChange") public readonly selectionChanges: Observable<T[]> = new EventEmitter<T[]>()

    @Input()
    public set editable(val: boolean) {
        val = coerceBooleanProperty(val)
        if (this._editable !== val) {
            this._editable = val
            this.cdr.markForCheck()
        }
    }
    public get editable(): boolean {
        return this._editable && !this.readonly
    }
    protected _editable: boolean = false
    protected _iss: Subscription

    @Input("freeSelect")
    public set freeSelect(val: boolean) {
        val = coerceBooleanProperty(val)
        if (this._freeSelect !== val) {
            this._freeSelect = val
            this.cdr.markForCheck()
        }
    }
    public get freeSelect(): boolean {
        return !this.disabled && this._freeSelect
    }
    protected _freeSelect: boolean = false

    @Input("showNewItemOption")
    public showNewItemOption: ShowNewItemOption = "not-found"

    @Input("disableInput")
    public set disabled(val: boolean) {
        this.model.disabled = coerceBooleanProperty(val)
    }
    public get disabled(): boolean {
        return !this.source || !this.source.storage || this.model.disabled
    }

    @Input()
    @HostBinding("attr.tabindex")
    public set tabIndex(val: number) {
        if (this._tabIndex !== val) {
            this._tabIndex = val
        }
    }
    public get tabIndex(): number {
        return this.editable ? -1 : this._tabIndex
    }

    @Input()
    public set hideTrigger(val: boolean) {
        val = coerceBooleanProperty(val)
        if (this._hideTrigger !== val) {
            this._hideTrigger = val
            this.cdr.markForCheck()
        }
    }
    public get hideTrigger(): boolean {
        return this.readonly || this._hideTrigger
    }
    private _hideTrigger: boolean = false

    @Input()
    public set autoTrigger(val: boolean) {
        val = coerceBooleanProperty(val)
        if (this._autoTrigger !== val) {
            this._autoTrigger = val
            this.cdr.markForCheck()
        }
    }
    public get autoTrigger(): boolean {
        return !this.readonly && this._autoTrigger
    }
    private _autoTrigger: boolean = false

    public set inputState(val: InputState) {
        if (this._inputState !== val) {
            this._inputState = val
            this.cdr.markForCheck()
        }
    }
    public get inputState() {
        return this._inputState
    }
    protected _inputState: InputState

    @Input()
    public set clearable(val: boolean) {
        val = coerceBooleanProperty(val)
        if (this._clearable !== val) {
            this._clearable = val
            this.cdr.markForCheck()
        }
    }
    public get clearable(): boolean {
        return this._clearable && !this.readonly
    }
    private _clearable: boolean = false

    @Input()
    public set pinList(val: boolean) {
        this._pinList = coerceBooleanProperty(val)
    }
    public get pinList(): boolean {
        return this._pinList
    }
    private _pinList: boolean = false

    @Input("min-length") public minLength: number = 2

    public get selected(): T[] {
        return this.selection.items
    }

    protected queryAllowed: boolean = true

    // text input value, when editable
    protected input$ = this.destruct.subject(new Subject<string>())

    protected query$ = this.input$.pipe(
        filter(v => this.editable && !this.disabled),
        distinctUntilChanged(),
        tap(value => {
            if (this.selection.type === "single" && (!value || !value.length)) {
                this.selection.clear()
            }
        }),
        debounce(() => timer(this.source.async ? 300 : 0)),
        shareReplay(1)
    )

    // pressed printable keycodes when not editable
    protected search$ = this.destruct.subject(new Subject<string>())

    protected focusItem$ = this.search$.pipe(
        filter(() => !this.editable && !this.disabled),
        collectTime(1000),
        map(value => value.join("")),
        switchMap(value => {
            if (this.source.async) {
                return this.source.storage.items.pipe(map(items => [value, items] as [string, T[]]))
            } else {
                return of([value, (this.source.storage.source as StaticSource<any>).data] as [string, T[]])
            }
        }),
        map(([value, items]) => {
            const focused = this.selection.focused
            const start = focused ? focused.selectionIndex : 0
            for (let i = start, l = items.length; i < l; i++) {
                const item = items[i]
                const searchIn = this.getDisplayValue(item)
                if (searchIn && searchIn.toLowerCase().startsWith(value.toLowerCase())) {
                    return [value, item, i]
                }
            }

            if (start !== 0) {
                for (let i = 0, l = Math.min(start, items.length); i < l; i++) {
                    const item = items[i]
                    const searchIn = this.getDisplayValue(item)
                    if (searchIn && searchIn.toLowerCase().startsWith(value.toLowerCase())) {
                        return [value, item, i]
                    }
                }
            }

            return null
        }),
        shareReplay(1)
    )

    protected lastKeyup: number
    protected pendingValue: any
    // protected readonly chipSelection: SelectionModel = new SingleSelection()
    protected selectedBeforeOpen: T[]

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
        @Inject(AutosizePropertiesDirective) @Optional() @Self() public readonly autosize: AutosizePropertiesDirective,
        @Attribute("triggerIcon") public readonly triggerIcon: string
    ) {
        super(model)

        this.monitorFocus(el.nativeElement)

        if (!selection) {
            this.selection = new SingleSelection()
        }

        this.selection.keyboard.alwaysAppend = this.selection.type === "multi"

        this.destruct.subscription(this.selection.changes).subscribe(selected => {
            if (this.selection.type === "single" && selected[0]) {
                this.opened = false
            } else if (this.selection.type === "multi") {
                if (!this.pinList && selected[0]) {
                    this.opened = false
                }
            }

            const vals: any = this.valueField ? selected.map(s => getPath(s, this.valueField)) : selected

            if (this.selection.type === "single") {
                model.emitValue(vals[0])
            } else {
                model.emitValue(vals)
            }

            this._resetTextInput()
            if (!this.input && this.cdr) {
                this._detectChanges()
            }

            ;(this.selectionChanges as EventEmitter<T[]>).next(selected)
        })

        this.destruct
            .subscription(this.model.focusChanges)
            .pipe(
                debounceTime(100),
                map(v => [v.curr !== null, v.curr]),
                distinctUntilChanged((a, b) => a[0] === b[0])
            )
            .subscribe(this._handleFocus.bind(this))

        if (!layerFactory) {
            this.layerFactory =
                layerFactory || LayerFactoryDirective.create("left top", "left bottom", this.layer, this.vcr, el)
            this.layerFactory.nzLayerFactory = AutocompleteComponent
        }

        this.selection.keyboard.connect(el.nativeElement)

        this._closeShortcuts = this.destruct.disposable(
            this.shortcutService.create(this.el.nativeElement, {
                "select.close": {
                    shortcut: "escape, back",
                    handler: () => {
                        this.opened = false
                    }
                }
            })
        )
        this._closeShortcuts.enabled = false

        this.destruct.subscription(this.query$).subscribe(this._querySuggestions.bind(this))
        this.destruct.subscription(this.focusItem$).subscribe(this._focusItemByInput.bind(this))
    }

    public ngOnInit() {
        super.ngOnInit()

        const openDD = merge(this.openedChanges, this.model.statusChanges).pipe(
            map(_ => this.opened && !this.readonly && !this.disabled),
            distinctUntilChanged(),
            switchMap(value => {
                if (value) {
                    const range = new NzRange(0, AutocompleteComponent.PRELOAD_COUNT)
                    if (this.source.getRange(range).length > 0) {
                        // console.log("RANGE IS LOADED")
                        return of(true)
                    } else {
                        // console.log("RANGE PRELOADING")
                        // preload items
                        return new Observable((observer: Observer<boolean>) => {
                            const s = this.source.storage.items.subscribe(_ => {
                                // console.log("preload", _)
                                observer.next(value)
                                observer.complete()
                            })
                            const s2 = this.source.storage.invalidated.pipe(startWith(null)).subscribe(_ => {
                                // console.log("select.loadRange", range)
                                this.source.loadRange(range)
                            })
                            return () => {
                                // console.log("UNSUBSCRIBE")
                                s.unsubscribe()
                                s2.unsubscribe()
                            }
                        })
                    }
                } else {
                    return of(value)
                }
            })
        )
        this.destruct.subscription(openDD).subscribe(opened => {
            if (opened) {
                this._showDropDown()
            } else {
                this._hideDropDown()
            }
            this._detectChanges()
        })
    }

    public reset() {
        this.selection.items = []
        if (this.input) {
            this.input.nativeElement.value = ""
            if (!this.opened) {
                this._updateFilter(null, true)
            } else {
                this.opened = false
            }
        }
    }

    public toggle() {
        this.opened = !this.opened
    }

    public getDisplayValue(model: T): string {
        return getPath(model, this.displayField || "") || ""
    }

    protected _renderValue(obj: SelectValue<T>): void {
        if (!this.source || !this.source.storage) {
            this.pendingValue = obj
            return
        }

        const { ids, request, models } = this.coerceValue(obj)

        if (request.length) {
            this.destruct
                .subscription(this.getModels(request))
                .pipe(take(1))
                .subscribe(result => {
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

    protected coerceValue(value: SelectValue<T>): { ids: PrimaryKey[]; request: PrimaryKey[]; models: T[] } {
        if (typeof value === "string") {
            value = value.split(/\s*,\s*/)
        }

        if (!Array.isArray(value)) {
            value = [value] as any
        }

        const ids = []
        const models = []
        const request = []
        const idField = this.valueField || "id"

        for (const item of value as Array<T | PrimaryKey>) {
            if (typeof item === "string" || typeof item === "number") {
                const existing = this.selection.items.find(selected => getPath(selected, idField) === item)
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
        const s: Array<Observable<T>> = []

        if (this.source.storage) {
            for (let i = 0, l = ids.length; i < l; i++) {
                s.push(
                    this.source.get(ids[i]).pipe(
                        catchError(() => of(null)),
                        map(result => {
                            if (result == null && this.freeSelect) {
                                return this._newProvisionModel(String(ids[i]))
                            }
                            return result
                        })
                    )
                )
            }
        }

        if (s.length === 0) {
            return of([])
        }

        return forkJoin(s).pipe(map(result => result.filter((v: T) => !!v)))
    }

    public ngAfterContentInit() {
        this.applyPendingValue()
    }

    public ngAfterViewInit() {
        this.applyPendingValue()
    }

    protected _showDropDown() {
        if (this.layerFactory.isVisible) {
            return
        }

        this.selectedBeforeOpen = this.selected.slice(0)
        const targetAnchor = this.layerFactory.targetAnchor

        if (!targetAnchor.targetEl) {
            targetAnchor.targetEl = this.el
            if (this.editable) {
                if (!targetAnchor.nzTargetAnchor) {
                    targetAnchor.nzTargetAnchor = "left bottom"
                }

                if (!targetAnchor.margin) {
                    if (this.ffc) {
                        targetAnchor.targetEl = this.ffc.el
                        targetAnchor.margin = { top: 0, bottom: this.ffc.isSlim ? 0 : -19, left: 12, right: 12 }
                    } else {
                        targetAnchor.margin = { top: 4, bottom: 4, left: 12, right: 12 }
                    }
                }
            } else {
                if (!targetAnchor.nzTargetAnchor) {
                    targetAnchor.nzTargetAnchor = "left top"
                }
                if (!targetAnchor.margin) {
                    targetAnchor.margin = { left: 12, right: 12, top: 16 }
                }
            }
        }

        const targetEl = targetAnchor.targetEl.nativeElement
        const margin = parseMargin(targetAnchor.margin)
        const layerRef = this.layerFactory.show(
            new DropdownLayer({
                backdrop: {
                    type: "empty",
                    crop: targetEl,
                    hideOnClick: true
                },
                minWidth: targetEl.offsetWidth + margin.left + margin.right,
                minHeight: this.editable ? 0 : targetEl.offsetHeight,
                maxHeight: 48 * 7,
                initialWidth: targetEl.offsetWidth + margin.left + margin.right,
                initialHeight: this.editable ? 0 : targetEl.offsetHeight,
                elevation: 10,
                preventFocus: true
            }),
            {
                $implicit: this
            },
            [
                { provide: SelectionModel, useValue: this.selection },
                { provide: DataSourceDirective, useValue: this.source },
                { provide: AUTOCOMPLETE_ITEM_TPL, useValue: this.itemTpl },
                { provide: AUTOCOMPLETE_ACTIONS, useValue: this.actions || this._actions },
                {
                    provide: AUTOCOMPLETE_ITEM_FACTORY,
                    useValue: this.freeSelect ? this._createNewValue.bind(this) : null
                },
                {
                    provide: AUTOCOMPLETE_ITEM_FACTORY_ALWAYS_VISIBLE,
                    useValue: this.showNewItemOption === "always"
                }
            ]
        ) as ComponentLayerRef<AutocompleteComponent<T>>

        const outletEl = layerRef.outlet.firstElement
        this.monitorFocus(outletEl)
        this._closeShortcuts.watch(outletEl)

        const s = layerRef.subscribe(event => {
            if (event.type === "hiding") {
                this.stopFocusMonitor(outletEl)
                this._closeShortcuts.unwatch(outletEl)
                if (!this.opened) {
                    this._updateFilter(null, true)
                } else {
                    this.opened = false
                }
                s.unsubscribe()
            }
        })
    }

    protected _hideDropDown() {
        this.selection.keyboard.reset()
        delete this.selectedBeforeOpen
        this.layerFactory.hide()
    }

    protected _handleFocus(param: [boolean, FocusOrigin]) {
        const [focused, origin] = param

        if (focused) {
            if (this.input) {
                this.model.focusGroup.focusVia(this.input.nativeElement, origin)
            } else {
                this.model.focusGroup.focusVia(this.el.nativeElement, origin)
            }

            if (
                !this.opened &&
                this.autoTrigger &&
                this.input &&
                !this.disabled &&
                !this.readonly &&
                this.model.isEmpty
            ) {
                this._querySuggestions(this.input.nativeElement.value)
            }
        } else {
            this._resetTextInput()
            this.opened = false
        }
    }

    public _onInput(event: Event): void {
        if (this.readonly) {
            return
        }

        const value = this.input.nativeElement.value
        ;(this.input$ as Subject<string>).next(value)
        this.inputState = "typing"
    }

    protected _querySuggestions(text: string): void {
        if (this.readonly) {
            return
        }

        if ((text && text.length > 0) || this.autoTrigger) {
            this.inputState = "querying"
            this._updateFilter(text)
            this.opened = true
        } else {
            this.opened = false
        }
    }

    protected _focusItemByInput(value: [string, T, number]): void {
        if (this.readonly) {
            return
        }

        this.opened = true
        if (value) {
            this.selection.setFocused(value[1].pk, "keyboard")
        }
    }

    @HostListener("keydown", ["$event"])
    protected _onKeydown(event: KeyboardEvent) {
        if (this.readonly) {
            return
        }

        if (this._processKeypress(event.keyCode, event.shiftKey, event.ctrlKey, event.altKey)) {
            event.preventDefault()
            event.stopImmediatePropagation()
        } else if (event.key && event.key.length === 1) {
            this.search$.next(event.key)
        }
    }

    @HostListener("keyup", ["$event"])
    protected _onKeyup(event: KeyboardEvent) {
        if (this.readonly) {
            return
        }

        this.lastKeyup = event.keyCode
    }

    @HostListener("tap", ["$event"])
    public _onTriggerClick(event: MouseEvent) {
        if (event.defaultPrevented) {
            return
        }
        event.preventDefault()

        if (this.readonly) {
            return
        }

        if (this.opened) {
            this.opened = false
        } else {
            this.inputState = "querying"
            this._updateFilter(null)
            this.opened = true

            if (this.input) {
                this.input.nativeElement.focus()
            }
        }
    }

    public _clearValue(event: Event) {
        if (event.defaultPrevented) {
            return
        }
        event.preventDefault()

        if (this.readonly) {
            return
        }

        this.value = null
    }

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
            }
        }

        this.input.nativeElement.value = value
        this._detectChanges()
    }

    protected _createNewValue() {
        const inputValue = this.input.nativeElement.value

        if (inputValue && inputValue.length) {
            const provisionalModel = this._newProvisionModel(inputValue)
            this.selection.items = [provisionalModel]
        }
    }

    protected _newProvisionModel(value: string) {
        const provisionalModel = new ProvisionalModel({ _id: Math.random().toString(36) }) as any
        setPath(provisionalModel, this.valueField, { $new: value })
        setPath(provisionalModel, this.displayField, value)
        return provisionalModel
    }

    protected _processKeypress(code: number, shift: boolean, ctrl: boolean, alt: boolean): boolean {
        switch (code) {
            case UP_ARROW:
            case DOWN_ARROW:
                this.opened = true
                return false

            case BACKSPACE:
                if (
                    this.lastKeyup === code &&
                    (!this.input || !this.input.nativeElement.value || this.input.nativeElement.value.length === 0)
                ) {
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
        !this.destruct.done && this.cdr.detectChanges()
    }

    public ngOnDestroy() {
        this.destruct.run()
    }

    private _updateFilter(qv: string | null, silent?: boolean) {
        const qf = this.queryField || this.displayField
        const filter = { ...this.source.filter } as any
        if (!qv || qv.length === 0) {
            delete filter[qf]
        } else {
            filter[qf] = { contains: qv }
        }
        if (silent) {
            this.source.setFilterSilent(filter)
        } else {
            this.source.filter = filter
        }
    }
}

function collectTime<T>(t: number): (src: Observable<T>) => Observable<T[]> {
    let value: T[] = []
    let timeout: any

    const clear = () => {
        value = []
    }

    return (src: Observable<T>) =>
        src.pipe(
            map((v: T) => {
                if (timeout) {
                    window[CLEAR_TIMEOUT](timeout)
                }

                timeout = window[SET_TIMEOUT](clear, t)

                value.push(v)
                return value as T[]
            })
        )
}
