import { InjectionToken, Inject, Provider, Optional } from "@angular/core"
import { HttpClient } from "@angular/common/http"
import { Observable, Observer, Subject, throwError } from "rxjs"
import { share, shareReplay } from "rxjs/operators"

import { LoadFields } from "../data-source"


export const RPC_ENDPOINT: InjectionToken<string> = new InjectionToken("@rpc.endpoint")
export const RPC_BATCHING: InjectionToken<number> = new InjectionToken("@rpc.batching")


export type MultiParams = Array<{
    ns: string,
    def: string,
    args: string
}>

export type MultiResult = Array<any>

export interface RpcAction {
    group: string
    action: string
}


export abstract class Transaction<T> {
    readonly isSuccess: boolean
    readonly response: Subject<T> = new Subject()

    public constructor(public readonly id: number) { }

    public success(value: T): void {
        (this as any).isSuccess = true
        this.response.next(value)
        this.response.complete()
    }

    public error(value: T): void {
        (this as any).isSuccess = false
        this.response.error(value)
    }

    public abstract render(): { [key: string]: any }
}


export type TransactionsDict = { [key: number]: Transaction<any> }

export type TransactionFactory = (id: number, ns: string, def: RpcAction, args: any[]) => Transaction<any>

export type RpcSuccessCallback = (tid: number, result: any) => void

export type RpcFailureCallback = (tid: number, result: RpcError) => void


export class RpcError implements Error {
    public constructor(
        public readonly message: string,
        public readonly response: any,
        public readonly name: string = "RpcError") {
    }
}


let counter: { [key: string]: number } = {}

export abstract class RpcTransport {
    // public static useEndpoint(endpoint: string): Provider {
    //     let cls: any = this
    //     return {
    //         provide: RpcTransport,
    //         deps: [HttpClient, [new Optional(), RPC_BATCHING]],
    //         useFactory(http: HttpClient, batchInterval: number) {
    //             return new cls(endpoint, http, batchInterval)
    //         }
    //     }
    // }

    public constructor(
        @Inject(RPC_ENDPOINT) public readonly endpoint: string,
        @Inject(HttpClient) protected readonly http: HttpClient,
        @Inject(RPC_BATCHING) @Optional() public readonly batchInterval: number) {
        if (!counter[endpoint]) {
            counter[endpoint] = 1
        }
    }

    public get batch(): Batch {
        if (!this._batch) {
            this._batch = new Batch()
        }
        return this._batch
    }
    protected _batch: Batch

    public send(action: RpcAction, args: any[], loadFields: LoadFields | null): Observable<any> {
        // console.log("rpc.send", { ns, def, args })
        let transaction = this.createTransaction(counter[this.endpoint]++, action, args, loadFields)
        if (this.batchInterval) {
            return this.batch.send(transaction)
        } else {
            return this._sendSingle(transaction)
        }
    }
    // protected abstract _sendSingle(trans: Transaction): Observable<any>

    // public abstract sendBatch(batch: Batch): Observable<MultiResult>
    public abstract createTransaction(
        id: number, action: RpcAction, args: any[], loadFields: LoadFields | null): Transaction<any>

    protected _sendSingle(transaction: Transaction<any>): Observable<any> {
        return Observable.create((observer: Observer<any>) => {
            let sub = this.http.post(this.endpoint, transaction.render(), { withCredentials: true })
                .subscribe(success => {
                    let body: any[] = Array.isArray(success) ? success : [success]
                    this._handleResponse(
                        { [transaction.id]: transaction },
                        body,
                        (tid, succ) => { observer.next(succ); observer.complete() },
                        (tid, err) => { observer.error(err); })

                    // try {
                    //     let res = this._handleResponse(response)
                    //     if (res[transaction.id]) {
                    //         observer.next(res[transaction.id])
                    //     } else {
                    //         throw new Error(`Wrong id in transaction response, expected: ${transaction.id}`)
                    //     }
                    // } catch (e) {
                    //     observer.error(e)
                    //     return
                    // }



                }, (error) => {
                    observer.error(error)
                })
            return () => {
                sub.unsubscribe()
            }
        }).pipe(share())
    }

    protected _sendBatch(batch: Batch): Observable<Array<{ tid: number, result: any }>> {
        return Observable.create((observer: Observer<any>) => {
            let notifySuccess = (tid: number, data: any) => {
                batch.success(tid, data)
                observer.next({ tid, result: data })
            }
            let notifyError = (tid: number, data: any) => {
                batch.error(tid, data)
                observer.error({ tid, result: data })
            }

            let sub = this.http.post(this.endpoint, batch.render(), { withCredentials: true })
                .subscribe((response: any[]) => {
                    let body: any[] = Array.isArray(response) ? response : [response]
                    this._handleResponse(batch.transactions, body, notifySuccess, notifyError)

                    observer.complete()
                }, (error) => {
                    observer.error(error)
                })
            return () => {
                sub.unsubscribe()
            }
        })
    }

    // protected abstract _handleResponse(response: any): { [key: number]: any }
    protected abstract _handleResponse(transactions: TransactionsDict, response: any[],
        success: RpcSuccessCallback,
        error: RpcFailureCallback): void
}


export class Batch {
    public readonly transactions: TransactionsDict = {}
    public successIds: number[]

    public get errorIds(): number[] {
        return Object.keys(this.transactions).map(Number).filter(v => this.successIds.indexOf(v) === -1)
    }

    public send(trans: Transaction<any>): Observable<any> {
        this.transactions[trans.id] = trans
        return Observable.create((observer: any) => {
            let s = trans.response.subscribe(observer)
            return () => {
                s.unsubscribe()
                this.cancel(trans)
            }
        })
    }

    public cancel(trans: Transaction<any>) {
        this.transactions[trans.id].response.complete()
    }

    public success(tid: number, data: any) {
        if (tid in this.transactions) {
            this.transactions[tid].success(data)
            if (!this.successIds) {
                this.successIds = []
            }
            if (this.successIds.indexOf(tid) === -1) {
                this.successIds.push(tid)
            }
        }
    }

    public error(tid: number, error: any) {
        if (tid in this.transactions) {
            this.transactions[tid].error(error)
        }
    }

    public render() {
        let res = []
        for (let k in this.transactions) {
            res.push(this.transactions[k].render())
        }
        return res
    }
}
