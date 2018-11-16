import { Observable } from "rxjs"
import { map } from "rxjs/operators"

import { NzRange } from "../../util"
import { Model } from "../model"
import { Items } from "../collection"
import { LoadFields, Filter, Sorter } from "../data-source"
import { RpcDataSource } from "./rpc-source"
import {
    RpcTransport, Transaction, TransactionsDict, RpcAction, RpcError,
    RpcSuccessCallback, RpcFailureCallback
} from "./rpc-transport"


export class ExtjsTransaction extends Transaction<any> {
    public constructor(id: number,
        public readonly action: string,
        public readonly method: string,
        public readonly args: any[],
        public readonly lf: LoadFields) {
        super(id)
    }

    public render() {
        let args = this.lf && (this.action === "load_item" || this.action === "load_item_by") ? [...this.args, this.lf] : this.args
        if (this.action === "list_items") {
            if (args[0] && !args[0].required_fields) {
                args[0].required_fields = this.lf
            }
        }
        return {
            action: this.action,
            method: this.method,
            data: args,
            type: "rpc",
            tid: this.id
        }
    }
}


export class ExtjsTransport extends RpcTransport {
    protected pending: { [key: number]: ExtjsTransaction } = {}

    public createTransaction(id: number, action: RpcAction, args: any[], lf: LoadFields | null): Transaction<any> {
        return new ExtjsTransaction(id, action.group, action.action, args, lf)
    }

    protected _handleResponse(transactions: TransactionsDict, response: any[], success: RpcSuccessCallback, error: RpcFailureCallback): void {
        for (let res of response) {
            let tid = res.tid
            if (tid in transactions) {
                if (res.type === "exception") {
                    error(tid, new RpcError(res.message, res.exc_data, res.exc_type))
                } else if (res.type === "rpc") {
                    let result = res.result
                    if (result) {
                        if ("success" in result) {
                            if (result.success) {
                                success(tid, this._minifyResultData(result))
                            } else {
                                error(tid, new RpcError(result.msg, result))
                            }
                        } else {
                            success(tid, result)
                        }
                    } else {
                        success(tid, null)
                    }
                } else {
                    error(tid, new RpcError(`Unexpected response type received: ${res.type}`, res))
                }
            } else {
                error(tid, new RpcError(`Unrequested tid is returned in response: ${tid}`, null))
            }
        }
    }

    protected _minifyResultData(res: any): any {
        let keys = Object.keys(res).filter(v => v !== "success")
        if (keys.length === 1) {
            return res[keys[0]]
        }
        return res
    }
}


export interface ExtjsListItemsParam {
    filter?: Array<{ property: string, value: any }>
    sort?: Array<{ property: string, direction: "ASC" | "DESC" }>
    start: number
    limit: number
    required_fields?: LoadFields
}


export abstract class ExtjsDataSource<T extends Model = Model> extends RpcDataSource<T> {
    protected abstract list_items(params: ExtjsListItemsParam): Observable<T[]>

    protected _search(f?: Filter<T>, s?: Sorter<T>, r?: NzRange): Observable<T[]> {
        let params = {} as ExtjsListItemsParam

        if (f) {
            let filters: any[] = []
            for (const k in f) {
                filters.push({ property: k, value: f[k] })
            }
            params.filter = filters
        }

        if (s) {
            let sort: any[] = []
            for (const k in s) {
                sort.push({ property: k, direction: s[k] })
            }
            params.sort = sort
        }

        if (r) {
            params.start = r.begin
            params.limit = r.end - r.begin
        }

        params.required_fields = this.getLoadFields()

        return this.list_items(params)
            .pipe(map((v: any) => {
                if (v && Array.isArray(v.items)) {
                    return new Items(v.items, null, v.total)
                }
                return v
            }))
    }
}
