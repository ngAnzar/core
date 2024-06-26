import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Inject,
    InjectionToken,
    OnDestroy,
    OnInit,
    Optional,
    QueryList,
    TemplateRef,
    ViewChild
} from "@angular/core"
import { DomSanitizer, SafeStyle } from "@angular/platform-browser"

import { merge } from "rxjs"
import { filter, startWith, takeUntil } from "rxjs/operators"

import { DataSourceDirective, Model, SelectionModel } from "../../data.module"
import { LayerRef } from "../../layer.module"
import { __zone_symbol__, Destructible } from "../../util"
import { ListActionComponent } from "../list/list-action.component"
import { ListDirective } from "../list/list.directive"
import { ScrollerComponent } from "../scroller/scroller.component"
import { RenderedEvent } from "../virtual-for/virtual-for.directive"

const RAF = __zone_symbol__("requestAnimationFrame")

export const AUTOCOMPLETE_ITEM_TPL = new InjectionToken<TemplateRef<any>>("autocomplete.itemTpl")
export const AUTOCOMPLETE_ACTIONS = new InjectionToken<QueryList<ListActionComponent>>("autocomplete.actions")
export const AUTOCOMPLETE_ITEM_FACTORY = new InjectionToken<() => void>("autocomplete.itemfactory")
export const AUTOCOMPLETE_ITEM_FACTORY_ALWAYS_VISIBLE = new InjectionToken<boolean>(
    "autocomplete.itemfactory_always_visible"
)

export class DDContext<T> {
    $implicit: T
}

@Component({
    selector: "nz-autocomplete",
    // host: {
    //     "[style.visibility]": "firstRender ? 'hidden' : 'visible'"
    // },
    host: {
        "[attr.tabindex]": "'-1'"
    },
    templateUrl: "./autocomplete.component.pug",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AutocompleteComponent<T extends Model> extends Destructible implements OnDestroy, OnInit {
    @ViewChild("list", { read: ListDirective, static: false }) protected readonly list: ListDirective
    @ViewChild("scroller", { read: ScrollerComponent, static: false }) protected readonly scroller: ScrollerComponent
    @ViewChild("createNewAction", { read: ListActionComponent, static: false })
    protected readonly createNewAction: ListActionComponent

    public static readonly PRELOAD_COUNT = 20

    public readonly gridTemplateRows: SafeStyle
    public readonly hasCreateNew: boolean = false
    public readonly itemsPerRequest = AutocompleteComponent.PRELOAD_COUNT

    public get isNotFound() {
        return this.source.storage && this.source.storage.isEmpty && !this.source.storage.isBusy
    }

    public actionsByPosition: { [key: string]: ListActionComponent[] } = {}

    public constructor(
        @Inject(DataSourceDirective) public readonly source: DataSourceDirective<T>,
        @Inject(AUTOCOMPLETE_ITEM_TPL) public readonly itemTpl: TemplateRef<DDContext<T>>,
        @Inject(AUTOCOMPLETE_ACTIONS) public readonly actions: QueryList<ListActionComponent>,
        @Inject(AUTOCOMPLETE_ITEM_FACTORY) public readonly itemFactory: () => void,
        @Inject(AUTOCOMPLETE_ITEM_FACTORY_ALWAYS_VISIBLE) @Optional() public readonly itemFactoryAlwaysVisible: boolean,
        @Inject(ChangeDetectorRef) protected cdr: ChangeDetectorRef,
        @Inject(DomSanitizer) protected sanitizer: DomSanitizer,
        @Inject(SelectionModel) protected selection: SelectionModel,
        @Inject(LayerRef) private readonly layerRef: LayerRef
    ) {
        super()
    }

    public ngOnInit() {
        this.destruct
            .subscription(this.selection.focusing)
            .pipe(filter(event => !!event.origin))
            .subscribe(event => {
                const focusedComponent = event.component
                if (focusedComponent && this.scroller) {
                    this.scroller.service.scrollIntoViewport(focusedComponent.el.nativeElement)
                }
                this.cdr.detectChanges()
            })

        const storage = this.source.storage
        merge(storage.items, storage.busy, storage.empty, this.actions.changes)
            .pipe(
                startWith(null),
                // debounceTime(20),
                takeUntil(this.destruct.on)
            )
            .subscribe(event => {
                this._updateActions()
            })
    }

    public onItemsRendered(event: RenderedEvent<any>) {
        // if (this.firstRender) {
        //     this.firstRender = false
        // const levitate = this.layerRef.behavior.levitate

        // window[RAF](levitate.reset.bind(levitate))
        // }
        this.layerRef.behavior.levitate.reset()
    }

    public _offset(index: number): number {
        return index + 1 + (this.actionsByPosition.first ? this.actionsByPosition.first.length : 0)
    }

    protected calcGridTemplateRows(): SafeStyle {
        const firstALength = this.actionsByPosition.first ? this.actionsByPosition.first.length : 0
        const lastALength = this.actionsByPosition.last ? this.actionsByPosition.last.length : 0
        const actionsLength = firstALength + lastALength
        const repeat = this.source.storage.lastIndex + actionsLength
        const rowHeight = 48

        if (repeat === 0) {
            return null
        }

        return this.sanitizer.bypassSecurityTrustStyle(`repeat(${repeat}, ${rowHeight}px)`)
    }

    private _updateActions() {
        this.actionsByPosition = {
            first: []
        }

        if (this.itemFactory && this.createNewAction && (this.isNotFound || this.itemFactoryAlwaysVisible)) {
            ;(this as { hasCreateNew: boolean }).hasCreateNew = true
            this.actionsByPosition.first.push(this.createNewAction)
        } else {
            ;(this as { hasCreateNew: boolean }).hasCreateNew = false
        }

        this.actions.forEach(item => {
            if (!this.actionsByPosition[item.position]) {
                this.actionsByPosition[item.position] = [item]
            } else {
                this.actionsByPosition[item.position].push(item)
            }
        })
        ;(this as { gridTemplateRows: SafeStyle }).gridTemplateRows = this.calcGridTemplateRows()
        this.cdr.detectChanges()
    }
}
