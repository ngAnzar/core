import {
    Component, Inject, InjectionToken, TemplateRef, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy,
    ViewChild, QueryList, OnInit
} from "@angular/core"
import { SafeStyle, DomSanitizer } from "@angular/platform-browser"
import { startWith } from "rxjs/operators"

import { DataStorage, Model, SelectionModel } from "../../data.module"
import { ListDirective } from "../list/list.directive"
import { ListActionComponent } from "../list/list-action.component"
import { Destruct } from "../../util"


export const AUTOCOMPLETE_ITEM_TPL = new InjectionToken<TemplateRef<any>>("autocomplete.itemTpl")
export const AUTOCOMPLETE_ACTIONS = new InjectionToken<QueryList<ListActionComponent>>("autocomplete.actions")


export class DDContext<T> {
    $implicit: T
}


@Component({
    selector: "nz-autocomplete",
    templateUrl: "./autocomplete.template.pug",
    styles: [
        `nz-autocomplete {
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
export class AutocompleteComponent<T extends Model> implements OnDestroy, OnInit {
    @ViewChild("list", { read: ListDirective }) protected readonly list: ListDirective

    public get gridTemplateRows(): SafeStyle {
        const actionsLength = this.actions ? this.actions.length : 0
        return this.sanitizer.bypassSecurityTrustStyle(`repeat(${this.storage.lastIndex + actionsLength}, 48px)`)
    }

    protected actionsByPosition: { [key: string]: ListActionComponent[] } = {}
    public readonly destruct = new Destruct()

    public constructor(
        @Inject(DataStorage) public readonly storage: DataStorage<T>,
        @Inject(AUTOCOMPLETE_ITEM_TPL) public readonly itemTpl: TemplateRef<DDContext<T>>,
        @Inject(AUTOCOMPLETE_ACTIONS) public readonly actions: QueryList<ListActionComponent>,
        @Inject(ChangeDetectorRef) protected cdr: ChangeDetectorRef,
        @Inject(DomSanitizer) protected sanitizer: DomSanitizer,
        @Inject(SelectionModel) protected selection: SelectionModel) {

        this.destruct.subscription(selection.changes).subscribe(() => {
            this.cdr.detectChanges()
        })
    }

    public ngOnInit() {
        this.destruct.subscription(this.storage.items).subscribe(event => {
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
