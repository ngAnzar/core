import { ViewChild, TemplateRef, Inject, OnDestroy, OnInit, Input, ContentChild, EventEmitter } from "@angular/core"
import { Observable } from "rxjs"
const DeepDiff = require("deep-diff")


import { Destruct } from "../../util"
import { LabelDirective } from "../../common.module"
import { LayerFactoryDirective } from "../../layer.module"
import { Diff } from "../../data.module"

import { ColumnComponent } from "../column/column.component"
import { GridFilterService, IGridFilterEditor } from "./grid-filter.service"


export interface GridFilterLayerContext {
    $implicit: GridFilter
}


export abstract class GridFilter<T = any> implements IGridFilterEditor<T>, OnDestroy {
    @ViewChild("layer", { read: TemplateRef }) public readonly layer: TemplateRef<GridFilterLayerContext>
    @ViewChild("chip", { read: TemplateRef }) public readonly chip: TemplateRef<GridFilterLayerContext>
    public layerFilter: LayerFactoryDirective

    public abstract readonly isEmpty: boolean

    public readonly destruct = new Destruct(() => {
        this.service.removeEditor(this)
        delete (this as any).layer
        delete (this as any).chip
        delete (this as any).service
        delete this.layerFilter
    })

    public readonly valueChanges: Observable<T> = this.destruct.subject(new EventEmitter())

    public constructor(@Inject(GridFilterService) protected readonly service: GridFilterService) {
        service.registerEditor(this)
    }

    public abstract writeValue(name: string, value: T): void
    public abstract canHandleFilter(name: string): boolean
    public abstract resetValue(): void
    public abstract clearValue(): void


    public hideLayer() {
        if (this.layerFilter) {
            this.layerFilter.hide()
        }
    }

    public ngOnDestroy() {
        this.destruct.run()
    }
}


export abstract class ColumnGridFilter extends GridFilter {
    @Input() public title: string
    @Input() public name: string

    public readonly isEmpty = true

    public canHandleFilter(name: string): boolean { return this.name === name }

    public writeValue(name: string, value: any): void {
        if (this.name === name) {
            this._writeValue(this.originalValue = value)
        } else {
            throw new Error("Invalid value for write value")
        }
    }

    public resetValue() {
        let value = this.originalValue
        this._publishValue(value)
        this._writeValue(value)
        this.hideLayer()
    }

    public clearValue() {
        this._publishValue(null)
        this._writeValue(null)
        this.hideLayer()
    }

    public originalValue: any

    protected abstract _writeValue(value: any): void

    protected _publishValue(value: any): void {
        console.log("_publishValue", value)
        const changes = DeepDiff.diff(this.originalValue, value) as Diff
        this.originalValue = value;
        (this as any).isEmpty = value == null

        if (changes && changes.length) {
            (this.valueChanges as EventEmitter<any>).emit(value)
        }

        let filter = this.service.source.filter || {}
        this.service.source.filter = { ...filter, [this.name]: value }
    }

    protected _resetValue() {
        if (this.originalValue != null) {
            (this as any).isEmpty = true;
            (this.valueChanges as EventEmitter<any>).emit(this.originalValue = null)
        }
    }
}
