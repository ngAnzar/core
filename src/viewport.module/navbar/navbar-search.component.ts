import {
    Component, Inject, ElementRef, Host, ViewChild, Input, Output, ContentChild, ContentChildren, QueryList,
    TemplateRef, ChangeDetectorRef, Attribute, AfterViewInit, EventEmitter, HostListener, Directive
} from "@angular/core"
import { coerceBooleanProperty } from "@angular/cdk/coercion"
import { Observable } from "rxjs"


import { Destruct } from "../../util"
import { DataSourceDirective } from "../../data.module"
import { MediaQueryService, ShortcutService } from "../../common.module"
import { AutocompleteComponent, ListActionComponent } from "../../list.module"
import { ViewportService } from "../viewport.service"
import { SelectComponent } from "../../form.module"
import { SelectTemplateRef } from "../../form.module/input/select/select.component"
import { FormControl } from "@angular/forms"


@Directive()
abstract class SearchBase {
    @Input() public label: string

    @Input() public icon: string

    public readonly destruct = new Destruct()

    public constructor(@Inject(ViewportService) public readonly vps: ViewportService) {

    }
}



@Component({
    selector: ".nz-navbar-search:not([plainSearch])",
    templateUrl: "./navbar-search.template.pug",
    host: {
        "[attr.focused]": "focused ? '' : null",
        "[attr.opened]": "opened ? '' : null",
        "[attr.flat]": "vps.navbarCenterOverlap ? '' : null"
    }
})
export class NavbarSearchComponent extends SearchBase implements AfterViewInit {
    @ContentChild("selected", { read: TemplateRef, static: true }) public readonly selectedTpl: SelectTemplateRef<any>
    @ContentChild("item", { read: TemplateRef, static: true }) public readonly itemTpl: SelectTemplateRef<any>
    @ContentChildren(ListActionComponent) public readonly actions: QueryList<ListActionComponent>

    @ViewChild("select", { read: SelectComponent, static: true }) public readonly select: SelectComponent<any>

    public set empty(val: boolean) {
        if (this._empty !== val) {
            this._empty = val
            this.cdr.detectChanges()
        }
    }
    public get empty(): boolean { return this._empty }
    private _empty: boolean = true

    @Input()
    public set opened(val: boolean) {
        if (this._opened !== val) {
            this._opened = val
            if (val) {
                this.showSearch()
            } else {
                this.hideSearch()
            }
            this.cdr.detectChanges()
        }
    }
    public get opened(): boolean { return this._opened }
    private _opened: boolean

    public set focused(val: boolean) {
        if (this._focused !== val) {
            this._focused = val
            this.cdr.detectChanges()
        }
    }
    public get focused(): boolean { return this._focused }
    private _focused: boolean

    @Input()
    public set autoReset(val: boolean) {
        val = coerceBooleanProperty(val)
        if (this._autoReset !== val) {
            this._autoReset = val
            this.cdr.markForCheck()
        }
    }
    public get autoReset(): boolean { return this._autoReset }
    private _autoReset: boolean = false

    @Input()
    public set autoTrigger(val: boolean) {
        if (this._autoTrigger !== val) {
            this._autoTrigger = val
            this.cdr.markForCheck()
        }
    }
    public get autoTrigger(): boolean { return this._autoTrigger }
    private _autoTrigger: boolean = false

    public readonly AutocompleteComponent = AutocompleteComponent
    // private _backWatcher: KeyWatcher

    @Output("selectionChange") public readonly onSelect: Observable<any> = new EventEmitter()

    private _useOverlap: boolean = false

    public constructor(
        @Inject(ViewportService) vps: ViewportService,
        @Inject(ElementRef) el: ElementRef<any>,
        @Inject(DataSourceDirective) @Host() public readonly source: DataSourceDirective<any>,
        @Inject(ShortcutService) private readonly shortcut: ShortcutService,
        // @Inject(PointerEventService) pointerEvents: PointerEventService,
        @Inject(MediaQueryService) protected readonly mq: MediaQueryService,
        @Inject(ChangeDetectorRef) protected readonly cdr: ChangeDetectorRef,
        @Attribute("displayField") protected readonly displayField: string,
        @Attribute("valueField") protected readonly valueField: string,
        @Attribute("queryField") protected readonly queryField: string) {
        super(vps)

        this.shortcut.create(el.nativeElement, {
            "navbar-search.hide": { shortcut: "escape, back", handler: this.hideSearch.bind(this) }
        })

        this.destruct.subscription(mq.watch("xs")).subscribe(event => {
            this._useOverlap = event.matches
            if (event.matches && this.select && this.select.opened) {
                this.vps.navbarCenterOverlap = true
            }
        })
    }

    @HostListener("tap", ["$event"])
    public onTap(event: Event) {
        if (event.defaultPrevented) {
            return
        }

        if (this.select
            && this.select.el.nativeElement !== event.target
            && !this.select.el.nativeElement.contains(event.target as any)) {
            const input = this.select.el.nativeElement.querySelector("input[type='text']") as HTMLElement
            if (input) {
                input.focus()
            }
        }
    }

    public ngAfterViewInit() {
        if (this.displayField) {
            this.select.displayField = this.displayField
        }

        if (this.queryField) {
            this.select.queryField = this.queryField
        }

        if (this.valueField) {
            this.select.valueField = this.valueField
        }

        this.destruct.subscription(this.select.selection.changes).subscribe(sel => {
            let selected = sel[0]
            if (selected) {
                (this.onSelect as EventEmitter<any>).emit(selected)
            }
            if (this.autoReset) {
                this.hideSearch()
            }
        })
    }

    public showSearch() {
        this.vps.navbarCenterOverlap = this._useOverlap
        setTimeout(() => this.select.opened = true, 100)
    }

    public hideSearch() {
        this.select.reset()
        setTimeout(() => this.vps.navbarCenterOverlap = false, 300)
    }
}


@Component({
    selector: ".nz-navbar-search[plainSearch]",
    templateUrl: "./navbar-plain-search.template.pug",
    host: {
        "[attr.focused]": "focused ? '' : null",
        "[attr.opened]": "opened ? '' : null",
        "[attr.flat]": "vps.navbarCenterOverlap ? '' : null"
    }
})
export class NavbarPlainSearchComponent extends SearchBase {
    public readonly control = new FormControl()

    public get empty(): boolean {
        const value = this.control.value
        return !value || value.length === 0
    }

    @Output("plainSearch") public readonly valueChange = new EventEmitter()

    public constructor(@Inject(ViewportService) vps: ViewportService,) {
        super(vps)
    }

    public doSearch() {
        this.valueChange.next(this.control.value)
    }

    public doReset() {
        this.control.reset()
        this.valueChange.next(null)
    }
}
