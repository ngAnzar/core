import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    Inject,
    Input,
    OnDestroy
} from "@angular/core"

import { BehaviorSubject, combineLatest, Observable, of, Subscriber } from "rxjs"
import { filter, finalize, map, shareReplay, switchMap, take } from "rxjs/operators"

import { Model, SelectOrigin } from "../data.module"
import { TreeComponent } from "./tree.component"

@Component({
    selector: ".nz-tree-item",
    templateUrl: "./tree-item.component.pug",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TreeItemComponent<T extends Model> implements OnDestroy {
    @Input() public level: number
    // @Input() public isNode: boolean

    @Input()
    public set model(val: T) {
        if (!Model.isEq(this.$implicit, val)) {
            if (this.$implicit) {
                this.tree.unregisterTreeItem(this)
            }

            this.$implicit = val
            this.tree.registerTreeItem(this)
            this.model$.next(val)
        }
    }
    public get model(): T {
        return this.$implicit
    }
    public $implicit: T
    private model$ = new BehaviorSubject<T>(null)

    public readonly isNode$: Observable<boolean> = this.model$.pipe(
        map(model => model && (model === this.tree.root || !(model as any)[this.tree.isLeafField])),
        shareReplay({ bufferSize: 1, refCount: true })
    )

    public set isBusy(val: boolean) {
        if (this._isBusy.value !== val) {
            this._isBusy.next(val)
        }
    }
    public get isBusy(): boolean {
        return this._isBusy.value
    }
    public readonly _isBusy = new BehaviorSubject<boolean>(false)

    public set isExpanded(val: boolean) {
        if (this._isExpanded.value !== val) {
            if (val) {
                this.isBusy = true
            }
            this._isExpanded.next(val)
            this.tree.onExpandedChange(this)
        }
    }
    public get isExpanded(): boolean {
        return this._isExpanded.value
    }
    public readonly _isExpanded = new BehaviorSubject<boolean>(false)

    public get selected(): SelectOrigin {
        return this._selected
    }
    private _selected: SelectOrigin = null

    readonly children$ = combineLatest({ isNode: this.isNode$, isExpanded: this._isExpanded }).pipe(
        switchMap(({ isExpanded, isNode }) => {
            if (!isExpanded || !isNode) {
                this.isBusy = false
                return of([])
            }

            this.isBusy = true
            return this.tree.loadChildren(this).pipe(
                take(1),
                finalize(() => (this.isBusy = false))
            )
        }),
        shareReplay({ bufferSize: 1, refCount: true })
    )

    public readonly height = 32

    public constructor(
        @Inject(ElementRef) public readonly el: ElementRef<HTMLElement>,
        @Inject(ChangeDetectorRef) private readonly cdr: ChangeDetectorRef,
        @Inject(TreeComponent) public readonly tree: TreeComponent
    ) {
        this.children$.subscribe()
    }

    public expand(): Observable<T[]> {
        return new Observable(dst => {
            this.isBusy = true
            dst.add(
                this._isBusy
                    .pipe(
                        filter(isBusy => !isBusy),
                        switchMap(() => this.children$),
                        take(1)
                    )
                    .subscribe(dst)
            )
            this.isExpanded = true
        })
    }

    public collapse(): Observable<void> {
        return new Observable((dst: Subscriber<void>) => {
            dst.add(
                this.children$.subscribe(children => {
                    if (children.length === 0) {
                        setTimeout(() => {
                            dst.next()
                            dst.complete()
                        }, 200)
                    }
                })
            )
            this.isExpanded = false
            this.isBusy = false
        })
    }

    public ngOnDestroy() {
        this.$implicit && this.tree.unregisterTreeItem(this)
    }

    public onItemTap(event: Event) {
        if (event.defaultPrevented) {
            return
        }
        this.isExpanded = !this.isExpanded
    }

    public onSelectionChange(origin: SelectOrigin) {
        if (this._selected !== origin) {
            this._selected = origin
            this.cdr.detectChanges()
        }
    }

    public toggleSelected(event: Event) {
        if (event.defaultPrevented) {
            return
        }
        event.preventDefault()

        const selection = this.tree.selection

        if (selection.getSelectOrigin(this.model.pk)) {
            selection.setSelected(this.model.pk, null)
        } else {
            selection.setSelected(this.model.pk, "mouse")
        }
    }
}
