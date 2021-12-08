import { Component, Inject, Input, OnChanges, SimpleChanges, ElementRef, ViewChild, ViewChildren, AfterViewInit, QueryList } from "@angular/core"
import { FormArray, FormControl } from "@angular/forms"
import { FocusOrigin, FocusMonitor, InteractivityChecker } from "@angular/cdk/a11y"
import { debounceTime, Subject, distinctUntilChanged } from "rxjs"

import { Destructible } from "../../../util"
import { Model } from "../../../data.module"

import type { TokenFilterComponent, ResolvedValue } from "./token-filter.component"
import type { TokenFilterComparator } from "./token-filter-comparator"
import { TokenFilterInputComponent } from "./token-filter-input.component"
import { TokenFilterService } from "./token-filter.service"
import { TFSuggestions } from "./suggestions"
import { TokenFilterValueInputCtx } from "./value-type"


export class FilterItemModel {
    public filter?: TokenFilterComponent
    public field?: string
    public comp: TokenFilterComparator
    public values: any[]
}


@Component({
    selector: "nz-token-filter-item",
    templateUrl: "./token-filter-item.component.pug",
    host: {
        "[attr.tabindex]": "-1",
        "[attr.focus]": "isFocused ? '' : null",
    }
})
export class TokenFilterItemComponent extends Destructible implements OnChanges, AfterViewInit {
    @Input() public model: FilterItemModel

    public set isFocused(val: FocusOrigin | null) {
        if (this._isFocused !== val) {
            this._isFocused = val
        }
    }
    public get isFocused(): FocusOrigin | null { return this._isFocused }
    private _isFocused: FocusOrigin | null

    @ViewChild("fieldEl", { static: false, read: ElementRef }) public readonly fieldEl: ElementRef<HTMLElement>
    @ViewChild("compEl", { static: false, read: ElementRef }) public readonly compEl: ElementRef<HTMLElement>
    @ViewChildren("valueEl", { read: ElementRef }) public readonly valueEls: QueryList<ElementRef<HTMLElement>>

    public isInfinity: boolean = false
    public isUnexpected: boolean = false
    public displayParens: boolean
    public valueContext: TokenFilterValueInputCtx[] = []

    public readonly valuesGroup = new FormArray([])
    public get valueControls() { return this.valuesGroup.controls }

    private readonly focusOrigin = new Subject<FocusOrigin>()
    private _pendingValueFocus: number

    public constructor(
        @Inject(ElementRef) private readonly el: ElementRef<HTMLElement>,
        @Inject(FocusMonitor) private readonly focusMonitor: FocusMonitor,
        @Inject(TokenFilterService) private readonly filterSvc: TokenFilterService,
        @Inject(TokenFilterInputComponent) private readonly input: TokenFilterInputComponent,
        @Inject(InteractivityChecker) private readonly interactivityChecker: InteractivityChecker) {
        super()

        this.destruct.subscription(this.focusOrigin).pipe(debounceTime(50)).subscribe(origin => this.isFocused = origin)
        this.destruct.subscription(focusMonitor.monitor(el.nativeElement, true)).subscribe(this.handleFocusOrign)
        this.destruct.any(focusMonitor.stopMonitoring.bind(focusMonitor, el.nativeElement))
        this.destruct.subscription(this.valuesGroup.valueChanges)
            .pipe(distinctUntilChanged(valuesIsEq))
            .subscribe(values => {
                this.model.values = values
                this._updateValueContext()
            })
    }

    public ngAfterViewInit() {
        this.destruct.subscription(this.valueEls.changes).subscribe(valueEls => {
            if (this._pendingValueFocus != null) {
                this._focusValueInput(this._pendingValueFocus)
            }
        })
    }

    public ngOnChanges(changes: SimpleChanges) {
        if ("model" in changes) {
            const model: FilterItemModel = changes.model.currentValue
            this.reconfigure(model)
        }
    }

    private reconfigure(model: FilterItemModel) {
        if (model.field) {
            this.isUnexpected = true
        }

        this.setComp(model.comp)
    }

    public compIsValid(comp: TokenFilterComparator): boolean {
        if (this.model.filter) {
            return this.model.filter.comparatorsSrc.data.filter(v => v.name === comp.name).length > 0
        } else {
            return false
        }
    }

    public showFilterSuggestions() {
        const target = this.el.nativeElement
        this.showSugg(this.filterSvc.filterSuggestions, target, target, (selected) => {
            if (selected) {
                this.setFilter(selected.component)
            }
        })
    }

    public setFilter(filter: TokenFilterComponent) {
        this.model.filter = filter
        if (this.model.comp) {
            if (!this.compIsValid(this.model.comp)) {
                this.setComp(this.model.filter.comparatorsSrc.data[0].comp)
                this.showCompSuggestions()
            }
        }
    }

