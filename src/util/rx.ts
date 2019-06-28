// import { Observable, merge, zip } from "rxjs"
// import { debounceTime, switchMap, tap } from "rxjs/operators"



// export function dependentRx<T1>(time: number, o1: Observable<T1>): Observable<[T1]>
// export function dependentRx<T1, T2>(time: number, o1: Observable<T1>, o2: Observable<T2>): Observable<[T1, T2]>
// export function dependentRx<T1, T2, T3>(time: number, o1: Observable<T1>, o2: Observable<T2>, o3: Observable<T3>): Observable<[T1, T2, T3]>
// export function dependentRx<T1, T2, T3, T4>(time: number, o1: Observable<T1>, o2: Observable<T2>, o3: Observable<T3>, o4: Observable<T4>): Observable<[T1, T2, T3, T4]>

// export function dependentRx(time: number, o1: any, o2?: any, o3?: any, o4?: any) {
//     let o = [o1, o2, o3, o4].filter(v => !!v)

//     for (const v of o) {
//         v.subscribe((a: any) => console.log(v, a))
//     }

//     console.log(o)
//     return merge(...o).pipe(
//         debounceTime(time),
//         switchMap(v => zip(...o))
//     )
// }
