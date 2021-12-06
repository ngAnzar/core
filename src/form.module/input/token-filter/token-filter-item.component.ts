import { Component, Inject, Input, OnChanges, SimpleChanges, ElementRef } from "@angular/core"
import { FocusOrigin, FocusMonitor } from "@angular/cdk/a11y"

import { Destructible } from "../../../util"
import { Model } from "../../../data.module"

import type { TokenFilterComponent, ResolvedValue } from "./token-filter.component"
import type { TokenFilterComparator } from "./token-filter-comparator"
import { TokenFilterService } from "./token-filter.service"
import { TFSuggestions } from "./suggestions"


export class FilterItemModel {
    public filter?: TokenFilterComponent
    public field?: string
    public comp: TokenFilterComparator
    public values: any[]
    public resolvedValues: ResolvedValue[]
}


@Component({
    selector: "nz-token-filter-item",
    templateUrl: "./token-filter-item.component.pug",
    host: {
        "[attr.tabindex]": "-1",
        "[attr.focus]": "isFocused ? '' : null",
    }
})
export class TokenFilterItemComponent extends Destructible implements OnChanges {
    @Input() public model: FilterItemModel

    public set isFocused(val: FocusOrigin | null) {
        if (this._isFocused !== val) {
            this._isFocused = val
        }
    }
    public get isFocused(): FocusOrigin | null { return this._isFocused }
    private _isFocused: FocusOrigin | null

    public isInfinity: boolean = false
    public isUnexpected: boolean = false

    public constructor(
        @Inject(ElementRef) private readonly el: ElementRef<HTMLElement>,
        @Inject(FocusMonitor) focusMonitor: FocusMonitor,
        @Inject(TokenFilterService) private readonly filterSvc: TokenFilterService) {
        super()

        this.destruct.subscription(focusMonitor.monitor(el.nativeElement, true)).subscribe(origin => {
            this.isFocused = origin
        })
        this.destruct.any(focusMonitor.stopMonitoring.bind(focusMonitor, el.nativeElement))
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

        if (model.comp) {
            this.isInfinity = model.comp.valueCount === Infinity
        } else {
            this.isInfinity = false
        }

        // this.el.nativeElement.innerHTML = this.buildHtml(model)
    }

    public onValueInput(valueIndex: number, event: InputEvent) {
        const inputEl = event.target as HTMLInputElement
        console.log("onValueInput", valueIndex, inputEl.value)
        // model.resolvedValues[valueIndex].label = inputEl.value
    }

    public isInputFocused(input: any) {
        // console.log("isInputFocused", input)
        return document.activeElement === input
    }

    public showFilterSuggestions() {
        const target = this.el.nativeElement
        this.showSugg(this.filterSvc.filterSuggestions, target, target, (selected) => {
            if (selected) {
                this.model.filter = selected.component
            }
            console.log(selected)
        })
    }

    public showCompSuggestions(event: Event) {
        const target = event.target as HTMLElement
        this.showSugg(this.model.filter.comparatorSuggestions, target, this.el.nativeElement, (selected) => {
            if (selected) {
                this.model.comp = selected.comp
            }
            console.log(selected)
        })
    }

    private showSugg<T extends Model>(sugg: TFSuggestions<T>, target: HTMLElement, crop: HTMLElement, cb: (item: T) => void) {
        if (sugg.isVisible) {
            return
        }

        this.destruct.subscription(sugg.show(target, crop)).subscribe(cb)
    }

    // private buildHtml(model: FilterItemModel) {
    //     let nodes: HTMLElement[] = []

    //     if (model.field) {
    //         nodes.push(this.buildFieldNode(model.field))
    //     }

    //     if (model.filter) {
    //         nodes.push(this.buildFilterNode(model.filter))
    //     }

    //     return nodes.map(n => n.outerHTML).join("")
    // }

    // private buildFieldNode(field: string): HTMLElement {
    //     const el = document.createElement("nz-token-filter-item-field")
    //     el.innerHTML = field
    //     el.dataset.type = "field"
    //     return el
    // }

    // private buildFilterNode(filter: TokenFilterDirective): HTMLElement {
    //     const el = document.createElement("nz-token-filter-item-field")
    //     el.innerHTML = filter.label
    //     el.dataset.type = "filter"
    //     return el
    // }
}