    public showCompSuggestions() {
        this.showSugg(this.model.filter.comparatorSuggestions, this.compEl.nativeElement, this.el.nativeElement, (selected) => {
            if (selected) {
                this.setComp(selected.comp)
            }
        })
    }

    public onValueFocus() {
        this._hideSuggestions()
        console.log("onValueFocus")
    }

    private _hideSuggestions() {
        this.filterSvc.filterSuggestions.hide()
        this.model.filter.comparatorSuggestions.hide()
        this.currentSugg = null
    }

    public setComp(comp: TokenFilterComparator) {
        this.isInfinity = comp.valueCount === Infinity
        this.displayParens = comp.valueCount > 1 || this.isInfinity
        this.model.comp = comp
        const values = this.updateValues()
        console.log(values)
        for (let i = 0; i < values.length; i++) {
            console.log(values[i], this.valueControls[i].value)
            if (values[i] == null) {
                this._focusValueInput(i)
            }
        }
    }

    public updateValues() {
        let newValues: any[]
        if (this.model.comp.valueCount === Infinity) {
            newValues = this.model.values
        } else {
            const values = this.model.values
            newValues = []
            for (let i = 0; i < this.model.comp.valueCount; i++) {
                if (values[i] != null) {
                    newValues.push(values[i])
                } else {
                    newValues.push(null)
                }
            }
        }
        this._updateControls(newValues)
        return newValues
    }

    private _updateControls(values: any[]) {
        if (this.valueControls.length > values.length) {
            for (let i = this.valueControls.length - 1; i >= values.length; i--) {
                this.valuesGroup.removeAt(i, { emitEvent: false })
            }
        } else if (this.valueControls.length < values.length) {
            for (let i = this.valueControls.length; i < values.length; i++) {
                this.valuesGroup.push(new FormControl(null), { emitEvent: false })
            }
        }
        this.valuesGroup.setValue(values)
        // this._updateValueContext()
    }

    public addValue() {
        this.valuesGroup.push(new FormControl(null))
        this._focusValueInput(this.valueControls.length - 1)
    }

    private _updateValueContext() {
        this.valueContext = this.valueControls.map((control, index) => {
            if (!this.model.filter) {
                return
            }

            let ctx: Partial<TokenFilterValueInputCtx> = this.valueContext[index] || { $implicit: control }

            // if control changed
            if (ctx.$implicit !== control) {
                ctx = { $implicit: control }
            }
            ctx.values = this.valuesGroup.value
            ctx.remove = this.isInfinity ? this._removeValueAt.bind(this, index) : noop
            return this.model.filter.valueProvider.updateContext(ctx as TokenFilterValueInputCtx)
        })
    }

    private _removeValueAt(index: number) {
        if (this.valueControls.length > 1) {
            this.valuesGroup.removeAt(index)
            this._focusValueInput(index - 1)
        }
    }

    private currentSugg: TFSuggestions<any>
    private showSugg<T extends Model>(sugg: TFSuggestions<T>, target: HTMLElement, crop: HTMLElement, cb: (item: T) => void) {
        if (sugg.isVisible) {
            this.currentSugg = null
            sugg.hide()
            return
        }

        if (this.currentSugg) {
            this.currentSugg.hide()
        }
        this.currentSugg = sugg

        const monitorFocus = (el: HTMLElement) => {
            this.destruct.subscription(this.focusMonitor.monitor(el, true)).subscribe(this.handleFocusOrign)
            return () => {
                this.focusMonitor.stopMonitoring(el)
            }
        }

        this.el.nativeElement.focus()
        this.destruct.subscription(sugg.show(target, crop, monitorFocus)).subscribe(cb)
    }

    private handleFocusOrign = (orign: FocusOrigin) => {
        this.input.focusOrigin.next(orign)
        this.focusOrigin.next(orign)
    }

    private _findFocusable(valueEl: HTMLElement): HTMLElement | null {
        const children = valueEl.children as any as HTMLElement[]
        for (let i = 0; i < children.length; i++) {
            if (this.interactivityChecker.isFocusable(children[i])) {
                return children[i]
            } else {
                const childf = this._findFocusable(children[i])
                if (childf) {
                    return childf
                }
            }
        }
    }

    private _focusValueInput(index: number) {
        delete this._pendingValueFocus
        if (this.valueEls.length <= index) {
            this._pendingValueFocus = index
            return
        }
        const valueEl = this.valueEls.get(index)
        const focusable = this._findFocusable(valueEl.nativeElement)
        if (focusable) {
            focusable.focus()
        } else {
            this._pendingValueFocus = index
        }
    }
}


function valuesIsEq(prev: any[], curr: any[]) {
    if (Array.isArray(prev) && Array.isArray(curr)) {
        if (prev.length === curr.length) {
            for (let i = 0; i < curr.length; i++) {
                if (prev[i] !== curr[i]) {
                    return false
                }
            }
            return true
        } else {
            return false
        }
    } else {
        return false
    }
}


function noop() { }
