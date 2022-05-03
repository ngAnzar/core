import { Component, Inject, Input, OnChanges, SimpleChanges, ContentChildren, QueryList, AfterContentInit, ElementRef, ViewChild, TemplateRef, AfterViewInit } from "@angular/core"
import { Observable, startWith, map, shareReplay, Subject, merge, switchMap, take, of, forkJoin, BehaviorSubject, filter, zip } from "rxjs"


import { Model, Field, StaticSource } from "../../../data.module"
import { LayerService } from "../../../layer.module"
import { InputComponent, INPUT_MODEL, InputModel, INPUT_MODEL_VALUE_CMP } from "../abstract"
import { TokenFilterComponent, ResolvedValue } from "./token-filter.component"
import { TokenFilterComparator } from "./token-filter-comparator"
import { TokenFilterService } from "./token-filter.service"
import { TFSuggestions } from "./suggestions"
import type { FilterItemModel } from "./token-filter-item.component"


export class TokenFilterModel extends Model {
    @Field({ primary: true }) public name: string
    @Field() public label: string
    @Field() public component: TokenFilterComponent
}


export type TokenFilterValue = { [key: string]: any }


@Component({
    selector: ".nz-token-filter-input",
    templateUrl: "./token-filter-input.component.pug",
    providers: [
        ...INPUT_MODEL,
        TokenFilterService
    ]
})
export class TokenFilterInputComponent extends InputComponent<TokenFilterValue> implements AfterContentInit, AfterViewInit {
    @ContentChildren(TokenFilterComponent) protected filters: QueryList<TokenFilterComponent>
    @ViewChild("filterItemTpl", { static: true, read: TemplateRef }) public readonly filterItemTpl: TemplateRef<any>

    public readonly filters$ = new BehaviorSubject<TokenFilterComponent[]>([])
    public readonly filtersSource = new StaticSource(TokenFilterModel, [])

    private value$ = new BehaviorSubject<TokenFilterValue>({})

    public readonly items$: Observable<Array<FilterItemModel>> = merge(this.value$, this.filters$).pipe(
        switchMap(() => zip([this.value$.pipe(take(1)), this.filters$.pipe(take(1))])),
        map(([value, filters]) => {
            if (!value) {
                return []
            }
            const keys = Object.keys(value)
            if (keys.length === 0) {
                return []
            }

            return keys
                .map(key => {
                    const filterValue = value[key]
                    const filterDesc = filters.filter(v => v.name === key)[0]
                    if (filterValue === undefined) {
                        return filterDesc ? { filter: filterDesc } as FilterItemModel : null
                    }

                    const filterCmp = this.filtererSvc.determineComparator(filterValue)
                    if (!filterDesc) {
                        return {
                            field: key,
                            comp: filterCmp,
                            values: filterCmp.parse(filterValue)
                        } as FilterItemModel
                    }
                    return {
                        filter: filterDesc,
                        comp: filterCmp,
                        values: filterCmp.parse(filterValue)
                    } as FilterItemModel
                })
                .filter(v => !!v)
        }),
        shareReplay(1)
    )

    public canAddNewItem: boolean = true

    public constructor(
        @Inject(InputModel) model: InputModel<TokenFilterValue>,
        @Inject(ElementRef) el: ElementRef<HTMLElement>,
        @Inject(TokenFilterService) private readonly filtererSvc: TokenFilterService,
        @Inject(LayerService) private readonly layerSvc: LayerService) {
        super(model)
        this.monitorFocus(el.nativeElement)
    }

    public ngAfterContentInit() {
        this.destruct.subscription(this.filters.changes)
            .pipe(startWith(this.filters.toArray()))
            .subscribe((filters: TokenFilterComponent[]) => {
                this.filtersSource.replace(filters.map(f => new TokenFilterModel({ name: f.name, label: f.label, component: f })))
                this.filters$.next(filters)
            })
    }

    public ngAfterViewInit() {
        (this.filtererSvc as { filterSuggestions: TFSuggestions<TokenFilterModel> }).filterSuggestions
            = new TFSuggestions(this.filtersSource, this.layerSvc, this.filterItemTpl)
    }

    public doAddNewItem(event: Event) {
        this.filtererSvc.filterSuggestions.show(event.target as HTMLElement).subscribe(filter => {
            if (filter) {
                let value = this.value$.value
                value[filter.name] = undefined
                this._renderValue(value)
            }
        })
    }

    public remove(item: FilterItemModel) {
        let value = this.value$.value
        delete value[item.filter.name]
        this._renderValue(value)
        if (Object.keys(value).length === 0) {
            this.model.emitValue(null)
        } else {
            this.model.emitValue(value)
        }
        this._excludeFilter()
    }

    public onItemChanges(item: FilterItemModel) {
        let value = this.value$.value
        value[item.filter.name] = item.comp.compose(item.values)
        this.model.emitValue(value)
        this._excludeFilter()
    }

    protected _renderValue(value: any): void {
        this.value$.next(value || {})
        this._excludeFilter()
    }

    protected _excludeFilter() {
        const usedKeys = Object.keys(this.value$.value)
        let filter = { name: { "not in": usedKeys } }
        if (this.filtererSvc.filterSuggestions) {
            this.filtererSvc.filterSuggestions.ds.filter = filter as any
            this.canAddNewItem = this.filtersSource.data.length > usedKeys.length
        }
    }

    public _trackBy(item: FilterItemModel) {
        return item.filter ? item.filter.name : item.field
    }
}
