import {
    Component, Inject, InjectionToken, TemplateRef, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy,
    ViewChild, QueryList, OnInit
} from "@angular/core"
import { SafeStyle, DomSanitizer } from "@angular/platform-browser"
import { Subject, merge } from "rxjs"
import { startWith, filter, debounceTime, takeUntil } from "rxjs/operators"

import { DataSourceDirective, Model, SelectionModel } from "../../data.module"
import { ListDirective } from "../list/list.directive"
import { ListActionComponent } from "../list/list-action.component"
import { RenderedEvent } from "../virtual-for.directive"
import { Destructible } from "../../util"
import { ScrollerComponent } from "../scroller/scroller.component"
import { LayerRef } from "../../layer.module"



export const AUTOCOMPLETE_ITEM_TPL = new InjectionToken<TemplateRef<any>>("autocomplete.itemTpl")
export const AUTOCOMPLETE_ACTIONS = new InjectionToken<QueryList<ListActionComponent>>("autocomplete.actions")


export class DDContext<T> {
    $implicit: T
}


@Component({
    selector: "nz-autocomplete",
    host: {
        "[style.visibility]": "firstRender ? 'hidden' : 'visible'"
    },
    templateUrl: "./autocomplete.template.pug",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AutocompleteComponent<T extends Model> extends Destructible implements OnDestroy, OnInit {
    @ViewChild("list", { read: ListDirective, static: false }) protected readonly list: ListDirective
    @ViewChild("scroller", { read: ScrollerComponent, static: false }) protected readonly scroller: ScrollerComponent

    public readonly gridTemplateRows: SafeStyle

    public get isNotFound() {
        return this.source.storage && this.source.storage.isEmpty && !this.source.storage.isBusy
    }

    protected actionsByPosition: { [key: string]: ListActionComponent[] } = {}
    private firstRender: boolean = true

    public constructor(
        @Inject(DataSourceDirective) public readonly source: DataSourceDirective<T>,
        @Inject(AUTOCOMPLETE_ITEM_TPL) public readonly itemTpl: TemplateRef<DDContext<T>>,
        @Inject(AUTOCOMPLETE_ACTIONS) public readonly actions: QueryList<ListActionComponent>,
        @Inject(ChangeDetectorRef) protected cdr: ChangeDetectorRef,
        @Inject(DomSanitizer) protected sanitizer: DomSanitizer,
        @Inject(SelectionModel) protected selection: SelectionModel,
        @Inject(LayerRef) private readonly layerRef: LayerRef) {
        super()
    }

    public ngOnInit() {
        this.destruct.subscription(this.selection.focusing)
            .pipe(filter(event => !!event.origin))
            .subscribe(event => {
                const focusedComponent = event.component
                if (focusedComponent && this.scroller) {
                    this.scroller.service.scrollIntoViewport(focusedComponent.el.nativeElement)
                }
                this.cdr.detectChanges()
            })

        const storage = this.source.storage
        merge(storage.items, storage.busy, storage.empty)
            .pipe(
                // debounceTime(20),
                takeUntil(this.destruct.on)
            )
            .subscribe(event => {
                (this as { gridTemplateRows: SafeStyle }).gridTemplateRows = this.calcGridTemplateRows()
                this.cdr.detectChanges()
            })

        this.destruct.subscription(this.actions.changes).pipe(startWith(this.actions)).subscribe(items => {
            this.actionsByPosition = {}
            for (const item of items) {
                if (!this.actionsByPosition[item.position]) {
                    this.actionsByPosition[item.position] = [item]
                } else {
                    this.actionsByPosition[item.position].push(item)
                }
            }
            (this as { gridTemplateRows: SafeStyle }).gridTemplateRows = this.calcGridTemplateRows()
            this.cdr.detectChanges()
        })
    }

    public onItemsRendered(event: RenderedEvent<any>) {
        if (this.firstRender) {
            this.firstRender = false
            this.layerRef.behavior.levitate.reset()
        }
    }

    protected offset(index: number): number {
        return index + 1
            + (this.actionsByPosition.first ? this.actionsByPosition.first.length : 0)
    }

    protected calcGridTemplateRows(): SafeStyle {
        const actionsLength = this.actions ? this.actions.length : 0
        let repeat = this.source.storage.lastIndex + actionsLength
        let rowHeight = 48

        if (repeat === 0) {
            return null
        }

        return this.sanitizer.bypassSecurityTrustStyle(`repeat(${repeat}, ${rowHeight}px)`)
    }
}
