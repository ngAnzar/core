import {
    Component, Inject, InjectionToken, TemplateRef, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy,
    ViewChild, QueryList, OnInit
} from "@angular/core"
import { SafeStyle, DomSanitizer } from "@angular/platform-browser"
import { startWith } from "rxjs/operators"

import { DataStorage, Model } from "../../data"
import { ListDirective } from "../list/list.directive"
import { Subscriptions } from "../../util/subscriptions"
import { ListActionComponent } from "../list/list-action.component"


export const DROPDOWN_ITEM_TPL = new InjectionToken<TemplateRef<any>>("dropdown.itemTpl")
export const DROPDOWN_ACTIONS = new InjectionToken<QueryList<ListActionComponent>>("dropdown.actions")


export class DDContext<T> {
    $implicit: T
}


@Component({
    selector: ".nz-dropdown",
    templateUrl: "./dropdown.template.pug",
    styles: [
        `.nz-dropdown {
            background: #FFF;
            overflow: hidden;
            max-height: inherit;
            max-width: inherit;
            display: inline-grid;
            grid-template: 1fr / 1fr;
            justify-content: stretch;
            align-content: stretch;
        }`
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DropdownComponent<T extends Model> implements OnDestroy, OnInit {
    @ViewChild("list", { read: ListDirective }) protected readonly list: ListDirective

    public get gridTemplateRows(): SafeStyle {
        const actionsLength = this.actions ? this.actions.length : 0
        return this.sanitizer.bypassSecurityTrustStyle(`repeat(${this.storage.lastIndex + actionsLength}, 48px)`)
    }

    public get focusedModel(): T {
        let item = this.list.focusedItem
        if (item && item.selectable) {
            return item.selectable.model as T
        }
        return null
    }

    // public get fristActions(): QueryList<ActionComponent> {
    //     return this.actions ? this.actions.filter(v => v.position === "first") : [] as any
    // }

    // public get lastActions(): QueryList<ActionComponent> {
    //     return this.actions ? this.actions.filter(v => v.position === "last") : [] as any
    // }

    protected actionsByPosition: { [key: string]: ListActionComponent[] } = {}
    protected readonly s = new Subscriptions()

    public constructor(
        @Inject(DataStorage) public readonly storage: DataStorage<T>,
        @Inject(DROPDOWN_ITEM_TPL) public readonly itemTpl: TemplateRef<DDContext<T>>,
        @Inject(DROPDOWN_ACTIONS) public readonly actions: QueryList<ListActionComponent>,
        @Inject(ChangeDetectorRef) protected cdr: ChangeDetectorRef,
        @Inject(DomSanitizer) protected sanitizer: DomSanitizer) {
    }

    public focusNext() {
        this.list.moveFocus(1)
        this.cdr.detectChanges()
    }

    public focusPrev() {
        this.list.moveFocus(-1)
        this.cdr.detectChanges()
    }

    public ngOnInit() {
        this.s.add(this.storage.items).subscribe(event => {
            this.cdr.detectChanges()
        })

        this.s.add(this.actions.changes).pipe(startWith(this.actions)).subscribe(items => {
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
        this.s.unsubscribe()
    }

    protected offset(index: number): number {
        return index + 1
            + (this.actionsByPosition.first ? this.actionsByPosition.first.length : 0)
    }
}
