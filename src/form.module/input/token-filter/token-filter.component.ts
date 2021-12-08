import { Component, Inject, Input, OnChanges, SimpleChanges, ContentChild, ViewChild, TemplateRef, AfterViewInit } from "@angular/core"
import { FormControl } from "@angular/forms"
import { Observable, of } from "rxjs"

import { Model, Field, StaticSource } from "../../../data.module"
import { LayerService } from "../../../layer.module"
import { TokenFilterValue } from "./value-type"
import { TokenFilterService } from "./token-filter.service"
import { TokenFilterComparator } from "./token-filter-comparator"
import { TFSuggestions } from "./suggestions"


export class ComparatorModel extends Model {
    @Field({ primary: true }) public name: string
    @Field() public label: string
    @Field() public description: string
    @Field() public comp: TokenFilterComparator
}


export interface ResolvedValue {
    value: any
    label: string
}


export interface CustomInputTplContext {
    $implicit: FormControl
}


@Component({
    selector: "nz-token-filter",
    templateUrl: "./token-filter.component.pug"
})
export class TokenFilterComponent implements AfterViewInit {
    @Input() public name: string
    @Input() public label: string

    @Input()
    public set comparsions(val: string) {
        if (this._comparsions !== val) {
            this._comparsions = val
            const comparators: TokenFilterComparator[] = val
                .split(/\s*,\s*/g)
                .map(this.filtererSvc.getComparator.bind(this.filtererSvc))
            this.comparatorsSrc.replace(comparators.map(c => new ComparatorModel({
                name: c.name,
                label: c.label,
                description: c.description,
                comp: c
            })))
            this.replaceCompSug()
        }
    }
    public get comparsions(): string { return this._comparsions }
    private _comparsions: string

    public readonly comparatorsSrc = new StaticSource(ComparatorModel, [])

    @ContentChild(TokenFilterValue, { static: true }) public readonly valueProvider: TokenFilterValue
    @ViewChild("comparatorItemTpl", { read: TemplateRef, static: true }) public readonly comparatorItemTpl: TemplateRef<any>

    public readonly comparatorSuggestions: TFSuggestions<ComparatorModel>

    public constructor(
        @Inject(TokenFilterService) private readonly filtererSvc: TokenFilterService,
        @Inject(LayerService) private readonly layerSvc: LayerService) {
    }

    // public resolveValues(values: any[]): Observable<ResolvedValue[]> {
    //     return of(values.map(v => {
    //         return { value: v, label: v }
    //     }))
    // }

    public ngAfterViewInit() {
        this.replaceCompSug()
    }

    public replaceCompSug() {
        if (this.comparatorItemTpl && this.comparatorsSrc) {
            this.comparatorSuggestions?.hide();
            (this as { comparatorSuggestions: TFSuggestions<ComparatorModel> }).comparatorSuggestions
                = new TFSuggestions(this.comparatorsSrc, this.layerSvc, this.comparatorItemTpl)
        }
    }
}
