import { Injectable, Inject, EventEmitter, TemplateRef, StaticProvider, Injector } from "@angular/core"
import { Router, NavigationEnd } from "@angular/router"
import { Portal, ComponentType, ComponentPortal } from "@angular/cdk/portal"
import { Observable } from "rxjs"

import { DataSource, Model } from "../data.module"


export interface SearchConfig<T extends Model = Model> {
    dataSource: DataSource<T>
    label?: string
    suggestTpl?: TemplateRef<any>
    action?(value: T): void
}


export interface RSComponent {
    order: number,
    portal: Portal<any>
}


@Injectable()
export class ViewportService {
    public set title(value: string) {
        if (this._title !== value) {
            this._title = value;
            (this.titleChange as EventEmitter<string>).emit(value)
        }
    }
    public get title(): string { return this._title }
    protected _title: string
    public readonly titleChange: Observable<string> = new EventEmitter()


    public set back(value: any[] | string) {
        if (this._back !== value) {
            this._back = value;
            (this.backChange as EventEmitter<any[] | string>).emit(value)
        }
    }
    public get back(): any[] | string { return this._back }
    protected _back: any[] | string
    public readonly backChange: Observable<any[] | string> = new EventEmitter()


    // public set search(value: SearchConfig) {
    //     if (this._search !== value) {
    //         this._search = value;
    //         (this.searchChange as EventEmitter<SearchConfig>).emit(value)
    //     }
    // }
    // public get search(): SearchConfig { return this._search }
    // protected _search: SearchConfig
    // public readonly searchChange: Observable<SearchConfig> = new EventEmitter()

    public get rightside(): Readonly<RSComponent[]> { return this._rightside }

    protected _rightside: RSComponent[] = []

    public constructor(
        @Inject(Router) router: Router,
        @Inject(Injector) protected readonly injector: Injector) {
        // router.events.subscribe(event => {
        //     console.log(event, (event as any).type, (event as any).id)
        //     // if (event instanceof NavigationEnd) {
        //     //     this.title = null
        //     //     this.back = null
        //     //     this.search = null
        //     //     this._rightside = []
        //     // }
        // })
    }

    public init(title: string, back?: string) {
        this.title = title
        this.back = back
        this._rightside.length = 0
    }

    public addToRight(portal: Portal<any>, order?: number) {
        this._rightside.push({
            order: order == null ? this._rightside.length : order,
            portal
        })

        this._rightside = this._rightside.sort((a, b) => a.order - b.order)
    }

    public addRightComponent(cmp: ComponentType<any>, order?: number, provides?: StaticProvider[]) {
        let injector = provides ? Injector.create(provides, this.injector) : this.injector
        let portal = new ComponentPortal(cmp, null, injector)
        this.addToRight(portal, order)
    }
}
