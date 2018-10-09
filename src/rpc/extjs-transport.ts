import { Observable, Subject, Observer } from "rxjs"
import { RpcTransport } from "./rpc-transport"

import { ActionDef } from "./rpc-source"
import { Transaction, TransactionsDict, TransactionResultFn } from "./rpc-transport"


let counter = 1


export class ExtjsTransaction extends Transaction<any> {
    public readonly response: Subject<any> = new Subject()

    public constructor(id: number,
        public readonly action: string,
        public readonly method: string,
        public readonly args: any[]) {
        super(id)
    }

    public render() {
        return {
            action: this.action,
            method: this.method,
            data: this.args,
            type: "rpc",
            tid: this.id
        }
    }
}


export class ExtjsTransport extends RpcTransport {
    protected pending: { [key: number]: ExtjsTransaction } = {}

    public createTransaction(id: number, ns: string, def: ActionDef, args: any[]): Transaction<any> {
        return new ExtjsTransaction(id, ns, def.name, args)
    }

    protected _handleResponse(transactions: TransactionsDict, response: any[], success: TransactionResultFn, error: TransactionResultFn): void {
        for (let res of response) {
            let tid = res.tid
            if (tid in transactions) {
                let result = res.result
                if ("success" in result) {
                    if (result.success) {
                        success(tid, this._minifyResultData(result))
                    } else {
                        error(tid, result)
                    }
                } else {
                    success(tid, result)
                }
            } else {
                error(tid, new Error(`Unrequested tid is returned in response: ${tid}`))
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

    // protected _handleResponse(response: any): { [key: number]: any } {
    //     let res: { [key: number]: any } = {}
    //     if (!Array.isArray(response)) {
    //         response = [response]
    //     }
    //     for (let r of response) {
    //         res[r.tid] = r.result
    //     }
    //     return res
    // }
}
