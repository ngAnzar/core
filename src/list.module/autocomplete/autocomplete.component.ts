import {
    Component, Inject, InjectionToken, TemplateRef, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy,
    ViewChild, QueryList, OnInit
} from "@angular/core"
import { SafeStyle, DomSanitizer } from "@angular/platform-browser"
import { startWith } from "rxjs/operators"

import { DataSourceDirective, Model, SelectionModel } from "../../data.module"
import { ListDirective } from "../list/list.directive"
import { ListActionComponent } from "../list/list-action.component"
import { Destruct } from "../../util"
import { ScrollerComponent } from "../scroller/scroller.component"


export const AUTOCOMPLETE_ITEM_TPL = new InjectionToken<TemplateRef<any>>("autocomplete.itemTpl")
export const AUTOCOMPLETE_ACTIONS = new InjectionToken<QueryList<ListActionComponent>>("autocomplete.actions")


export class DDContext<T> {
    $implicit: T
}


@Component({
    selector: "nz-autocomplete",
    templateUrl: "./autocomplete.template.pug",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AutocompleteComponent<T extends Model> implements OnDestroy, OnInit {
    @ViewChild("list", { read: ListDirective }) protected readonly list: ListDirective
    @ViewChild("scroller", { read: ScrollerComponent }) protected readonly scroller: ScrollerComponent

    public get gridTemplateRows(): SafeStyle {
        const actionsLength = this.actions ? this.actions.length : 0
        let repeat = this.source.storage.lastIndex + actionsLength
        let rowHeight = 48

        if (repeat === 0) {
            repeat = 1
            rowHeight = 0
        }

        return this.sanitizer.bypassSecurityTrustStyle(`repeat(${repeat}, ${rowHeight}px)`)
    }

    protected actionsByPosition: { [key: string]: ListActionComponent[] } = {}
    public readonly destruct = new Destruct()

    public constructor(
        @Inject(DataSourceDirective) public readonly source: DataSourceDirective<T>,
        @Inject(AUTOCOMPLETE_ITEM_TPL) public readonly itemTpl: TemplateRef<DDContext<T>>,
        @Inject(AUTOCOMPLETE_ACTIONS) public readonly actions: QueryList<ListActionComponent>,
        @Inject(ChangeDetectorRef) protected cdr: ChangeDetectorRef,
        @Inject(DomSanitizer) protected sanitizer: DomSanitizer,
        @Inject(SelectionModel) protected selection: SelectionModel) {

        this.destruct.subscription(selection.changes).subscribe(() => {
            const selectedComponents = selection.getSelectables(null, true)
            if (selectedComponents.length && this.scroller) {
                const last = selectedComponents[selectedComponents.length - 1]
                this.scroller.service.velocityX = 10
                this.scroller.service.velocityY = 10
                this.scroller.service.scrollIntoViewport(last.el.nativeElement)
            }
            this.cdr.detectChanges()
        })
    }

    public ngOnInit() {
        this.destruct.subscription(this.source.storage.items).subscribe(event => {
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
            this.cdr.detectChanges()
        })
    }

    public ngOnDestroy() {
        this.destruct.run()
    }

    protected offset(index: number): number {
        return index + 1
            + (this.actionsByPosition.first ? this.actionsByPosition.first.length : 0)
    }
}
